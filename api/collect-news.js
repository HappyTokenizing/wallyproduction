import { timingSafeEqual } from 'node:crypto';
import { collectNews } from '../lib/news-collection.js';
export function createCollector({ env = process.env, collect = collectNews } = {}) {
  return async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });
    // A mirrored staging project must never become a second writer to production.
    if (env.SITE_PUBLIC_API_ORIGIN) return res.status(200).json({ skipped: 'Public-data mirror' });
    const actual = Buffer.from(req.headers?.authorization || ''), expected = Buffer.from('Bearer ' + (env.CRON_SECRET || ''));
    if (!env.CRON_SECRET || actual.length !== expected.length || !timingSafeEqual(actual, expected)) return res.status(401).json({ error: 'Unauthorized' });
    try { const data = await collect({ env }); return res.status(200).json({ ok: true, captured: data.items.length }); }
    catch { console.error('News collection failed; no success acknowledged'); return res.status(503).json({ error: 'News collection failed. Check feed and archive configuration.' }); }
  };
}
export default createCollector();
