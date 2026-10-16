import {accessState,testCookie} from './team-auth-fixture.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {BlobError,BlobPreconditionFailedError} from '@vercel/blob';
import {createFastSubmitHandler} from '../api/fast-submit.js';
import {createJobsHandler} from '../api/jobs.js';
import {createEcosystemHandler} from '../api/ecosystem.js';
import {readArchive} from '../lib/news-archive.js';
import {newsPage} from '../lib/news-page.js';
import {canonicalURL,extractSource,newsMatches,publicAddress,fetchSource} from '../lib/fast-submit-source.js';
import {STATE_PATH,SESSION_COOKIE} from '../lib/fast-submit-store.js';
const env={BLOB_READ_WRITE_TOKEN:'test',JOBS_ADMIN_PW:'admin-password',NODE_ENV:'production'};
const base={snapshotDate:'2026-10-16',profiles:[],sections:[{name:'Tokenization',categories:[{name:'Infrastructure',ids:[]}]}],statsEvents:[]};
const newsHTML='<title>Acme launches new tokenized treasury fund</title><meta property="og:type" content="article"><meta name="description" content="Acme announced a new treasury fund available on its official platform."><meta property="article:published_time" content="2026-10-15"><meta property="og:site_name" content="Acme News">';
function setup(options={}) {
  const files=new Map([[STATE_PATH,{value:accessState(),etag:"auth-1"}]]);let revision=0,failWrite=null;
  const storage={
    async get(path){const f=files.get(path);return f?{stream:new Response(JSON.stringify(f.value)).body,blob:{etag:f.etag}}:null;},
    async put(path,body,o){if(failWrite?.(path,JSON.parse(body)))throw Error('Storage offline');const old=files.get(path);if(old&&!o.allowOverwrite)throw new BlobError('already exists');if(o.ifMatch&&old?.etag!==o.ifMatch)throw new BlobPreconditionFailedError();const etag='r'+(++revision);files.set(path,{value:JSON.parse(body),etag});return {etag};},
    async list({prefix}){return {blobs:[...files.keys()].filter(x=>x.startsWith(prefix)).map(pathname=>({pathname})),hasMore:false};}
  };
  const h=createFastSubmitHandler({storage,env,baseData:base,source:async url=>({url,html:newsHTML}),fetchImpl:async()=>new Response(JSON.stringify({jobs:[]})),...options});
  async function call(body,cookie='',extra={}) {const result={headers:{}};await h({method:body?'POST':'GET',body,headers:{host:'www.rwaf.xyz',origin:'https://www.rwaf.xyz','content-type':'application/json',cookie,...extra}},{setHeader(k,v){result.headers[k]=v;},status(code){result.status=code;return this;},json(value){result.body=value;}});return result;}
  async function unlock(){const made=await call({action:'create_code',email:'happy@rwaf.xyz',label:'Editor'},testCookie);assert.equal(made.status,200);const used=await call({action:'redeem',email:'happy@rwaf.xyz',code:made.body.code});assert.equal(used.status,200);return used.headers['Set-Cookie'].split(';')[0];}
  return {storage,files,call,unlock,fail:fn=>{failWrite=fn;}};
}
async function inspect(s,cookie,kind='news',url='https://example.com/story'){const r=await s.call({action:'inspect',url,kind},cookie);assert.equal(r.status,200,JSON.stringify(r.body));return r.body.draft;}
const publish=(s,c,d,extra={})=>s.call({action:'publish',id:d.id,fields:d.fields,reviewed:true,...extra},c);

