// Logo uploads and order live in a private Vercel Blob, independent of deployments.
// Each Vercel project has its own BLOB_READ_WRITE_TOKEN; credentials never reach clients.
import { createHash, timingSafeEqual } from 'node:crypto';
import { get, put, BlobPreconditionFailedError, BlobError } from '@vercel/blob';
const EMPTY = { order: [], del: [], add: [] };
const PATH = 'member-logos.json';

function validateStore(s) {
  if (!s || !Array.isArray(s.order) || !Array.isArray(s.del) || !Array.isArray(s.add)) return false;
  const id = x => typeof x === 'string' && /^[a-zA-Z0-9_-]{1,40}$/.test(x);
  if (s.order.length > 200 || s.del.length > 200 || s.add.length > 100) return false;
  if (![s.order, s.del].every(a => a.every(id) && new Set(a).size === a.length)) return false;
  if (new Set(s.add.map(l => l && l.id)).size !== s.add.length) return false;
  if (s.icons !== undefined && (!s.icons || Array.isArray(s.icons) || typeof s.icons !== 'object' || Object.keys(s.icons).length > 200
    || !Object.entries(s.icons).every(([key, src]) => /^(d[0-9]+|u[a-zA-Z0-9_-]{1,39})$/.test(key) && typeof src === 'string' && src.length <= 500000
      && /^data:image\/(png|jpeg|webp|svg\+xml);base64,[A-Za-z0-9+/]+={0,2}$/.test(src)))) return false;
  return s.add.every(l => l && id(l.id) && l.id.startsWith('u') && typeof l.name === 'string' && l.name.trim().length > 0 && l.name.length <= 60
    && typeof l.src === 'string' && l.src.length <= 500000
    && /^data:image\/(png|jpeg|webp|svg\+xml);base64,[A-Za-z0-9+/]+={0,2}$/.test(l.src));
}

export function createLogoHandler(storage = { get, put }) {
  return async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('CDN-Cache-Control', 'no-store');
    res.setHeader('Vercel-CDN-Cache-Control', 'no-store');
    if (!['GET', 'POST'].includes(req.method)) {
      res.setHeader('Allow', 'GET, POST');
      return res.status(405).json({ error: 'GET or POST only' });
    }
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) return res.status(503).json({ error: 'Logo storage is not configured. Contact the site administrator.' });
    try {
      if (req.method === 'GET') {
        // Bypass blob/CDN caches so refreshes and other visitors see the last confirmed save.
        const result = await storage.get(PATH, { access: 'private', token, useCache: false });
        const store = result ? await new Response(result.stream).json() : EMPTY;
        return res.status(200).json({ store, revision: result?.blob.etag || null });
      }
      const pw = process.env.JOBS_ADMIN_PW;
      const passwordHash = pw ? createHash('sha256').update(pw).digest('hex') : process.env.JOBS_ADMIN_PW_SHA256;
      if (!passwordHash || !/^[a-f0-9]{64}$/.test(passwordHash)) return res.status(503).json({ error: 'Admin saving is not configured.' });
      const b = req.body || {};
      const providedHash = createHash('sha256').update(typeof b.pw === 'string' ? b.pw : '').digest();
      if (!timingSafeEqual(providedHash, Buffer.from(passwordHash, 'hex'))) return res.status(401).json({ error: 'Session expired. Sign in again.' });
      if (!validateStore(b.store)) return res.status(400).json({ error: 'Invalid logo data or logo limit exceeded. No changes were saved.' });
      if (JSON.stringify(b.store).length > 3500000) return res.status(413).json({ error: 'The logo collection is too large. Use smaller images. No changes were saved.' });
      if (b.revision !== null && (typeof b.revision !== 'string' || !b.revision || b.revision.length > 200)) {
        return res.status(409).json({ error: 'Refresh the logo manager before saving.' });
      }
      const store = { order: b.store.order, del: b.store.del, add: b.store.add.map(({ id, name, src }) => ({ id, name, src })) };
      if (b.store.icons !== undefined) store.icons = { ...b.store.icons };
      else {
        // Older admin tabs do not know about icons; preserve the current icons on their saves.
        const current = await storage.get(PATH, { access: 'private', token, useCache: false });
        if (current) {
          const previous = await new Response(current.stream).json();
          if (previous.icons) store.icons = previous.icons;
        }
      }
      if (JSON.stringify(store).length > 3500000) return res.status(413).json({ error: 'The logo collection is too large. Use smaller images. No changes were saved.' });
      // Atomic ETag check prevents older tabs or simultaneous admins overwriting newer edits.
      const saved = await storage.put(PATH, JSON.stringify(store), {
        access: 'private', token, contentType: 'application/json', addRandomSuffix: false,
        allowOverwrite: b.revision !== null,
        ...(b.revision !== null ? { ifMatch: b.revision } : {})
      });
      return res.status(200).json({ ok: true, revision: saved.etag });
    } catch (e) {
      if (e instanceof BlobPreconditionFailedError || (e instanceof BlobError && /already exists/i.test(e.message))) {
        return res.status(409).json({ error: 'Logos changed in another session. Load the latest version before retrying.' });
      }
      console.error('Logo storage request failed:', e.name);
      return res.status(502).json({ error: 'Logo storage is unavailable. Keep this page open and retry.' });
    }
  };
}
export default createLogoHandler();
