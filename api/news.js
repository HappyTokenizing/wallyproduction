import { mirrorPublicData } from '../lib/public-data.js';
import { readArchive, archiveStatus } from '../lib/news-archive.js';
import { collectNews } from '../lib/news-collection.js';
import { newsPage } from '../lib/news-page.js';
// RWA news for the site — Vercel serverless function.
//   GET  /api/news           → the rwanews.today feed, permanent archive, paginated and cached for five minutes
//                              (scheduled collection runs independently of visitors).
//   GET  /api/news?hidden=1  → ids the console has deleted (uncached, so a
//                              deletion disappears for everyone immediately).
//   POST /api/news           → {pw, action:'hide'|'unhide', id} console moderation.
// Every feed pull is also saved to the private news archive that powers each company's "Company news".
// Env vars (Vercel): RWANEWS_KEY, BLOB_READ_WRITE_TOKEN, CRON_SECRET, SUPABASE_JOBS_SECRET, JOBS_ADMIN_PW.
const SB = 'https://qrmbiestcjbedavsorrj.supabase.co/rest/v1/wally_site';
const MAX_HIDDEN = 500;

function sbHeaders(key) {
  return { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' };
}
export async function readHidden(key) {
  try {
    const r = await fetch(SB + '?k=eq.news_hidden&select=v', { headers: sbHeaders(key) });
    if (!r.ok) return [];
    const rows = await r.json();
    return ((rows[0] || {}).v || {}).ids || [];
  } catch (e) { return []; }
}

export default async function handler(req, res) {
  if (await mirrorPublicData(req, res, '/api/news')) return;
  const sk = process.env.SUPABASE_JOBS_SECRET;

  if (req.method === 'GET') {
    if (req.query && req.query.hidden) {
      res.setHeader('Cache-Control', 'no-store');
      res.status(200).json({ ids: sk ? await readHidden(sk) : [] });
      return;
    }
    try {
      let collectionWarning = null;
      // Cron is primary; first-page reads also recover promptly after an outage.
      if (!req.query?.cursor) {
        try { await collectNews(); } catch { collectionWarning = 'Latest collection failed; showing saved news.'; }
      }
      const [{ items }, status] = await Promise.all([readArchive(), archiveStatus()]);
      if (!items.length && collectionWarning) return res.status(503).json({ error: 'News archive unavailable. Check storage and feed configuration.' });
      const hidden = new Set(sk ? await readHidden(sk) : []);
      const page = newsPage(items.filter(x => !hidden.has(x.id)), req.query);
      res.setHeader('Cache-Control', collectionWarning ? 'no-store' : 's-maxage=300, stale-while-revalidate=60');
      res.status(200).json({ ...page, archive: { retention: 'indefinite', stored: items.length, lastSuccessfulCollection: status?.lastSuccessfulCollection || null, warning: collectionWarning } });
    } catch (e) {
      res.setHeader('Cache-Control', 'no-store');
      res.status(e.message === 'Invalid cursor' ? 400 : 503).json({ error: e.message === 'Invalid cursor' ? 'Invalid cursor' : 'News archive unavailable. Check storage configuration.' });
    }
    return;
  }

  if (req.method !== 'POST') { res.status(405).json({ error: 'GET or POST only' }); return; }
  const pw = process.env.JOBS_ADMIN_PW;
  if (!sk || !pw) { res.status(500).json({ error: 'server not configured' }); return; }
  const b = req.body || {};
  if (b.pw !== pw) { res.status(401).json({ error: 'bad password' }); return; }
  const id = String(b.id || '').slice(0, 200);
  if (!id || (b.action !== 'hide' && b.action !== 'unhide')) {
    res.status(400).json({ error: 'action hide/unhide and id required' }); return;
  }
  try {
    let ids = await readHidden(sk);
    ids = ids.filter(x => x !== id);
    if (b.action === 'hide') ids.push(id);
    ids = ids.slice(-MAX_HIDDEN);
    const r = await fetch(SB + '?on_conflict=k', {
      method: 'POST',
      headers: { ...sbHeaders(sk), Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify({ k: 'news_hidden', v: { ids }, updated_at: new Date().toISOString() })
    });
    res.status(r.ok ? 200 : 502).json(r.ok ? { ok: true, ids } : { error: 'db write failed — is the wally_site table created?' });
  } catch (e) { res.status(500).json({ error: 'server error' }); }
}
