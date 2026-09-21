import test from 'node:test';
import assert from 'node:assert/strict';
import {extractArticles,createArticlesHandler} from '../api/articles.js';
const post=(id='1',extra={})=>({id,created_at:'2026-09-21T12:00:00Z',text:'Intro https://t.co/example',article:{id:'99',title:'Real article',preview_text:'A real summary'},...extra});
function setup(){
 const files=new Map(),calls=[];let now=Date.parse('2026-09-21T12:00:00Z'),renamed=false,fail=false,seq=0;
 const storage={get:async p=>{const f=files.get(p);return f?{stream:new Response(f.body).body,blob:{etag:f.etag}}:null;},put:async(p,body,o)=>{const f=files.get(p);if((f&&!o.allowOverwrite)||(o.ifMatch&&f?.etag!==o.ifMatch))throw Error('Conflict');const etag='e'+(++seq);files.set(p,{body,etag});return {etag};}};
 const fetcher=async(url,opts)=>{calls.push(String(url));assert.equal(opts.headers.Authorization,'Bearer secret');if(fail)return new Response('',{status:402});if(String(url).includes('/tweets'))return Response.json({data:[post()],meta:{next_token:'page-two'}});return Response.json({data:{id:'42',username:renamed?'HerdCollection':'WALLY_DAO'}});};
 const handler=createArticlesHandler({env:{X_BEARER_TOKEN:'secret',BLOB_READ_WRITE_TOKEN:'blob'},storage,fetcher,now:()=>now});
 const request=async(query={source:'wally'},method='GET')=>{let code,body;await handler({method,query},{setHeader(){},status(n){code=n;return this;},json(v){body=v;}});return {code,body};};
 return {request,calls,files,advance:n=>now+=n,rename:()=>renamed=true,fail:()=>fail=true};
}
test('only genuine articles render; preserves titles, summaries, covers and individual URLs',()=>{
 const p=post('1',{article:{id:'99',title:'<img onerror=evil()>',preview_text:'Summary',cover_media:{media_key:'m'}}});
 const items=extractArticles({data:[p,post('2',{article:null,text:'ordinary post'}),p],includes:{media:[{media_key:'m',url:'https://pbs.twimg.com/media/cover.jpg'}]}},{username:'WALLY_DAO'});
 assert.equal(items.length,1);assert.equal(items[0].url,'https://x.com/i/article/99');assert.equal(items[0].image,'https://pbs.twimg.com/media/cover.jpg');assert.equal(items[0].title,'<img onerror=evil()>');
 assert.equal(extractArticles({data:[post('3',{article:null,entities:{urls:[{expanded_url:'https://evil.example/i/article/99',title:'Fake'}]}})]},{username:'a'}).length,0);
});
test('caches X reads, signs pagination and follows permanent account ID after a rename',async()=>{
 const b=setup(),first=await b.request();assert.equal(first.code,200);assert.equal(first.body.source.username,'WALLY_DAO');assert.equal(b.calls.length,2);
 await b.request();assert.equal(b.calls.length,2);
 assert.equal((await b.request({source:'wally',cursor:'forged'})).code,400);
 await b.request({source:'wally',cursor:first.body.next_cursor});assert.ok(b.calls.at(-1).includes('pagination_token=page-two'));
 b.rename();b.advance(7*3600000);const renamed=await b.request();assert.equal(renamed.body.source.username,'HerdCollection');assert.ok(b.calls.includes('https://api.x.com/2/users/42'));assert.equal(b.calls.filter(x=>x.includes('/by/username/')).length,1);
});
test('X failure preserves saved articles and backs off rather than multiplying paid calls',async()=>{
 const b=setup();await b.request();b.advance(2*3600000);b.fail();const r=await b.request();assert.equal(r.code,200);assert.equal(r.body.stale,true);assert.equal(r.body.items.length,1);const n=b.calls.length;await b.request();assert.equal(b.calls.length,n);
});
test('concurrent initial requests contact X only once and unknown sources/methods fail',async()=>{
 const b=setup();const r=await Promise.all([b.request(),b.request()]);assert.ok(r.some(r=>r.code===200));assert.equal(b.calls.length,2);assert.equal((await b.request({source:'evil'})).code,400);assert.equal((await b.request({source:'wally'},'POST')).code,405);
});
test('staging forwards only public source and signed cursor with no X credentials',async()=>{
 let url;const h=createArticlesHandler({env:{SITE_PUBLIC_API_ORIGIN:'https://www.rwaf.xyz'},fetcher:async u=>{url=String(u);return Response.json({items:[]});}});
 await h({method:'GET',query:{source:'zeus',cursor:'signed'}},{setHeader(){},status(){return this;},json(){}});assert.equal(url,'https://www.rwaf.xyz/api/articles?source=zeus&cursor=signed');
});
