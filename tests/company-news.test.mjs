import test from 'node:test';
import assert from 'node:assert/strict';
import { matchesProfile, companyNews, mergeArchive, rulesFor, slimItem } from '../assets/company-news-match.js';
import { archiveNews, readArchive, ARCHIVE_PATH, ARCHIVE_PREFIX, STATUS_PATH } from '../lib/news-archive.js';
import { newsPage } from '../lib/news-page.js';
import { createCollector } from '../api/collect-news.js';
import { collectNews } from '../lib/news-collection.js';
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

test('the archive keeps safe fields only, dedupes by id, sorts newest first without a retention cap', () => {
  assert.equal(slimItem({ id: 'x', headline: 'h', url: 'javascript:alert(1)' }), null);
  const kept = slimItem({ id: 'y', headline: 'h', url: 'https://ok.example/a', raw_line: 'secret', flags: {} });
  assert.equal(kept.raw_line, undefined);
  const merged = mergeArchive([item('1', 'old', { published_at: '2026-01-01T00:00:00Z' })], [item('1', 'old', { published_at: '2026-01-01T00:00:00Z' }), item('2', 'new', { published_at: '2026-10-05T00:00:00Z' })]);
  assert.deepEqual(merged.map(x => x.id), ['2', '1']);
  assert.equal(mergeArchive([], Array.from({ length: 6001 }, (_, i) => item(String(i + 1), 'n'))).length, 6001);
});

function memoryBlob() {
  const files = new Map(); let seq = 0;
  return { files, list: async ({prefix}) => ({blobs:[...files.keys()].filter(p=>p.startsWith(prefix)).map(pathname=>({pathname})),hasMore:false}), get: async (p) => { const f = files.get(p); return f ? { stream: new Response(f.body).body, blob: { etag: f.etag } } : null; },
    put: async (p, body, o) => { const f = files.get(p); if ((f && !o.allowOverwrite) || (o.ifMatch && f?.etag !== o.ifMatch)) throw Error('Conflict'); const etag = 'e' + (++seq); files.set(p, { body, etag }); return { etag }; } };
}

