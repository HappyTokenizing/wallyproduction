import { get, put, list } from '@vercel/blob';
import { mergeArchive, slimItem } from '../assets/company-news-match.js';
// v1 is retained and read for compatibility. v2 partitions by publication month;
// neither migration, moderation nor collection deletes any historical story.
export const ARCHIVE_PATH = 'news-archive/v1/items.json';
export const ARCHIVE_PREFIX = 'news-archive/v2/months/';
export const STATUS_PATH = 'news-archive/v2/status.json';
const blob = env => ({ access: 'private', token: env.BLOB_READ_WRITE_TOKEN });
function configured(env) { if (!env.BLOB_READ_WRITE_TOKEN) throw Error('News archive storage is not configured'); }
async function read(path, env, storage) {
  const r = await storage.get(path, { ...blob(env), useCache: false, headers: { 'Accept-Encoding': 'identity' } });
  if (!r) return { value: null, etag: null };
  return { value: await new Response(r.stream).json(), etag: r.blob.etag };
}
export async function readArchive({ env = process.env, storage = { get, list } } = {}) {
  configured(env);
  const old = await read(ARCHIVE_PATH, env, storage);
  if(old.value&&!Array.isArray(old.value.items))throw Error('Invalid legacy archive');
  const paths = []; let cursor;
  do {
    const page = await storage.list({ token: env.BLOB_READ_WRITE_TOKEN, prefix: ARCHIVE_PREFIX, limit: 1000, ...(cursor ? { cursor } : {}) });
    paths.push(...page.blobs.map(b => b.pathname)); cursor = page.hasMore ? page.cursor : undefined;
    if (page.hasMore && !cursor) throw Error('Incomplete archive listing');
  } while (cursor);
  let items = old.value?.items || [];
  // Bounded concurrent reads; never truncate the list of months or stories.
  for (let i = 0; i < paths.length; i += 6) {
    const months = await Promise.all(paths.slice(i, i + 6).map(p => read(p, env, storage)));
    for (const month of months) {
      if (!Array.isArray(month.value?.items)) throw Error('Unreadable archive partition');
      items = mergeArchive(items, month.value.items);
    }
  }
  return { items: mergeArchive([], items), etag: old.etag };
}
export async function archiveNews(items, { env = process.env, storage = { get, put }, now = Date.now } = {}) {
  configured(env);
  if (!Array.isArray(items)) throw Error('Invalid news feed');
  const groups = new Map();
  for (const raw of items) {
    const item = slimItem(raw);
    if (!item) throw Error('Invalid story: collection was not fully archived');
    const t = Date.parse(item.published_at || ''), month = Number.isFinite(t) ? new Date(t).toISOString().slice(0, 7) : 'undated';
    const path = ARCHIVE_PREFIX + month + '.json';
    if (!groups.has(path)) groups.set(path, []);
    groups.get(path).push(item);
  }
  let changed = false;
  for (const [path, fresh] of groups) {
    let saved = false;
    for (let attempt = 0; attempt < 5; attempt++) {
      const { value, etag } = await read(path, env, storage);
      if (value && !Array.isArray(value.items)) throw Error('Invalid archive partition');
      const merged = mergeArchive(value?.items || [], fresh);
      if (value && JSON.stringify(merged) === JSON.stringify(value.items)) { saved = true; break; }
      try {
        await storage.put(path, JSON.stringify({ updated_at: new Date(now()).toISOString(), items: merged }),
          { ...blob(env), contentType: 'application/json', addRandomSuffix: false, allowOverwrite: !!etag, ...(etag ? { ifMatch: etag } : {}) });
        saved = true; changed = true; break;
      } catch (error) { if (attempt === 4) throw error; } // Re-read before retry; never overwrite a concurrent writer.
    }
    if (!saved) throw Error('Archive write did not complete');
  }
  await storage.put(STATUS_PATH, JSON.stringify({ lastSuccessfulCollection: new Date(now()).toISOString(), captured: items.length, retention: 'indefinite' }),
    { ...blob(env), contentType: 'application/json', addRandomSuffix: false, allowOverwrite: true });
  return changed;
}
export async function archiveStatus({ env = process.env, storage = { get } } = {}) {
  configured(env); return (await read(STATUS_PATH, env, storage)).value;
}
