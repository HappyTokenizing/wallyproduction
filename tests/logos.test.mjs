import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { createLogoHandler } from '../api/logos.js';
import { BlobPreconditionFailedError, BlobError } from '@vercel/blob';

const empty=()=>({order:[],del:[],add:[]});
const logo={id:'utest',name:'Test',src:'data:image/png;base64,aGVsbG8='};
process.env.BLOB_READ_WRITE_TOKEN='test-token';process.env.JOBS_ADMIN_PW='test-password';
function backend(){
  let state=null,rev=0;
  const storage={
    async get(path,options){assert.equal(options.useCache,false);return state?{stream:new Response(JSON.stringify(state)).body,blob:{etag:'v'+rev}}:null;},
    async put(path,body,options){
      if(state&&!options.allowOverwrite) throw new BlobError("This blob already exists");
      if(options.ifMatch&&options.ifMatch!=='v'+rev) throw new BlobPreconditionFailedError();
      state=JSON.parse(body);return {etag:'v'+(++rev)};
    }
  };
  return createLogoHandler(storage);
}
async function call(handler,method,body){
  const result={headers:{},code:0,body:null};
  await handler({method,body},{setHeader(k,v){result.headers[k]=v;},status(code){result.code=code;return this;},json(body){result.body=body;return this;}});
  return result;
}
const post=(handler,store,revision)=>call(handler,'POST',{pw:'test-password',store,revision});
test('upload, reorder, fresh-reader persistence, reset',async()=>{
  const h=backend();let r=await call(h,'GET');assert.equal(r.body.revision,null);assert.equal(r.headers['Cache-Control'],'no-store');
  const s={order:['utest','d1','d0'],del:['d2'],add:[logo]};r=await post(h,s,null);assert.equal(r.code,200);
  assert.deepEqual((await call(h,'GET')).body.store,s);
  s.order=['d0','utest','d1'];r=await post(h,s,r.body.revision);assert.equal(r.code,200);
  assert.deepEqual((await call(h,'GET')).body.store.order,s.order);
  r=await post(h,empty(),r.body.revision);assert.equal(r.code,200);assert.deepEqual((await call(h,'GET')).body.store,empty());
});
test('concurrent first saves and stale edits conflict without losing saved state',async()=>{
  const h=backend();const s={...empty(),add:[logo]};await post(h,s,null);
  assert.equal((await post(h,empty(),null)).code,409);
  await post(h,{...s,order:['utest']},'v1');
  assert.equal((await post(h,empty(),'v1')).code,409);
  assert.deepEqual((await call(h,'GET')).body.store.add,[logo]);
});
test('bad auth, oversized and invalid images are rejected atomically',async()=>{
  const h=backend();assert.equal((await call(h,'POST',{pw:'wrong',store:empty(),revision:null})).code,401);
  for(const src of ['javascript:alert(1)','data:image/png;base64,'+'a'.repeat(500001)]){
    assert.equal((await post(h,{...empty(),add:[{...logo,src}]},null)).code,400);
  }
  assert.equal((await post(h,{...empty(),order:['d1','d1']},null)).code,400);
  assert.equal((await post(h,empty(),undefined)).code,409);
  assert.equal((await call(h,'GET')).body.revision,null);
});

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const sync=html.slice(html.indexOf("const LOGO_LS="),html.indexOf('function admOk()'));
const bounds=html.slice(html.indexOf('function lgBounds('),html.indexOf('function lgNormalize('));
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function client(fetch,options={}){
  const cache=new Map(Object.entries(options.cache||{}));
  const c=vm.createContext({
    fetch, Response, console, JSON, Promise,
    document:{querySelectorAll:()=>[],querySelector:()=>null},
    window:{addEventListener:()=>{}}, $:()=>null,
    lsGet:(k,f)=>cache.has(k)?JSON.parse(cache.get(k)):f,
    localStorage:{setItem(k,v){if(options.full)throw Error('quota');cache.set(k,v);},removeItem(k){cache.delete(k);}},
    sessionStorage:{getItem:()=> 'test-password'},toast:()=>{},confirm:()=>true,
  });
  vm.runInContext("let admTabNow='logos'; function admPaintLogos(){};"+sync+bounds,c);
  return {run:code=>vm.runInContext(code,c),cache};
}
const json=(body,status=200)=>new Response(JSON.stringify(body),{status});
test('rapid edits use a single in-flight save and preserve the final order',async()=>{
  const requests=[];let finish;
  const c=client(async(url,opts)=>{
    if(!opts.method)return json({store:empty(),revision:null});
    requests.push(JSON.parse(opts.body));
    if(requests.length===1)await new Promise(r=>finish=r);
    return json({ok:true,revision:'v'+requests.length});
  });
  await tick();c.run("lgSave({order:['d1','d0'],del:[],add:[]});lgPush()");
  c.run("lgSave({order:['d0','d1'],del:[],add:[]});lgPush()");
  assert.equal(requests.length,1);finish();await tick();
  assert.equal(requests.length,2);assert.equal(requests[1].revision,'v1');assert.deepEqual(requests[1].store.order,['d0','d1']);
  assert.equal(c.run('lgSaved===lgEdit'),true);assert.equal(c.cache.has('wally_logos_draft_v2'),false);
});
test('failed saves retain drafts and retry; memory remains authoritative if browser storage is full',async()=>{
  let fail=true,last;
  const c=client(async(url,opts)=>{
    if(!opts.method)return json({store:empty(),revision:null});
    last=JSON.parse(opts.body);if(fail)throw Error('offline');return json({ok:true,revision:'v1'});
  },{full:true});await tick();await c.run("lgSave({order:['d2','d1'],del:[],add:[]});lgPush()");
  assert.equal(c.run('lgEdit>lgSaved'),true);assert.ok(c.run('lgRecovery'));fail=false;await c.run('lgRetry()');
  assert.deepEqual(last.store.order,['d2','d1']);assert.equal(c.run('lgSaved===lgEdit'),true);
});
test('loading pauses editing and an older response cannot overwrite newer local changes',async()=>{
  let finish;const c=client(()=>new Promise(r=>finish=r));assert.equal(c.run('lgCanEdit()'),false);
  c.run("lgSave({order:['d2'],del:[],add:[]})");finish(json({store:empty(),revision:'v1'}));await tick();
  assert.equal(c.run("lgStore().order[0]"),'d2');
});
test('old browser-only uploads remain recoverable when no server copy exists',async()=>{
  const s={...empty(),add:[logo]};const c=client(async()=>json({store:empty(),revision:null}),{cache:{wally_logos_v1:JSON.stringify(s)}});
  await tick();assert.equal(c.run('lgRecovery.store.add[0].id'),'utest');assert.ok(c.cache.has('wally_logos_draft_v2'));
});
test('normalization crops transparent and white padding but preserves a white mark on transparency',()=>{
  const c=client(async()=>json({store:empty(),revision:null}));
  for(const bg of ['transparent','white']){
    const data=new Uint8ClampedArray(10*10*4);if(bg==='white')data.fill(255);
    for(let y=3;y<7;y++)for(let x=2;x<8;x++){let i=(y*10+x)*4;data[i]=10;data[i+1]=20;data[i+2]=30;data[i+3]=255;}
    c.run('globalThis.pixels='+JSON.stringify(Array.from(data)));
    assert.equal(c.run('JSON.stringify(lgBounds(pixels,10,10))'),JSON.stringify({x:2,y:3,width:6,height:4}));
  }
  assert.equal(c.run('lgBounds([0,0,0,0,255,255,255,255,0,0,0,0],3,1).width'),1);
});
test('all inline JavaScript parses',()=>{
  for(const m of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) new vm.Script(m[1]);
});

