import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {BlobError,BlobPreconditionFailedError} from '@vercel/blob';
import {createJobsHandler} from '../api/jobs.js';
process.env.BLOB_READ_WRITE_TOKEN='test';process.env.JOBS_ADMIN_PW='test-pw';
const job={company:'Company',role:'Engineer',type:'Full time',work:'Remote',location:'NY',comp:'',tags:['RWA'],description:'A real description that contains more than forty characters.',apply_to:'https://example.com/careers',email:'private@example.com',member:1};
function setup(){let data=null,rev=0,writes=0;const h=createJobsHandler({async get(){return data?{stream:new Response(JSON.stringify(data)).body,blob:{etag:'v'+rev}}:null;},async put(p,b,o){if(data&&!o.allowOverwrite)throw new BlobError('already exists');if(o.ifMatch&&o.ifMatch!=='v'+rev)throw new BlobPreconditionFailedError();data=JSON.parse(b);writes++;return {etag:'v'+(++rev)};}});return {h,writes:()=>writes};}
async function call(h,body,method='POST',headers={}){const r={};await h({method,body,headers:{host:'www.rwaf.xyz',origin:'https://www.rwaf.xyz','content-type':'application/json',...headers}},{setHeader(){},status(c){r.status=c;return this},json(b){r.body=b}});return r;}
const admin=(h,extra={})=>call(h,{action:'list_all',pw:'test-pw',...extra});
test('submissions are private, require approval, omit contact details publicly and can be closed',async()=>{
 const {h}=setup();assert.equal((await call(h,{action:'submit',job:{...job,status:'live',featured:1,id:'chosen'}})).status,200);
 assert.deepEqual((await call(h,null,'GET')).body.jobs,[]);
 assert.equal((await call(h,{action:'list_all',pw:'wrong'})).status,401);
 let a=await admin(h);const row=a.body.jobs[0];assert.equal(row.status,'pending');assert.notEqual(row.id,'chosen');assert.equal(row.featured,undefined);
 assert.equal((await admin(h,{action:'moderate',id:row.id,status:'live',revision:a.body.revision})).status,200);
 const pub=(await call(h,null,'GET')).body.jobs;assert.equal(pub.length,1);assert.equal(pub[0].email,undefined);assert.equal(pub[0].member,undefined);
 assert.equal((await admin(h,{action:'moderate',id:row.id,status:'closed',revision:a.body.revision})).status,409);
 a=await admin(h);await admin(h,{action:'moderate',id:row.id,status:'closed',revision:a.body.revision});assert.equal((await call(h,null,'GET')).body.jobs.length,0);
});
test('honeypots, cross-site requests, malformed fields and unsafe links never create records',async()=>{
 const {h,writes}=setup();assert.equal((await call(h,{action:'submit',job:{...job,website:'bot'}})).status,200);
 assert.equal((await call(h,{action:'submit',job},'POST',{origin:'https://other.example'})).status,403);
 assert.equal((await call(h,{action:'submit',job},'POST',{'content-type':'text/plain'})).status,415);
 for(const change of [{company:{}},{description:'short'},{email:'bad'},{apply_to:'javascript:alert(1)'},{apply_to:'https://u:p@example.com'},{tags:['a'.repeat(41)]},{type:'malformed'},{company:'a'.repeat(61)}])assert.equal((await call(h,{action:'submit',job:{...job,...change}})).status,400);
 assert.equal(writes(),0);
});
test('repeat submissions deduplicate and concurrent writes preserve all records',async()=>{
 const {h}=setup();const requests=await Promise.all(['A','B'].map(company=>call(h,{action:'submit',job:{...job,company}})));assert.ok(requests.every(r=>r.status===200));
 await call(h,{action:'submit',job:{...job,company:'A'}});assert.equal((await admin(h)).body.jobs.length,2);
});
test('storage failures never claim success and hashed admin credentials work',async()=>{
 const h=createJobsHandler({async get(){throw Error('offline')}});assert.equal((await call(h,{action:'submit',job})).status,502);
 delete process.env.JOBS_ADMIN_PW;process.env.JOBS_ADMIN_PW_SHA256=createHash('sha256').update('test-pw').digest('hex');
 assert.equal((await admin(setup().h)).status,200);process.env.JOBS_ADMIN_PW='test-pw';
});