test('single-use codes, secure cookies, authorization, cross-site requests and revocation',async()=>{
  const s=setup();assert.equal((await s.call()).body.authenticated,false);
  assert.equal((await s.call({action:'create_code',email:'happy@rwaf.xyz',pw:'wrong'})).status,401);
  const made=await s.call({action:'create_code',email:'happy@rwaf.xyz'},testCookie);
  const used=await Promise.all([s.call({action:'redeem',email:'happy@rwaf.xyz',code:made.body.code}),s.call({action:'redeem',email:'happy@rwaf.xyz',code:made.body.code})]);
  assert.deepEqual(used.map(x=>x.status).sort(),[200,401]);
  const header=used.find(x=>x.status===200).headers['Set-Cookie'];assert.match(header,/HttpOnly; Secure; SameSite=Strict/);const cookie=header.split(';')[0];
  assert.equal((await s.call(null,cookie)).body.authenticated,true);
  assert.equal((await s.call({action:'inspect',kind:'news',url:'https://example.com'},cookie,{origin:'https://evil.example'})).status,403);
  assert.equal((await s.call({action:'inspect',kind:'news',url:'https://example.com'})).status,401);
  assert.ok(!JSON.stringify(s.files.get(STATE_PATH)).includes(made.body.code.replaceAll('-','')));
  await s.call({action:'revoke_sessions'},cookie);assert.equal((await s.call(null,cookie)).body.authenticated,false);
});
test('codes and browser sessions expire; logging out invalidates the server session',async()=>{
  let clock=Date.now();const s=setup({now:()=>clock});const code=await s.call({action:'create_code',email:'happy@rwaf.xyz'},testCookie);clock+=86400001;assert.equal((await s.call({action:'redeem',email:'happy@rwaf.xyz',code:code.body.code})).status,401);
  const cookie=await s.unlock();clock+=30*86400000;assert.equal((await s.call(null,cookie)).body.authenticated,false);
  const fresh=await s.unlock();await s.call({action:'logout'},fresh);assert.equal((await s.call(null,fresh)).body.authenticated,false);
});
test('news is durably published, publicly readable and retries cannot duplicate it',async()=>{
  const s=setup(),cookie=await s.unlock(),d=await inspect(s,cookie);
  const result=await publish(s,cookie,d);assert.equal(result.status,200);assert.equal(result.body.receipt.status,'published');
  const receipt=result.body.receipt;assert.match(receipt.details.liveUrl,/\/news\/\?story=fast-/);
  const archived=(await readArchive({env,storage:s.storage})).items;assert.equal(newsPage(archived,{story:receipt.details.id}).items[0].headline,d.fields.headline);
  assert.deepEqual((await publish(s,cookie,d)).body.draft.receipt,receipt);
  const duplicate=await inspect(s,cookie,'news','https://example.com/story?utm_source=team');assert.equal(duplicate.matches[0].match,'exact');
  assert.equal((await publish(s,cookie,duplicate)).body.receipt.status,'existing');assert.equal((await readArchive({env,storage:s.storage})).items.length,1);
  const other=await s.unlock();assert.equal((await s.call({action:'status',id:d.id},other)).status,404);
});
test('related stories require an explicit distinct-story review; identical titles match',async()=>{
  const s=setup(),c=await s.unlock(),d=await inspect(s,c);await publish(s,c,d);
  const next=await inspect(s,c,'news','https://other.example/story');next.fields.headline='Acme launches new tokenized treasury fund in Europe';
  let result=await publish(s,c,next);assert.equal(result.status,409);assert.equal(result.body.matches[0].match,'possible');
  result=await publish(s,c,next,{distinct:true});assert.equal(result.status,200);assert.equal(result.body.receipt.status,'published');
});
test('concurrent submissions for one URL create one archive entry',async()=>{
  const s=setup(),c=await s.unlock(),a=await inspect(s,c),b=await inspect(s,c);
  const results=await Promise.all([publish(s,c,a),publish(s,c,b)]);assert.equal(results.filter(x=>x.status===200).length,1);assert.equal(results.filter(x=>x.status===409).length,1);
  const retry=await publish(s,c,results[0].status===409?a:b);assert.equal(retry.body.receipt.status,'existing');assert.equal((await readArchive({env,storage:s.storage})).items.length,1);
});
test('storage failure after publication can recover without a second article',async()=>{
  const s=setup(),c=await s.unlock(),d=await inspect(s,c);s.fail((path,value)=>path.includes('/drafts/')&&!!value.receipt);
  assert.equal((await publish(s,c,d)).status,502);assert.equal((await readArchive({env,storage:s.storage})).items.length,1);
  s.fail(null);const result=await publish(s,c,d);assert.equal(result.status,200);assert.equal(result.body.receipt.status,'existing');assert.equal((await readArchive({env,storage:s.storage})).items.length,1);
});
test('jobs and ecosystem publish into their existing public stores without contact emails or notifications',async()=>{
  const s=setup(),c=await s.unlock(),job=await inspect(s,c,'jobs','https://example.com/jobs/1');
  job.fields={company:'Acme',role:'Engineer',location:'New York',type:'Full time',work:'Hybrid',comp:'',description:'Build the platform for real world asset tokenization at Acme.',apply_to:job.url,tags:[]};
  const saved=await publish(s,c,job);assert.equal(saved.status,200,JSON.stringify(saved.body));
  const rows=s.files.get('job-submissions.json').value;assert.equal(rows.length,1);assert.equal(rows[0].status,'live');assert.equal(rows[0].notifications,undefined);
  process.env.BLOB_READ_WRITE_TOKEN='test';const response={};await createJobsHandler(s.storage)({method:'GET',query:{fresh:'1'}},{setHeader(){},status(n){response.status=n;return this},json(d){response.body=d}});assert.equal(response.body.jobs[0].role,'Engineer');assert.equal(response.body.jobs[0].email,undefined);
  const eco=await inspect(s,c,'ecosystem','https://ecosystem.example');eco.fields={name:'New Project',description:'Infrastructure for tokenized treasury funds.',website:eco.url,region:'',category:JSON.stringify({section:'Tokenization',name:'Infrastructure'})};
  const result=await publish(s,c,eco);assert.equal(result.status,200,JSON.stringify(result.body));
  const publicResult={};await createEcosystemHandler(s.storage,{env,baseData:base})({method:'GET'},{setHeader(){},status(n){publicResult.status=n;return this;},json(d){publicResult.body=d;}});assert.equal(publicResult.body.records[0].review.name,'New Project');assert.equal(publicResult.body.records[0].review.start,null);
  const duplicate=await inspect(s,c,'ecosystem','https://ecosystem.example');assert.equal(duplicate.matches[0].match,'exact');
});
test('hidden news cannot be republished or described as already live',async()=>{
  let hidden=[];const s=setup({env:{...env,SUPABASE_JOBS_SECRET:'key'},fetchImpl:async()=>new Response(JSON.stringify([{v:{ids:hidden}}]))}),c=await s.unlock(),d=await inspect(s,c);const saved=await publish(s,c,d);hidden=[saved.body.receipt.details.id];
  const again=await inspect(s,c);assert.equal(again.matches[0].match,'hidden');assert.equal((await publish(s,c,again)).status,409);
});
test('unreadable pages retain the URL and require manual details',async()=>{
  const s=setup({source:async()=>{throw Error('Blocked');}}),c=await s.unlock(),d=await inspect(s,c);
  assert.equal(d.url,'https://example.com/story');assert.ok(d.warnings.length);assert.equal((await publish(s,c,d)).status,400);
});
test('extracts structured jobs and safely decodes HTML without inventing missing fields',()=>{
  const d=extractSource('<script type="application/ld+json">'+JSON.stringify({'@type':'JobPosting',title:'Engineer',hiringOrganization:{name:'Acme'},description:'<p>Build &amp; test tokenized asset systems for customers.</p>',employmentType:'FULL_TIME',jobLocationType:'TELECOMMUTE',applicantLocationRequirements:{name:'USA'}})+'</script>','https://example.com/job');
  assert.equal(d.kind,'jobs');assert.equal(d.fields.work,'Remote');assert.equal(d.fields.location,'USA');assert.equal(d.fields.type,'Full time');assert.match(d.fields.description,/Build & test/);
  assert.equal(extractSource('<title>Acme</title>','https://example.com').fields.category,'');
});
test('URL checks reject local networks, mapped addresses and redirects to private destinations',async()=>{
  for(const ip of ['127.0.0.1','10.0.0.1','169.254.169.254','172.16.1.2','192.168.1.2','100.64.0.1','::1','::ffff:127.0.0.1','fc00::1','fe80::1','2002:7f00:1::'])assert.equal(publicAddress(ip),false,ip);
  assert.equal(publicAddress('8.8.8.8'),true);assert.equal(publicAddress('2606:4700:4700::1111'),true);
  let requests=0;await assert.rejects(fetchSource('https://public.example',{resolve:async()=>[{address:'127.0.0.1',family:4}],request:()=>requests++}));assert.equal(requests,0);
  assert.equal(canonicalURL('https://www.example.com/story?utm_source=x#hi'),'https://example.com/story');
});

