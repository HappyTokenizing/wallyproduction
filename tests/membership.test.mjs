import test from 'node:test';
import assert from 'node:assert/strict';
import {BlobError,BlobPreconditionFailedError} from '@vercel/blob';
import {createMembershipHandler} from '../api/membership.js';
import {membershipFields,validateMembership} from '../assets/membership-model.js';
const application={firstName:'Test',lastName:'Applicant',email:'test@example.com',company:'Example Company',website:'https://example.com',roles:['Infrastructure for RWAs'],referral:['X/ Twitter'],hasTokenized:'No',hasInvested:'No',motivation:['To support the RWA industry and collaborate with other members'],description:'Build useful RWA infrastructure.',hasToken:'No',community:'Developers and builders.',hasFunding:'No',workingGroups:['Seeding Liquidity for RWA Markets'],participation:['Research'],mission:'Open access to real-world assets.',notes:''};
const env={BLOB_READ_WRITE_TOKEN:'test',JOBS_ADMIN_PW:'test-pw',NODE_ENV:'production',VERCEL:'1'};
function setup(){let data=null,revision=0;const storage={async get(){return data?{stream:new Response(JSON.stringify(data)).body,blob:{etag:'v'+revision}}:null;},async put(p,b,o){if(data&&!o.allowOverwrite)throw new BlobError('already exists');if(o.ifMatch&&o.ifMatch!=='v'+revision)throw new BlobPreconditionFailedError();data=JSON.parse(b);return {etag:'v'+(++revision)};}};return {h:createMembershipHandler(storage,{env}),data:()=>data};}
async function call(h,body,headers={},method='POST'){const r={};await h({method,body,headers:{host:'www.rwaf.xyz',origin:'https://www.rwaf.xyz','content-type':'application/json','x-vercel-forwarded-for':'203.0.113.8',...headers}},{setHeader(){},status(s){r.status=s;return this;},json(body){r.body=body;}});return r;}
const admin=(h,body={})=>call(h,{action:'list_all',pw:'test-pw',...body});
test('membership preserves non-fee questions and validates conditional answers server-side',()=>{
 assert.equal(membershipFields.length,32);assert.ok(!membershipFields.some(f=>/fee|\$15,000|\$5,500/i.test(f.label)));
 assert.ok(validateMembership(application).answers);
 assert.ok(validateMembership({...application,hasTokenized:'Yes'}).errors.tokenizedDescription);
 assert.ok(validateMembership({...application,hasToken:'Yes'}).errors.ticker);
 assert.ok(validateMembership({...application,hasFunding:'Yes'}).errors.funding);
 assert.ok(validateMembership({...application,hasInvested:'Yes'}).errors.purchasedAssets);
 assert.ok(validateMembership({...application,referral:['Other']}).errors.referral);
 assert.ok(validateMembership({...application,referral:['Other'],referralOther:'A conference'}).answers);
 for(const changes of [{email:'bad'},{firstName:{}},{roles:['Invented']},{hasToken:'Maybe'},{website:'javascript:bad'},{website:'https://u:p@example.com'},{mission:'x'.repeat(1001)}])assert.ok(validateMembership({...application,...changes}).error);
 assert.equal(validateMembership({...application,hasToken:'No',ticker:'ignored',fee:'Yes'}).answers.ticker,undefined);
});
test('membership submissions remain private, atomically queue receipts and deduplicate retries',async()=>{
 const {h,data}=setup();const result=await call(h,{action:'submit',application:{...application,status:'approved',id:'chosen'}});assert.equal(result.status,200);assert.equal(result.body.emailQueued,true);
 const row=data().submissions[0];assert.equal(row.status,'pending');assert.notEqual(row.id,'chosen');assert.equal(row.application.status,undefined);assert.equal(row.notifications.received.status,'pending');assert.equal(row.notifications.received.to,application.email);
 assert.equal(result.body.reference,'M-000001');assert.equal(row.reference,result.body.reference);assert.equal(Object.values(row.notifications).length,3);
 await call(h,{action:'submit',application});assert.equal(data().submissions.length,1);
 assert.equal((await call(h,null,{},'GET')).status,405);assert.equal((await call(h,{action:'list_all',pw:'wrong'})).status,401);
 let list=await admin(h);assert.equal((await admin(h,{action:'moderate',id:row.id,status:'reviewing',revision:list.body.revision})).status,200);
 assert.equal((await admin(h,{action:'moderate',id:row.id,status:'approved',revision:list.body.revision})).status,409);
});
test('membership abuse controls reject cross-site, oversized and excessive submissions',async()=>{
 const {h,data}=setup();assert.equal((await call(h,{action:'submit',application:{...application,websiteConfirm:'bot'}})).status,200);assert.equal(data(),null);
 assert.equal((await call(h,{action:'submit',application},{origin:'https://evil.example'})).status,403);
 assert.equal((await call(h,{action:'submit',application},{'content-type':'text/plain'})).status,415);
 assert.equal((await call(h,{action:'submit',application:{...application,notes:'x'.repeat(41000)}})).status,413);
 for(let i=0;i<5;i++)assert.equal((await call(h,{action:'submit',application:{...application,company:'Company '+i}})).status,200);
 assert.equal((await call(h,{action:'submit',application:{...application,company:'Sixth'}})).status,429);
});
test('membership storage failure never acknowledges receipt or queues an external send',async()=>{
 const h=createMembershipHandler({async get(){throw Error('offline');}},{env});assert.equal((await call(h,{action:'submit',application})).status,502);
});
