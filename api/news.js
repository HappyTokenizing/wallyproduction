// RWA news for the site — Vercel serverless function.
//   GET  /api/news           → the rwanews.today feed, edge-cached for an hour
//                              (this is the "pull hourly": the key never reaches
//                              the browser, and at most one upstream fetch/hour).
//   GET  /api/news?hidden=1  → ids the console has deleted (uncached, so a
//                              deletion disappears for everyone immediately).
//   POST /api/news           → {pw, action:'hide'|'unhide', id} console moderation.
// Env vars (Vercel): RWANEWS_KEY, SUPABASE_JOBS_SECRET, JOBS_ADMIN_PW.
const SB = 'https://qrmbiestcjbedavsorrj.supabase.co/rest/v1/wally_site';
const FEED = 'https://www.rwanews.today/v1/feed';
const MAX_HIDDEN = 500;

function sbHeaders(key) {
  return { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' };
}
async function readHidden(key) {
  try {
    const r = await fetch(SB + '?k=eq.news_hidden&select=v', { headers: sbHeaders(key) });
    if (!r.ok) return [];
    const rows = await r.json();
    return ((rows[0] || {}).v || {}).ids || [];
  } catch (e) { return []; }
}

export default async function handler(req, res) {
  const sk = process.env.SUPABASE_JOBS_SECRET;

  if (req.method === 'GET') {
    if (req.query && req.query.hidden) {
      res.setHeader('Cache-Control', 'no-store');
      res.status(200).json({ ids: sk ? await readHidden(sk) : [] });
      return;
    }
    const key = process.env.RWANEWS_KEY;
    if (!key) { res.status(500).json({ error: 'server not configured: RWANEWS_KEY missing' }); return; }
    try {
      const r = await fetch(FEED + '?key=' + encodeURIComponent(key));
      if (!r.ok) { res.status(502).json({ error: 'feed unavailable' }); return; }
      const data = await r.json();
      res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=600');
      res.status(200).json(data);
    } catch (e) { res.status(500).json({ error: 'server error' }); }
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
