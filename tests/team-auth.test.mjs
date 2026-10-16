import test from 'node:test';
import assert from 'node:assert/strict';
import {createFastSubmitHandler} from '../api/fast-submit.js';
import {createLogoHandler} from '../api/logos.js';
import {createJobsHandler} from '../api/jobs.js';
import {createEcosystemHandler} from '../api/ecosystem.js';
import {createMembershipHandler} from '../api/membership.js';
import {createNewsHandler} from '../api/news.js';
import {STATE_PATH,SESSION_COOKIE} from '../lib/fast-submit-store.js';
import {teamEmails} from '../lib/fast-submit-access.js';
process.env.BLOB_READ_WRITE_TOKEN='test';process.env.JOBS_ADMIN_PW='legacy-password';
const env={BLOB_READ_WRITE_TOKEN:'test',RESEND_API_KEY:'test',EMAIL_FROM:'test@example.com',NODE_ENV:'production'};
async function call(h,body,cookie='',headers={}){const result={headers:{}};await h({method:body?'POST':'GET',query:{session:'1'},body,headers:{host:'www.rwaf.xyz',origin:'https://www.rwaf.xyz','content-type':'application/json',cookie,...headers}},{setHeader(k,v){result.headers[k]=v;},status(n){result.status=n;return this;},json(value){result.body=value;}});return result;}
function setup(){const files=new Map();let mail,rev=0;const storage={async get(p){return files.has(p)?{stream:new Response(JSON.stringify(files.get(p))).body,blob:{etag:'v'+rev}}:null;},async put(p,b){files.set(p,JSON.parse(b));return {etag:'v'+(++rev)};}};
const login=createFastSubmitHandler({storage,env,sendCode:async m=>{mail=m;}});
const endpoints=[
 ['logos',createLogoHandler(storage),{store:{}},400],
 ['jobs',createJobsHandler(storage),{action:'list_all'},200],
 ['ecosystem',createEcosystemHandler(storage,{env}),{action:'list_all'},200],
 ['membership',createMembershipHandler(storage,{env}),{action:'list_all'},200],
 ['news',createNewsHandler({storage,env}),{action:'hide',id:'test'},503],
 ['access codes',login,{action:'create_code',email:'happy@rwaf.xyz'},200]
];
async function unlock(email){const request=await call(login,{action:'request_code',email});assert.equal(request.status,200);const used=await call(login,{action:'redeem',email,code:mail.code,challenge:request.body.challenge});assert.equal(used.status,200);return used.headers['Set-Cookie'].split(';')[0];}
return {files,storage,login,endpoints,unlock};}
test('all six email-code logins unlock every admin API and the shared session lookup',async()=>{
 for(const email of teamEmails){const s=setup(),cookie=await s.unlock(email);const session=await call(s.login,null,cookie);assert.equal(session.body.email,email);assert.equal(session.body.categories,undefined);
  for(const [name,h,body,status] of s.endpoints){const r=await call(h,body,cookie);assert.equal(r.status,status,name+': '+JSON.stringify(r.body));assert.equal(r.headers['Cache-Control'],'no-store');}
 }
});
test('every admin API rejects old passwords, forged, expired, revoked and non-whitelisted sessions',async()=>{
 const s=setup(),cookie=await s.unlock('happy@rwaf.xyz'),saved=structuredClone(s.files.get(STATE_PATH));
 const rejected=async c=>{for(const [name,h,body] of s.endpoints)assert.equal((await call(h,{...body,pw:'legacy-password'},c)).status,401,name);};
 await rejected('');await rejected(`${SESSION_COOKIE}=${'x'.repeat(32)}`);
 for(const change of [state=>{state.sessions[0].expires=Date.now()-1;},state=>{state.sessions=[];},state=>{state.sessions[0].email='stranger@rwaf.xyz';},state=>{delete state.sessions[0].email;}]){const state=structuredClone(saved);change(state);s.files.set(STATE_PATH,state);await rejected(cookie);}
 s.files.set(STATE_PATH,saved);for(const [name,h,body] of s.endpoints){assert.equal((await call(h,body,cookie,{origin:'https://evil.example'})).status,403,name);assert.equal((await call(h,body,cookie,{'content-type':'text/plain'})).status,415,name);}
});
test('sign-out and revoke-all invalidate access to both fast submission and admin',async()=>{
 for(const action of ['logout','revoke_sessions']){const s=setup(),cookie=await s.unlock('ray@rwaf.xyz');assert.equal((await call(s.login,{action},cookie)).status,200);assert.equal((await call(s.login,null,cookie)).body.authenticated,false);for(const [name,h,body] of s.endpoints)assert.equal((await call(h,body,cookie)).status,401,name);}
});
test('authentication storage outages fail closed on all admin routes',async()=>{
 const s=setup(),cookie=await s.unlock('ray@wallydao.xyz');s.storage.get=async()=>{throw Error('offline');};for(const [name,h,body] of s.endpoints){const r=await call(h,body,cookie);assert.ok([502,503].includes(r.status),name);}
});
