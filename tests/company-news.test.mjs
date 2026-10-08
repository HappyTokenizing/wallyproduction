import test from 'node:test';
import assert from 'node:assert/strict';
import { matchesProfile, companyNews, mergeArchive, rulesFor, slimItem } from '../assets/company-news-match.js';
import { archiveNews, readArchive, ARCHIVE_PATH } from '../lib/news-archive.js';
import { createCompanyNewsHandler } from '../api/company-news.js';

const item = (id, headline, extra = {}) => ({ id, headline, url: 'https://news.example/' + id, source: { name: 'Example' }, published_at: `2026-10-0${(+id.replace(/\D/g, '') % 9) || 1}T10:00:00Z`, summary: '', universe_tags: [], members: [], ...extra });
const circle = { id: 'circle', name: 'Circle', aliases: ['Circle'], newsTags: ['Circle'], newsRules: [{ aliases: ['Circle'] }, { aliases: ['Hashnote', 'USYC'] }] };
const midas = { id: 'midas', name: 'Midas', aliases: ['Midas'], newsTags: [], newsRules: [{ aliases: ['Midas', 'mTBILL'], context: ['tokenized', 'vault'], exclude: ['Midas Protocol'] }] };

test('aliases match whole words with the right case; context and exclude rules are honoured', () => {
  assert.ok(matchesProfile(item('1', 'Circle launches a new payments network'), circle));
  assert.ok(!matchesProfile(item('2', 'Investors circle back to tokenized credit'), circle));
  assert.ok(!matchesProfile(item('3', 'Circleville bank pilots deposits'), circle));
  assert.ok(matchesProfile(item('4', 'USYC crosses a new milestone'), circle));
  assert.ok(matchesProfile(item('5', 'Midas opens a tokenized vault'), midas));
  assert.ok(!matchesProfile(item('6', 'Midas touch: the gold rally continues'), midas));
  assert.ok(!matchesProfile(item('7', 'Midas Protocol tokenized vault exploited'), midas));
});

test('feed tags match without the headline mentioning the company', () => {
  assert.ok(matchesProfile(item('1', 'Stablecoin supply hits a record', { universe_tags: ['Circle'] }), circle));
});

test('profiles without curated rules get a conservative rule from their name', () => {
  const linear = { id: 'linear', name: 'Linear', aliases: ['Linear'] };
  assert.deepEqual(rulesFor(linear)[0].aliases, ['Linear']);
  assert.ok(rulesFor(linear)[0].context.length > 0);
  assert.ok(!matchesProfile(item('1', 'Growth is not Linear'), linear));
  assert.ok(matchesProfile(item('2', 'Linear launches tokenized bonds'), linear));
  const long = { id: 'x', name: 'Franklin Templeton', aliases: [] };
  assert.equal(rulesFor(long)[0].context, undefined);
});

test('company news is newest first, skips hidden stories and repeats of one story cluster', () => {
  const items = [item('1', 'Circle A', { published_at: '2026-10-01T00:00:00Z' }), item('2', 'Circle B', { published_at: '2026-10-03T00:00:00Z', cluster_id: 'k' }), item('3', 'Circle B again', { published_at: '2026-10-02T00:00:00Z', cluster_id: 'k' }), item('4', 'Circle hidden', { published_at: '2026-10-04T00:00:00Z' })];
  assert.deepEqual(companyNews(items, circle, { hidden: ['4'] }).map(x => x.id), ['2', '1']);
});

test('the archive keeps safe fields only, dedupes by id, sorts newest first and is capped', () => {
  assert.equal(slimItem({ id: 'x', headline: 'h', url: 'javascript:alert(1)' }), null);
  const kept = slimItem({ id: 'y', headline: 'h', url: 'https://ok.example/a', raw_line: 'secret', flags: {} });
  assert.equal(kept.raw_line, undefined);
  const merged = mergeArchive([item('1', 'old', { published_at: '2026-01-01T00:00:00Z' })], [item('1', 'old', { published_at: '2026-01-01T00:00:00Z' }), item('2', 'new', { published_at: '2026-10-05T00:00:00Z' })], 5);
  assert.deepEqual(merged.map(x => x.id), ['2', '1']);
  assert.equal(mergeArchive([], Array.from({ length: 9 }, (_, i) => item(String(i + 1), 'n')), 4).length, 4);
});

function memoryBlob() {
  const files = new Map(); let seq = 0;
  return { files, get: async (p) => { const f = files.get(p); return f ? { stream: new Response(f.body).body, blob: { etag: f.etag } } : null; },
    put: async (p, body, o) => { const f = files.get(p); if ((f && !o.allowOverwrite) || (o.ifMatch && f?.etag !== o.ifMatch)) throw Error('Conflict'); const etag = 'e' + (++seq); files.set(p, { body, etag }); return { etag }; } };
}

test('feed pulls accumulate in the private archive and an unchanged feed writes nothing', async () => {
  const storage = memoryBlob(), env = { BLOB_READ_WRITE_TOKEN: 'blob' };
  assert.equal(await archiveNews([item('1', 'a')], { env, storage }), true);
  assert.equal(await archiveNews([item('1', 'a')], { env, storage }), false);
  assert.equal(await archiveNews([item('2', 'b')], { env, storage }), true);
  assert.deepEqual((await readArchive({ env, storage })).items.map(x => x.id).sort(), ['1', '2']);
  assert.ok(storage.files.has(ARCHIVE_PATH));
  assert.equal(await archiveNews([item('3', 'c')], { env: {}, storage }), false); // no token: no-op
});

function call(handler, query, method = 'GET') { let code, body; return handler({ method, query }, { setHeader() {}, status(n) { code = n; return this; }, json(v) { body = v; } }).then(() => ({ code, body })); }

test('company news endpoint returns the archived stories for a profile, minus hidden ones', async () => {
  const profiles = new Map([['circle', circle]]);
  const h = createCompanyNewsHandler({ env: { SUPABASE_JOBS_SECRET: 's' }, profiles, archive: async () => ({ items: [item('1', 'Circle A'), item('2', 'Circle B'), item('3', 'Other news')] }), hidden: async () => ['2'] });
  const r = await call(h, { id: 'circle' });
  assert.equal(r.code, 200); assert.deepEqual(r.body.items.map(x => x.id), ['1']);
  assert.equal((await call(h, { id: 'nobody' })).code, 404);
  assert.equal((await call(h, { id: '../etc' })).code, 400);
  assert.equal((await call(h, { id: 'circle' }, 'POST')).code, 405);
});

test('staging forwards company news to production with only the profile id', async () => {
  let url; const h = createCompanyNewsHandler({ env: { SITE_PUBLIC_API_ORIGIN: 'https://www.rwaf.xyz' }, fetcher: async (u) => { url = String(u); return Response.json({ id: 'circle', items: [] }); } });
  const r = await call(h, { id: 'circle' });
  assert.equal(r.code, 200); assert.equal(url, 'https://www.rwaf.xyz/api/company-news?id=circle');
});
