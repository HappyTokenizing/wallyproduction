import { archiveNews } from './news-archive.js';
export async function collectNews({ env = process.env, fetcher = fetch, archive = archiveNews } = {}) {
  if (!env.RWANEWS_KEY) throw Error('News feed is not configured');
  const r = await fetcher('https://www.rwanews.today/v1/feed?key=' + encodeURIComponent(env.RWANEWS_KEY), { signal: AbortSignal.timeout(20000) });
  if (!r.ok) throw Error('News feed unavailable');
  const data = await r.json();
  if (!Array.isArray(data.items)) throw Error('Invalid news feed');
  await archive(data.items, { env }); // Complete persistence before acknowledging collection.
  return data;
}
