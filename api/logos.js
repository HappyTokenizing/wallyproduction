// Member-logo store — Vercel serverless function.
// The console's logo state (order / deletions / uploads) lives server-side so a
// change made in the admin applies to EVERY visitor, not just that one browser.
//   GET  /api/logos → {store} the saved state (briefly cached)
//   POST /api/logos → {pw, store} save it (console only)
// Env vars (Vercel): SUPABASE_JOBS_SECRET, JOBS_ADMIN_PW.
const SB = 'https://qrmbiestcjbedavsorrj.supabase.co/rest/v1/wally_site';

function sbHeaders(key) {
  return { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' };
}

export default async function handler(req, res) {
  const sk = process.env.SUPABASE_JOBS_SECRET;

  if (req.method === 'GET') {
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=600');
    if (!sk) { res.status(200).json({ store: null }); return; }
    try {
      const r = await fetch(SB + '?k=eq.logos&select=v', { headers: sbHeaders(sk) });
      const rows = r.ok ? await r.json() : [];
      res.status(200).json({ store: (rows[0] || {}).v || null });
    } catch (e) { res.status(200).json({ store: null }); }
    return;
  }

  if (req.method !== 'POST') { res.status(405).json({ error: 'GET or POST only' }); return; }
  const pw = process.env.JOBS_ADMIN_PW;
  if (!sk || !pw) { res.status(500).json({ error: 'server not configured' }); return; }
  const b = req.body || {};
  if (b.pw !== pw) { res.status(401).json({ error: 'bad password' }); return; }
  const s = b.store || {};
  const store = {
    order: Array.isArray(s.order) ? s.order.slice(0, 200).map(x => String(x).slice(0, 40)) : [],
    del: Array.isArray(s.del) ? s.del.slice(0, 200).map(x => String(x).slice(0, 40)) : [],
    add: Array.isArray(s.add) ? s.add.slice(0, 100).map(l => ({
      id: String(l.id || '').slice(0, 40),
      name: String(l.name || '').slice(0, 60),
      src: (typeof l.src === 'string' && /^data:image\//.test(l.src) && l.src.length <= 500000) ? l.src : null
    })).filter(l => l.id && l.src) : []
  };
  try {
    const r = await fetch(SB + '?on_conflict=k', {
      method: 'POST',
      headers: { ...sbHeaders(sk), Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify({ k: 'logos', v: store, updated_at: new Date().toISOString() })
    });
    res.status(r.ok ? 200 : 502).json(r.ok ? { ok: true } : { error: 'db write failed — is the wally_site table created?' });
  } catch (e) { res.status(500).json({ error: 'server error' }); }
}