test('member icons persist for default and uploaded members; legacy saves preserve icons',async()=>{
  const h=backend();const icons={d0:logo.src,utest:logo.src};
  let r=await post(h,{...empty(),add:[logo],icons},null);assert.equal(r.code,200);
  assert.deepEqual((await call(h,'GET')).body.store.icons,icons);
  // A still-open older admin page can reorder without silently deleting the icon map.
  r=await post(h,{...empty(),add:[logo],order:['utest','d0']},r.body.revision);assert.equal(r.code,200);
  assert.deepEqual((await call(h,'GET')).body.store.icons,icons);
  assert.equal((await post(h,{...empty(),icons:{}},'v1')).code,409);
  r=await post(h,{...empty(),add:[logo],icons:{}},r.body.revision);assert.equal(r.code,200);
  assert.deepEqual((await call(h,'GET')).body.store.icons,{});
  assert.deepEqual((await call(h,'GET')).body.store.add,[logo]);
});
test('invalid icon uploads are rejected without replacing saved logos',async()=>{
 const h=backend();await post(h,{...empty(),add:[logo]},null);
 for(const icons of [{d0:'https://example.com/track.png'},{d0:'javascript:alert(1)'},{d0:'data:image/png;base64,'+'a'.repeat(500001)},{constructor:logo.src},[],null]){
   assert.equal((await post(h,{...empty(),icons},'v1')).code,400);
 }
 assert.deepEqual((await call(h,'GET')).body.store.add,[logo]);
});
