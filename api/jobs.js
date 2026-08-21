// WALLY Job Board write path — Vercel serverless function.
// Public reads never touch this file (the site reads Supabase directly with the
// read-only publishable key). This function handles writes using two env vars
// set in the Vercel project:
//   SUPABASE_JOBS_SECRET — a Supabase secret API key (server-side only)
//   JOBS_ADMIN_PW        — the console password for admin actions
const SB = 'https://qrmbiestcjbedavsorrj.supabase.co/rest/v1/wally_jobs';
const ALLOWED = ['company','role','type','work','location','comp','tags','description','apply_to','email','member'];

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.status(405).json({ error: 'POST only' }); return; }
  const key = process.env.SUPABASE_JOBS_SECRET;
  const adminPw = process.env.JOBS_ADMIN_PW;
  if (!key) { res.status(500).json({ error: 'server not configured' }); return; }
  const b = req.body || {};
  const H = { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' };
  const authed = !!adminPw && b.pw === adminPw;
  try {
    if (b.action === 'submit') {
      // Public "Post a job" — always lands as status 'pending' for review.
      const j = b.job || {};
      if (j.website) { res.status(200).json({ ok: true }); return; } // honeypot field
      const row = {};
      for (const k of ALLOWED) { if (j[k] != null) row[k] = j[k]; }
      if (!row.company || !row.role) { res.status(400).json({ error: 'company and role required' }); return; }
      for (const k of Object.keys(row)) { if (typeof row[k] === 'string') row[k] = row[k].slice(0, 2000); }
      if (Array.isArray(row.tags)) { row.tags = row.tags.slice(0, 4).map(t => String(t).slice(0, 40)); } else { delete row.tags; }
      row.member = row.member ? 1 : 0;
      row.status = 'pending';
      row.src = 'site';
      const r = await fetch(SB, { method: 'POST', headers: H, body: JSON.stringify(row) });
      res.status(r.ok ? 200 : 502).json(r.ok ? { ok: true } : { error: 'db write failed' });
      return;
    }
    if (!authed) { res.status(401).json({ error: 'bad password' }); return; }
    if (b.action === 'list_all') {
      const r = await fetch(SB + '?select=*&order=ts.desc', { headers: H });
      res.status(200).json(await r.json());
      return;
    }
    if (b.action === 'save') {
      // Upsert a full row (approve, edit, feature, hide, close, renew).
      const j = b.job || {};
      if (!j.id) { res.status(400).json({ error: 'id required' }); return; }
      j.updated_at = new Date().toISOString();
      const r = await fetch(SB + '?on_conflict=id', {
        method: 'POST',
        headers: { ...H, Prefer: 'resolution=merge-duplicates' },
        body: JSON.stringify(j)
      });
      res.status(r.ok ? 200 : 502).json(r.ok ? { ok: true } : { error: 'db write failed' });
      return;
    }
    if (b.action === 'delete') {
      const r = await fetch(SB + '?id=eq.' + encodeURIComponent(b.id || ''), { method: 'DELETE', headers: H });
      res.status(r.ok ? 200 : 502).json(r.ok ? { ok: true } : { error: 'db delete failed' });
      return;
    }
    res.status(400).json({ error: 'unknown action' });
  } catch (e) {
    res.status(500).json({ error: 'server error' });
  }
}