test('same wording with different word order is only a possible match, and old unrelated coverage is excluded',()=>{
 const candidate={url:'https://new.example',headline:'Acme buys Beta tokenized treasury fund',published_at:'2026-10-16'};
 assert.equal(newsMatches(candidate,[{id:'a',url:'https://old.example',headline:'Beta buys Acme tokenized treasury fund',published_at:'2026-10-15'}])[0].match,'possible');
 assert.equal(newsMatches(candidate,[{id:'a',url:'https://old.example',headline:candidate.headline,published_at:'2025-10-16'}]).length,0);
});
test('mirrored previews cannot publish and per-browser submission limits persist',async()=>{
 const mirror=setup({env:{...env,SITE_PUBLIC_API_ORIGIN:'https://www.rwaf.xyz'}});assert.equal((await mirror.call()).status,503);assert.equal(mirror.files.size,1);
 const s=setup(),c=await s.unlock();const state=s.files.get(STATE_PATH).value;state.sessions.at(-1).requests=Array(40).fill(Date.now());assert.equal((await s.call({action:'inspect',kind:'news',url:'https://example.com'},c)).status,429);
});

test('a teammate can confirm related coverage without publishing another article',async()=>{
 let headline='Acme launches new tokenized treasury fund';
 const s=setup({source:async url=>({url,html:newsHTML.replace('Acme launches new tokenized treasury fund',headline)})}),c=await s.unlock(),first=await inspect(s,c);const saved=await publish(s,c,first);
 headline='Acme launches new tokenized treasury fund for institutions';const next=await inspect(s,c,'news','https://different.example/report');assert.equal(next.matches[0].match,'possible');
 const confirmed=await s.call({action:'use_existing',id:next.id,existingId:saved.body.receipt.details.id},c);assert.equal(confirmed.status,200);assert.equal(confirmed.body.receipt.status,'existing');assert.equal((await readArchive({env,storage:s.storage})).items.length,1);
});

