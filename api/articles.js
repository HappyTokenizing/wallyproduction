import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { get, put } from '@vercel/blob';

export const SOURCES = { wally: { name: 'WALLY articles', username: 'WALLY_DAO' }, zeus: { name: "Zeus’ Corner", username: 'ZeusRWA' } };
const HOUR = 3600000;
const safeImage = value => { try { const u = new URL(value); return u.protocol === 'https:' && (u.hostname === 'pbs.twimg.com' || u.hostname.endsWith('.twimg.com')) ? u.href : null; } catch { return null; } };
export function extractArticles(payload, source) {
  const media = new Map((payload.includes?.media || []).map(m => [m.media_key, m]));
  const seen = new Set();
  return (payload.data || []).flatMap(post => {
    const links = [...(post.entities?.urls || []), ...(post.note_tweet?.entities?.urls || [])];
    const link = links.find(l => { try { const u = new URL(l.unwound_url || l.expanded_url); return ['x.com', 'twitter.com', 'www.x.com'].includes(u.hostname) && /^\/(?:i|[\w]+)\/article\/\d+/.test(u.pathname); } catch { return false; } });
    const a = post.article;
    if (!a && !link) return [];
    const title = a?.title || post.article_title?.title || (typeof post.article_title === 'string' ? post.article_title : '') || link?.title;
    if (typeof title !== 'string' || !title.trim() || !/^\d+$/.test(post.id)) return [];
    const articleId = String(a?.id || '').match(/^\d+$/)?.[0];
    const url = articleId ? `https://x.com/i/article/${articleId}` : link ? (link.unwound_url || link.expanded_url) : `https://x.com/${source.username}/status/${post.id}`;
    if (seen.has(url)) return []; seen.add(url);
    const cover = a?.cover_media; const image = (typeof cover === 'string' ? media.get(cover)?.url : cover?.url || media.get(cover?.media_key)?.url) || media.get(a?.cover_media_key)?.url || link?.images?.[0]?.url;
    const text = a?.preview_text || a?.description || link?.description || post.note_tweet?.text || post.text || '';
    return [{ id: post.id, title: title.trim(), excerpt: String(text).replace(/https:\/\/t\.co\/\S+/g, '').trim().slice(0, 700), url, image: safeImage(image), published_at: post.created_at || null, author: source.username }];
  });
}
function encodeCursor(token, source, secret) {
  if (!token) return null;
  const body = Buffer.from(JSON.stringify({ source, token })).toString('base64url');
  return body + '.' + createHmac('sha256', secret).update(body).digest('base64url');
}
function decodeCursor(cursor, source, secret) {
  if (!cursor) return '';
  if (typeof cursor !== 'string' || cursor.length > 3000) throw Error('cursor');
  const [body, sig] = cursor.split('.');
  const expected = createHmac('sha256', secret).update(body).digest();
  const provided = Buffer.from(sig || '', 'base64url');
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) throw Error('cursor');
  const d = JSON.parse(Buffer.from(body, 'base64url').toString());
  if (d.source !== source || typeof d.token !== 'string') throw Error('cursor');
  return d.token;
}
export function createArticlesHandler({ env = process.env, fetcher = fetch, storage = { get, put }, now = Date.now } = {}) {
  return async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).json({ error: 'GET only' }); }
    const key = req.query?.source;
    if (!Object.hasOwn(SOURCES, key || '')) return res.status(400).json({ error: 'Unknown article source' });
    let source = { ...SOURCES[key], username: env[key === 'wally' ? 'X_WALLY_USERNAME' : 'X_ZEUS_USERNAME'] || SOURCES[key].username };
    if (!/^[A-Za-z0-9_]{1,15}$/.test(source.username)) return res.status(503).json({ error: 'Article account is not configured.' });
    if (env.SITE_PUBLIC_API_ORIGIN) {
      const url = new URL('/api/articles', env.SITE_PUBLIC_API_ORIGIN); url.searchParams.set('source', key);
      if (typeof req.query?.cursor === 'string') url.searchParams.set('cursor', req.query.cursor);
      try { const r = await fetcher(url, { signal: AbortSignal.timeout(25000) }); return res.status(r.status).json(await r.json()); }
      catch { return res.status(503).json({ error: 'Articles are temporarily unavailable.' }); }
    }
    const secret = env.X_BEARER_TOKEN, blob = { access: 'private', token: env.BLOB_READ_WRITE_TOKEN };
    if (!secret || !blob.token) return res.status(503).json({ error: 'The X article connection is not configured.', source });
    let cursor;
    try { cursor = decodeCursor(req.query?.cursor, key, secret); } catch { return res.status(400).json({ error: 'Invalid article cursor' }); }
    const path = `x-articles/v1/${key}/${createHash('sha256').update(cursor).digest('hex')}.json`;
    let cached, revision;
    try {
      const r = await storage.get(path, { ...blob, useCache: false, headers: { 'Accept-Encoding': 'identity' } });
      if (r) { cached = await new Response(r.stream).json(); revision = r.blob.etag; }
    } catch { return res.status(503).json({ error: 'Articles are temporarily unavailable.', source }); }
    const reply = (value, stale = false) => res.status(200).json({ items: value.items, next_cursor: encodeCursor(value.next, key, secret), source: value.source || source, updated_at: value.updated_at, stale });
    if (cached?.updated_at && now() - Date.parse(cached.updated_at) < HOUR) return reply(cached);
    if (cached?.retryAfter > now()) return cached.updated_at ? reply(cached, true) : res.status(503).json({ error: 'The X feed is temporarily unavailable. Please try again later.', source });
    // Claim a short refresh lease before contacting X. Concurrent visitors use
    // the saved copy, so traffic spikes do not multiply paid API requests.
    try {
      const locked = await storage.put(path, JSON.stringify({ ...cached, retryAfter: now() + 60000 }), { ...blob, contentType: 'application/json', addRandomSuffix: false, allowOverwrite: !!revision, ...(revision ? { ifMatch: revision } : {}) });
      revision = locked.etag;
    } catch { return cached?.updated_at ? reply(cached, true) : res.status(503).json({ error: 'The article feed is updating. Please retry shortly.', source }); }
    const save = value => storage.put(path, JSON.stringify(value), { ...blob, contentType: 'application/json', addRandomSuffix: false, allowOverwrite: true, ifMatch: revision });
    const x = async url => {
      const r = await fetcher(url, { headers: { Authorization: 'Bearer ' + secret }, signal: AbortSignal.timeout(12000) });
      if (!r.ok) { const e = Error('X request failed'); e.status = r.status; throw e; }
      return r.json();
    };
    try {
      // Keep account identity separately from timeline pages. X usernames can
      // change; once resolved, always follow the permanent user ID.
      const accountPath = `x-articles/v1/accounts/${key}.json`;
      const accountBlob = await storage.get(accountPath, { ...blob, useCache: false, headers: { 'Accept-Encoding': 'identity' } });
      let account = accountBlob ? await new Response(accountBlob.stream).json() : null;
      if (!account || now() - account.checkedAt >= 6 * HOUR) {
        const lookup = account?.id ? 'https://api.x.com/2/users/' + account.id : 'https://api.x.com/2/users/by/username/' + source.username;
        const user = await x(lookup);
        if (!/^\d+$/.test(user.data?.id || '') || !/^[A-Za-z0-9_]{1,15}$/.test(user.data?.username || '')) throw Error('Account unavailable');
        account = { id: user.data.id, username: user.data.username, checkedAt: now() };
        await storage.put(accountPath, JSON.stringify(account), { ...blob, contentType: 'application/json', addRandomSuffix: false, allowOverwrite: !!accountBlob, ...(accountBlob ? { ifMatch: accountBlob.blob.etag } : {}) });
      }
      const userId = account.id;
      source = { ...source, username: account.username };
      const url = new URL(`https://api.x.com/2/users/${userId}/tweets`);
      url.search = new URLSearchParams({ max_results: '100', exclude: 'retweets,replies', 'tweet.fields': 'article,created_at,entities,attachments', expansions: 'article.cover_media', 'media.fields': 'url,preview_image_url' }).toString();
      if (cursor) url.searchParams.set('pagination_token', cursor);
      const feed = await x(url);
      if (feed.errors?.length && !feed.data) throw Error('Timeline unavailable');
      const value = { userId, source, items: extractArticles(feed, source), next: feed.meta?.next_token || null, updated_at: new Date(now()).toISOString(), retryAfter: 0 };
      await save(value); return reply(value);
    } catch (e) {
      console.error('X article refresh failed', key, e.status || e.name);
      try { await save({ ...cached, retryAfter: now() + HOUR }); } catch {}
      return cached?.updated_at ? reply(cached, true) : res.status(503).json({ error: 'The X feed is temporarily unavailable. You can read the articles directly on X.', source });
    }
  };
}
export default createArticlesHandler();
