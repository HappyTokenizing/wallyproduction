import { readFileSync } from 'node:fs';
import { readArchive } from '../lib/news-archive.js';
import { readHidden } from './news.js';
import { newsPage } from '../lib/news-page.js';
import { companyNews } from '../assets/company-news-match.js';
import {readApprovedEcosystemRecords} from './ecosystem.js';
import {applyEcosystemUpdates} from '../assets/ecosystem-updates-model.js';
// Company news for one ecosystem profile — Vercel serverless function.
//   GET /api/company-news?id=<profile id> → the archived feed stories that mention that company, newest first.
// Stories come from the private news archive kept by /api/news; console-hidden stories are left out.
// Staging forwards to production's public endpoint, like the other public feeds (no keys on staging).
const directory = JSON.parse(readFileSync(new URL('../data/ecosystem-directory.json', import.meta.url)));
const byId = new Map(directory.profiles.map(p => [p.id, p]));

export function createCompanyNewsHandler({ env = process.env, fetcher = fetch, archive = readArchive, hidden = readHidden, profiles = byId, updates = readApprovedEcosystemRecords } = {}) {
  return async function handler(req, res) {
    if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).json({ error: 'GET only' }); }
    const id = String(req.query?.id || '');
    if (!/^[a-z0-9][a-z0-9._-]{0,100}$/i.test(id)) return res.status(400).json({ error: 'Unknown company' });
    if (env.SITE_PUBLIC_API_ORIGIN) {
      try {
        const url = new URL('/api/company-news', env.SITE_PUBLIC_API_ORIGIN); url.searchParams.set('id', id);
        for (const key of ['cursor', 'limit']) if (req.query?.[key]) url.searchParams.set(key, String(req.query[key]));
        const r = await fetcher(url, { signal: AbortSignal.timeout(15000) });
        res.setHeader('Cache-Control', 's-maxage=300');
        return res.status(r.status).json(await r.json());
      } catch { return res.status(502).json({ error: 'Company news is temporarily unavailable.' }); }
    }
    try {
      let profile = profiles.get(id);
      if(!profile && id.startsWith('submitted-') && env.BLOB_READ_WRITE_TOKEN) {
        const payload=await updates(env);
        profile=applyEcosystemUpdates(directory,payload).profiles.find(p=>p.id===id);
      }
      if (!profile) return res.status(404).json({ error: 'Unknown company' });
      const [{ items }, ids] = await Promise.all([archive({ env }), env.SUPABASE_JOBS_SECRET ? hidden(env.SUPABASE_JOBS_SECRET).catch(() => []) : []]);
      res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=300');
      return res.status(200).json({ id, ...newsPage(companyNews(items, profile, { hidden: ids }), req.query), archived: items.length });
    } catch (e) {
      if (e.message === 'Invalid cursor') return res.status(400).json({ error: 'Invalid cursor' });
      return res.status(503).json({ error: 'Company news is temporarily unavailable.' });
    }
  };
}
export default createCompanyNewsHandler();
