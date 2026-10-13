import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {pages,origin,aliases} from '../scripts/site-pages.mjs';
const read=file=>fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');
const pageFile=p=>p.path==='/'?'index.html':p.path.slice(1)+'index.html';
test('every public route has a standalone page, unique static metadata and the canonical production host',()=>{
 const titles=new Set(),descriptions=new Set();
 for(const p of pages){const html=read(pageFile(p));
  assert.equal((html.match(/<title>/g)||[]).length,1,p.path);
  assert.ok(html.indexOf('<meta charset="utf-8">')<1024,p.path);
  assert.equal((html.match(/<meta name="description"/g)||[]).length,1,p.path);
  assert.ok(html.includes(`href="${origin+p.path}"`),p.path);
  assert.ok(!titles.has(p.title));titles.add(p.title);assert.ok(!descriptions.has(p.description));descriptions.add(p.description);
  if(html.includes('data-page=')){assert.equal((html.match(/<main\b/g)||[]).length,1,p.path);assert.match(html,new RegExp(`<main id="page-${p.id}">`));}
  for(const icon of ['/favicon.png','/favicon.ico','/apple-touch-icon.png'])assert.ok(html.includes(`href="${icon}"`),p.path);
  assert.doesNotMatch(html,/href="\/#\//,p.path);
 }
 assert.doesNotMatch(read('index.html'),/id="(?:primer|wallynft|newsEmail|page-news|page-jobs)"/);
});
test('menu omits Home while the visible brand is a home link',()=>{
 for(const file of ['index.html','research/index.html','guide/index.html']){
  const html=read(file);assert.match(html,/href="\/"[^>]*aria-label="RWA Foundation home"/);
  assert.doesNotMatch(html,/>Home<\/a>/);
 }
});
test('sitemap includes only public canonical pages; robots declares it and admin is noindex',()=>{
 const xml=read('sitemap.xml');const urls=[...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]);
 assert.deepEqual(urls,pages.filter(p=>!p.noindex).map(p=>origin+p.path));assert.equal(new Set(urls).size,urls.length);
 assert.match(read('robots.txt'),/Sitemap: https:\/\/www\.rwaf\.xyz\/sitemap\.xml/);
 assert.match(read('admin/index.html'),/<meta name="robots" content="noindex,nofollow">/);
});
test('legacy hash URLs migrate to real pages without losing query parameters or hijacking in-page anchors',()=>{
 const source=read('assets/legacy-routes.js');
 const check=(pathname,hash,wanted)=>{let actual;vm.runInNewContext(source,{addEventListener:()=>{},location:{pathname,hash,search:'?ref=shared',replace:p=>actual=p}});assert.equal(actual,wanted);};
 check('/','#/news','/news/?ref=shared');check('/','#/ecosystem','/ecosystem/?ref=shared');check('/','#/foundation','/members/?ref=shared');check('/','#primer','/learn/?ref=shared');check('/research/','#wally','/research/wally/?ref=shared');check('/guide/','#read',undefined);
 const config=JSON.parse(read('vercel.json'));for(const [old,to]of Object.entries(aliases))assert.ok(config.redirects.some(r=>r.source===old.slice(0,-1)&&r.destination===to&&r.permanent));
});
test('member defaults remain available without hidden Members page markup',()=>{
 const c={window:{}};vm.runInNewContext(read('assets/member-defaults.js'),c);
 assert.ok(c.window.RWAF_MEMBER_DEFAULTS.length>=18);
 assert.equal(new Set(c.window.RWAF_MEMBER_DEFAULTS.map(l=>l.id)).size,c.window.RWAF_MEMBER_DEFAULTS.length);
 for(const p of pages.filter(p=>['home','news','jobs','eco','admin'].includes(p.id)))assert.match(read(pageFile(p)),/src="\/assets\/member-defaults.js"/);
});
test('brand downloads are real PNG, PDF and single ZIP files, not data URLs or timed multi-downloads',()=>{
 const html=read('media-kit/index.html');
 for(const name of ['rwa-foundation-brand-guidelines.pdf','rwa-foundation-logos.zip','rwa-elephant-noise.png'])assert.ok(html.includes('/assets/brand/'+name));
 const buffer=name=>fs.readFileSync(new URL('../assets/brand/'+name,import.meta.url));
 assert.equal(buffer('rwa-foundation-brand-guidelines.pdf').subarray(0,5).toString(),'%PDF-');assert.equal(buffer('rwa-foundation-logos.zip').subarray(0,2).toString(),'PK');
 assert.equal(buffer('rwa-elephant-noise.png').subarray(1,4).toString(),'PNG');
 assert.doesNotMatch(html,/onclick="download(?:Logos|Guidelines)\(\)"/);
});
test('all static local href/src targets resolve, including generated script and image assets',()=>{
 for(const p of pages){const html=read(pageFile(p));
  for(const [,url]of html.matchAll(/(?:src|href)="(\/[^"?#]*)[^" ]*"/g)){
   if(url.startsWith('/api/'))continue;
   const file=url.endsWith('/')?url.slice(1)+'index.html':url.slice(1);
   assert.ok(fs.existsSync(new URL('../'+file,import.meta.url)),`${p.path}: missing ${url}`);
  }
 }
});

test('legacy links also migrate on same-document hash navigation',()=>{
 let onHash,result;const location={pathname:'/',hash:'',search:'',replace:p=>result=p};
 vm.runInNewContext(read('assets/legacy-routes.js'),{location,addEventListener:(name,fn)=>{if(name==='hashchange')onHash=fn;}});
 assert.equal(result,undefined);location.hash='#/jobs';onHash();assert.equal(result,'/jobs/');
});

test('generated shared scripts parse after extracting inline assets',()=>{
 for(const file of ['assets/site-runtime-1.js','assets/site-runtime-2.js','assets/site-runtime-3.js','assets/site-runtime-4.js'])assert.doesNotThrow(()=>new vm.Script(read(file)),file);
});

test('slash redirects apply only to public page routes and preserve API and cron configuration',()=>{
 const config=JSON.parse(read('vercel.json'));
 assert.equal(config.trailingSlash,undefined);
 for(const p of pages.filter(p=>p.path!=='/'))assert.ok(config.redirects.some(r=>r.source===p.path.slice(0,-1)&&r.destination===p.path));
 assert.ok(config.redirects.every(r=>!r.source.startsWith('/api')));
 assert.ok(config.crons.some(c=>c.path==='/api/collect-news'&&c.schedule==='*/5 * * * *'));
});