test('feed pulls accumulate in the private archive and unchanged stories are not rewritten', async () => {
  const storage = memoryBlob(), env = { BLOB_READ_WRITE_TOKEN: 'blob' };
  assert.equal(await archiveNews([item('1', 'a')], { env, storage }), true);
  assert.equal(await archiveNews([item('1', 'a')], { env, storage }), false);
  assert.equal(await archiveNews([item('2', 'b')], { env, storage }), true);
  assert.deepEqual((await readArchive({ env, storage })).items.map(x => x.id).sort(), ['1', '2']);
  assert.ok(storage.files.has(ARCHIVE_PREFIX+'2026-10.json'));
  assert.ok(storage.files.has(STATUS_PATH));
  await assert.rejects(archiveNews([item('3', 'c')], { env: {}, storage }), /not configured/);
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


test('monthly archive retains more than 5000 stories, the legacy archive, and full history after rotation', async () => {
 const storage=memoryBlob(),env={BLOB_READ_WRITE_TOKEN:'blob'};
 await storage.put(ARCHIVE_PATH,JSON.stringify({items:[item('legacy','Circle old',{published_at:'2019-01-01'})]}),{});
 await archiveNews(Array.from({length:5100},(_,i)=>item('old'+i,'Circle older',{published_at:'2020-01-01'})),{env,storage});
 await archiveNews([item('new','Circle newest',{published_at:'2026-10-08'})],{env,storage});
 const all=(await readArchive({env,storage})).items;
 assert.equal(all.length,5102);assert.ok(all.some(x=>x.id==='legacy'));
 assert.equal(companyNews(all,circle).length,5102);
 assert.ok(storage.files.has(ARCHIVE_PATH),'migration does not delete legacy history');
});
test('concurrent writers and a retry retain both batches; persistent storage errors propagate',async()=>{
 const storage=memoryBlob(),env={BLOB_READ_WRITE_TOKEN:'blob'};
 await Promise.all([archiveNews([item('1','Circle A')],{env,storage}),archiveNews([item('2','Circle B')],{env,storage})]);
 assert.equal((await readArchive({env,storage})).items.length,2);
 await assert.rejects(archiveNews([item('3','Circle C')],{env,storage:{...storage,put:async()=>{throw Error('write failed')}}}),/write failed/);
});
test('updated headline and summary for the same story id persist without losing old stories',async()=>{
 const storage=memoryBlob(),env={BLOB_READ_WRITE_TOKEN:'blob'};
 await archiveNews([item('1','Circle A'),item('2','Circle B')],{env,storage});
 await archiveNews([item('1','Circle corrected',{summary:'New details'})],{env,storage});
 const all=(await readArchive({env,storage})).items;assert.equal(all.length,2);assert.equal(all.find(x=>x.id==='1').summary,'New details');
});
test('all storage list pages are consumed, and unreadable months cause an error rather than an empty archive',async()=>{
 const storage=memoryBlob(),env={BLOB_READ_WRITE_TOKEN:'blob'};
 await archiveNews([item('1','January',{published_at:'2020-01-01'}),item('2','February',{published_at:'2020-02-01'})],{env,storage});
 let calls=0;storage.list=async({cursor})=>{calls++;return cursor?{blobs:[{pathname:ARCHIVE_PREFIX+'2020-02.json'}],hasMore:false}:{blobs:[{pathname:ARCHIVE_PREFIX+'2020-01.json'}],hasMore:true,cursor:'next'};};
 assert.equal((await readArchive({env,storage})).items.length,2);assert.equal(calls,2);
 storage.files.delete(ARCHIVE_PREFIX+'2020-02.json');await assert.rejects(readArchive({env,storage}),/Unreadable/);
});
test('pagination reaches every old story and remains stable when newer stories arrive',()=>{
 const stories=Array.from({length:137},(_,i)=>item('story'+i,'Circle old',{published_at:'2020-01-01'}));
 const first=newsPage(stories);assert.equal(first.items.length,50);
 const second=newsPage([item('new','Circle new'),...stories],{cursor:first.nextCursor});
 const third=newsPage(stories,{cursor:second.nextCursor});
 assert.equal(new Set([...first.items,...second.items,...third.items].map(x=>x.id)).size,137);assert.equal(third.nextCursor,null);
 assert.equal(newsPage(stories,{q:'no match'}).total,0);
 assert.throws(()=>newsPage(stories,{cursor:'bad'}),/Invalid cursor/);
});
test('collector requires authentication, skips mirrors, and returns failure when persistence fails',async()=>{
 const env={CRON_SECRET:'test'},req={method:'GET',headers:{authorization:'Bearer test'}};
 const invoke=async(handler,request=req)=>{let code,body;await handler(request,{setHeader(){},status(v){code=v;return this},json(v){body=v}});return {code,body};};
 assert.equal((await invoke(createCollector({env,collect:async()=>({items:[item('1','A')]})}))).code,200);
 assert.equal((await invoke(createCollector({env}),{method:'GET',headers:{}})).code,401);
 assert.equal((await invoke(createCollector({env:{}}))).code,401);
 assert.equal((await invoke(createCollector({env,collect:async()=>{throw Error('Storage down')}}))).code,503);
 assert.equal((await invoke(createCollector({env:{SITE_PUBLIC_API_ORIGIN:'https://www.rwaf.xyz'},collect:()=>{throw Error('Must not collect')}}))).body.skipped,'Public-data mirror');
});
test('collection never acknowledges success before archive persistence and rejects malformed upstream data',async()=>{
 let saved=false;await collectNews({env:{RWANEWS_KEY:'key'},fetcher:async()=>Response.json({items:[item('1','A')]}),archive:async()=>{saved=true;}});assert.ok(saved);
 await assert.rejects(collectNews({env:{RWANEWS_KEY:'key'},fetcher:async()=>Response.json({items:[item('1','A')]}),archive:async()=>{throw Error('write failed')}}),/write failed/);
 await assert.rejects(collectNews({env:{RWANEWS_KEY:'key'},fetcher:async()=>Response.json({})}),/Invalid news feed/);
});


test('company endpoint paginates old history and forwards cursors through staging',async()=>{
 const stories=Array.from({length:121},(_,i)=>item('s'+i,'Circle archived',{published_at:'2020-01-01'}));
 const h=createCompanyNewsHandler({env:{},profiles:new Map([['circle',circle]]),archive:async()=>({items:stories})});
 const first=await call(h,{id:'circle'}),second=await call(h,{id:'circle',cursor:first.body.nextCursor}),last=await call(h,{id:'circle',cursor:second.body.nextCursor});
 assert.equal(first.body.total,121);assert.equal(last.body.nextCursor,null);
 assert.equal(new Set([...first.body.items,...second.body.items,...last.body.items].map(x=>x.id)).size,121);
 let url;const mirror=createCompanyNewsHandler({env:{SITE_PUBLIC_API_ORIGIN:'https://example.com'},fetcher:async u=>{url=new URL(u);return Response.json(first.body);}});
 await call(mirror,{id:'circle',cursor:first.body.nextCursor,limit:'40',secret:'never-forward'});
 assert.equal(url.searchParams.get('cursor'),first.body.nextCursor);assert.equal(url.searchParams.get('limit'),'40');assert.equal(url.searchParams.has('secret'),false);
});