test('only the six approved emails can obtain and redeem email codes; codes are bound to the recipient',async()=>{
 const sent=[],mailEnv={...env,RESEND_API_KEY:'test',EMAIL_FROM:'RWAF <test@example.com>'};
 const s=setup({env:mailEnv,sendCode:async message=>{sent.push(message);}});
 assert.equal((await s.call({action:'request_code',email:'stranger@rwaf.xyz'})).status,403);
 assert.equal((await s.call({action:'create_code',email:'stranger@rwaf.xyz'},testCookie)).status,403);
 for(const email of ['dev@rwaf.xyz','happy@rwaf.xyz','zeus@rwaf.xyz','flynn@rwaf.xyz','ray@wallydao.xyz','ray@rwaf.xyz']) {
  const requested=await s.call({action:'request_code',email:email.toUpperCase()});assert.equal(requested.status,200);assert.equal(requested.body.code,undefined);
  const message=sent.at(-1);assert.equal(message.email,email);assert.match(message.code,/^\d{8}$/);assert.ok(!JSON.stringify(s.files.get(STATE_PATH).value).includes(message.code));
  const wrong=await s.call({action:'redeem',email:email==='happy@rwaf.xyz'?'dev@rwaf.xyz':'happy@rwaf.xyz',code:message.code,challenge:requested.body.challenge});assert.equal(wrong.status,401);
  const redeemed=await s.call({action:'redeem',email,code:message.code,challenge:requested.body.challenge});assert.equal(redeemed.status,200);
  assert.equal((await s.call({action:'redeem',email,code:message.code,challenge:requested.body.challenge})).status,401);
 }
 assert.equal(sent.length,6);
});
test('emailed codes expire after ten minutes and lock after five guesses; repeated sends are throttled',async()=>{
 let clock=Date.now(),sent=[];const s=setup({env:{...env,RESEND_API_KEY:'test',EMAIL_FROM:'test@example.com'},now:()=>clock,sendCode:async m=>{sent.push(m);}}),email='ray@rwaf.xyz';
 let r=await s.call({action:'request_code',email});const first=sent.at(-1);assert.equal((await s.call({action:'request_code',email})).status,429);assert.equal(sent.length,1);
 const wrong=first.code==='00000000'?'11111111':'00000000';for(let i=0;i<5;i++)assert.equal((await s.call({action:'redeem',email,code:wrong,challenge:r.body.challenge})).status,401);
 assert.equal((await s.call({action:'redeem',email,code:first.code,challenge:r.body.challenge})).status,401);
 clock+=61000;r=await s.call({action:'request_code',email});const second=sent.at(-1);clock+=10*60000;
 assert.equal((await s.call({action:'redeem',email,code:second.code,challenge:r.body.challenge})).status,401);
});
test('failed email delivery does not acknowledge success or leave a redeemable grant',async()=>{
 const s=setup({env:{...env,RESEND_API_KEY:'test',EMAIL_FROM:'test@example.com'},sendCode:async()=>{throw Error('Offline');}});
 const r=await s.call({action:'request_code',email:'ray@wallydao.xyz'});assert.equal(r.status,502);assert.equal(s.files.get(STATE_PATH).value.codes.length,0);
});
test('legacy sessions without an approved email cannot bypass the whitelist',async()=>{
 const s=setup(),cookie=await s.unlock();delete s.files.get(STATE_PATH).value.sessions.at(-1).email;assert.equal((await s.call(null,cookie)).body.authenticated,false);
});
test('email provider uses the exact approved recipient and never returns a code through the API',async()=>{
 const {sendAccessCode}=await import('../lib/fast-submit-access.js');let captured;
 await sendAccessCode({email:'ray@wallydao.xyz',code:'12345678',id:'test-id'},{env:{RESEND_API_KEY:'key',EMAIL_FROM:'RWAF <codes@rwaf.xyz>'},fetchImpl:async(url,options)=>{captured={url,...options};return new Response('{"id":"sent"}');}});
 assert.deepEqual(JSON.parse(captured.body).to,['ray@wallydao.xyz']);assert.match(JSON.parse(captured.body).text,/12345678/);assert.equal(captured.headers['Idempotency-Key'],'rwaf-fast-access/test-id');
 await assert.rejects(sendAccessCode({email:'not-allowed@example.com',code:'12345678',id:'test-id'},{env:{RESEND_API_KEY:'key',EMAIL_FROM:'RWAF <codes@rwaf.xyz>'},fetchImpl:()=>assert.fail('Must not send')}));
});
