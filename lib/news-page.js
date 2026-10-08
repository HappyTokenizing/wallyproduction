import { mergeArchive } from '../assets/company-news-match.js';
// Cursor is the last story's sort key, so new arrivals cannot shift older pages.
export function newsPage(items, query = {}) {
  const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit, 10) || 50));
  const ordered = mergeArchive([], items);
  let cursor;
  if (query.cursor) {
    try { cursor = JSON.parse(Buffer.from(String(query.cursor), 'base64url').toString()); } catch { throw Error('Invalid cursor'); }
    if (!Array.isArray(cursor) || cursor.length !== 2 || !Number.isFinite(cursor[0]) || typeof cursor[1] !== 'string') throw Error('Invalid cursor');
  }
  const time = x => Date.parse(x.published_at || '') || 0;
  const q = String(query.q || '').trim().toLowerCase();
  const matches = ordered.filter(x => !q || [x.headline, x.summary, x.source?.name, ...(x.universe_tags || []), ...(x.members || [])].join(' ').toLowerCase().includes(q));
  const after = matches.filter(x => !cursor || time(x) < cursor[0] || (time(x) === cursor[0] && String(x.id).localeCompare(cursor[1]) > 0));
  const page = after.slice(0, limit), last = page.at(-1);
  return { items: page, total: matches.length, nextCursor: after.length > limit ? Buffer.from(JSON.stringify([time(last), last.id])).toString('base64url') : null };
}
