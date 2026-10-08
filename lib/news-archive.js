import { get, put } from '@vercel/blob';
import { mergeArchive } from '../assets/company-news-match.js';
// The news feed only carries the latest ~50 stories, so every story it serves is kept here, privately, and
// each company's profile reads its own news from this archive ("Company news"). Writes happen when
// /api/news pulls the feed (about hourly behind the edge cache). Everything fails soft: the news page
// never waits on, or breaks because of, the archive.
export const ARCHIVE_PATH = 'news-archive/v1/items.json';
const blob = env => ({ access: 'private', token: env.BLOB_READ_WRITE_TOKEN });

export async function readArchive({ env = process.env, storage = { get } } = {}) {
  if (!env.BLOB_READ_WRITE_TOKEN) return { items: [], etag: null };
  const r = await storage.get(ARCHIVE_PATH, { ...blob(env), useCache: false, headers: { 'Accept-Encoding': 'identity' } });
  if (!r) return { items: [], etag: null };
  const value = await new Response(r.stream).json();
  return { items: Array.isArray(value.items) ? value.items : [], etag: r.blob.etag };
}

export async function archiveNews(items, { env = process.env, storage = { get, put }, now = Date.now } = {}) {
  if (!env.BLOB_READ_WRITE_TOKEN || !Array.isArray(items) || !items.length) return false;
  for (let attempt = 0; attempt < 2; attempt++) { // a concurrent writer wins the race: re-read and merge again
    const { items: archived, etag } = await readArchive({ env, storage });
    const merged = mergeArchive(archived, items);
    if (etag && merged.length === archived.length && merged.every((x, i) => x.id === archived[i].id)) return false; // nothing new
    try {
      await storage.put(ARCHIVE_PATH, JSON.stringify({ updated_at: new Date(now()).toISOString(), items: merged }),
        { ...blob(env), contentType: 'application/json', addRandomSuffix: false, allowOverwrite: !!etag, ...(etag ? { ifMatch: etag } : {}) });
      return true;
    } catch { /* precondition failed: retry once */ }
  }
  return false;
}
