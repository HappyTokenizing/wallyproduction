import test from 'node:test';
import assert from 'node:assert/strict';
import {BlobError,BlobPreconditionFailedError} from '@vercel/blob';
import {assignSubmissionReferences,queueTeamSubmissionEmails,queueSubmissionEmail,emailMessage,flushSubmissionEmails,sendSubmissionEmail,emailStores} from '../lib/submission-emails.js';
import {createEmailCron} from '../api/submission-emails.js';
const env={RESEND_API_KEY:'test',EMAIL_FROM:'RWAF <receipts@rwaf.xyz>',EMAIL_REPLY_TO:'happy@rwaf.xyz',BLOB_READ_WRITE_TOKEN:'blob'};
function setup(){const stores=new Map(),revisions=new Map();return {stores,storage:{async get(p){return stores.has(p)?{stream:new Response(JSON.stringify(stores.get(p))).body,blob:{etag:'v'+revisions.get(p)}}:null;},async put(p,b,o){if(stores.has(p)&&!o.allowOverwrite)throw new BlobError('already exists');if(o.ifMatch&&o.ifMatch!=='v'+revisions.get(p))throw new BlobPreconditionFailedError();stores.set(p,JSON.parse(b));const rev=(revisions.get(p)||0)+1;revisions.set(p,rev);return {etag:'v'+rev};}},seed(kind,row){const p=emailStores[kind];stores.set(p,kind==='jobs'?[row]:{version:1,submissions:[row],rateLimits:{}});revisions.set(p,1);},event(kind){const data=stores.get(emailStores[kind]);return (Array.isArray(data)?data:data.submissions)[0].notifications.received;}};}
function row(kind){const r={id:'test-'+kind};assignSubmissionReferences([r],kind);queueSubmissionEmail(r,kind,'received','person@example.com','2026-10-13');return r;}
test('receipt and publication messages are fixed, private, and single-enqueued',()=>{
 for(const kind of Object.keys(emailStores)){const r=row(kind);assert.equal(queueSubmissionEmail(r,kind,'received','other@example.com'),false);const message=emailMessage(r.notifications.received);assert.match(message.text,/reviewing it internally and will reach back out/);assert.match(message.subject,/received/);assert.equal(message.text.includes('other@example.com'),false);}
 const r=row('jobs');queueSubmissionEmail(r,'jobs','published','person@example.com');assert.match(emailMessage(r.notifications.published).text,/https:\/\/www.rwaf.xyz\/jobs\//);
 assert.equal(queueSubmissionEmail({},'jobs','received','bad'),false);
});
test('delivery persists sent state and concurrent workers send each receipt once',async()=>{
 const f=setup();for(const kind of Object.keys(emailStores))f.seed(kind,row(kind));const sent=[];const send=async event=>{sent.push(event.id);return 'provider-'+event.id;};
 await Promise.all([flushSubmissionEmails({...f,env,send}),flushSubmissionEmails({...f,env,send})]);
 assert.equal(sent.length,3);assert.equal(new Set(sent).size,3);for(const kind of Object.keys(emailStores))assert.equal(f.event(kind).status,'sent');
 await flushSubmissionEmails({...f,env,send});assert.equal(sent.length,3);
});
test('provider errors preserve pending notifications and retry the same idempotency identity',async()=>{
 const f=setup();f.seed('jobs',row('jobs'));let time=new Date('2026-10-13T12:00:00Z');const ids=[];const send=async e=>{ids.push(e.id);if(ids.length===1)throw Error('offline');return 'accepted';};
 assert.equal((await flushSubmissionEmails({...f,env,now:()=>time,send})).failed,1);assert.equal(f.event('jobs').status,'pending');await flushSubmissionEmails({...f,env,now:()=>time,send});assert.equal(ids.length,1);
 time=new Date(+time+180000);await flushSubmissionEmails({...f,env,now:()=>time,send});assert.equal(f.event('jobs').status,'sent');assert.equal(ids[0],ids[1]);
});
test('ambiguous retries stop before provider deduplication expires; unconfigured mail does not pretend to send',async()=>{
 const f=setup();const r=row('jobs');Object.assign(r.notifications.received,{firstAttemptAt:'2026-10-12T00:00:00Z',status:'sending',leaseUntil:'2026-10-12T00:02:00Z'});f.seed('jobs',r);let calls=0;
 await flushSubmissionEmails({...f,env,now:()=>new Date('2026-10-13'),send:async()=>calls++});assert.equal(calls,0);assert.equal(f.event('jobs').status,'review');
 const result=await flushSubmissionEmails({...f,env:{BLOB_READ_WRITE_TOKEN:'blob'},send:async()=>calls++});assert.equal(result.configurationRequired,true);assert.equal(calls,0);
});
test('Resend requests use an idempotency key, verified sender config and isolated staging recipients',async()=>{
 const event=row('jobs').notifications.received;let call;
 const fetchImpl=async(url,options)=>{call={url,options};return new Response(JSON.stringify({id:'accepted'}),{status:200});};
 assert.equal(await sendSubmissionEmail(event,{env,fetchImpl}),'accepted');assert.equal(call.url,'https://api.resend.com/emails');assert.equal(call.options.headers['Idempotency-Key'],'rwaf-submission/'+event.id);assert.equal(JSON.parse(call.options.body).reply_to,env.EMAIL_REPLY_TO);
 await assert.rejects(sendSubmissionEmail(event,{env:{...env,SITE_PUBLIC_API_ORIGIN:'https://www.rwaf.xyz'},fetchImpl}));
 await assert.rejects(sendSubmissionEmail(event,{env:{...env,EMAIL_ALLOWED_RECIPIENTS:'someone@example.com'},fetchImpl}));
});
test('email cron requires the cron secret and does not accept public calls',async()=>{
 let calls=0;const handler=createEmailCron({env:{CRON_SECRET:'secret'},flush:async()=>{calls++;return {sent:1};}});
 async function call(authorization){const result={};await handler({method:'GET',headers:{authorization}},{setHeader(){},status(s){result.status=s;return this;},json(b){result.body=b;}});return result;}
 assert.equal((await call('Bearer wrong')).status,401);assert.equal(calls,0);assert.equal((await call('Bearer secret')).status,200);assert.equal(calls,1);
});

test('withdrawn listings do not send queued publication notices',async()=>{
 const f=setup(),record=row('jobs');record.status='closed';queueSubmissionEmail(record,'jobs','published','person@example.com');f.seed('jobs',record);const messages=[];
 await flushSubmissionEmails({...f,env,send:async e=>{messages.push(e.event);return 'accepted';}});assert.deepEqual(messages,['received']);
});

test('short references preserve existing numbers and migrate only unsent email references',()=>{
 const rows=[{id:'legacy',notifications:{received:{reference:'legacy',status:'sent'},published:{reference:'legacy',status:'pending'},retry:{reference:'legacy',status:'pending',firstAttemptAt:'2026-10-13'}}},{id:'existing',reference:'M-000012'},{id:'new'}];
 assignSubmissionReferences(rows,'membership');
 assert.deepEqual(rows.map(row=>row.reference),['M-000013','M-000012','M-000014']);
 assert.equal(rows[0].notifications.received.reference,'legacy');assert.equal(rows[0].notifications.published.reference,'M-000013');
 assert.equal(rows[0].notifications.retry.reference,'legacy');
 assignSubmissionReferences(rows,'membership');assert.equal(rows[2].reference,'M-000014');
 assert.match(emailMessage(row('jobs').notifications.received).text,/Reference: J-000001/);
});

test('internal copies contain submitted details and go once to each requested reviewer',async()=>{
 const r=row('membership');r.application={firstName:'Test',lastName:'Applicant',email:'person@example.com',company:'Test Company',funding:'Private funding answer',roles:['Other'],rolesOther:'Additional role'};r.submittedAt='2026-10-13';
 queueTeamSubmissionEmails(r,'membership','2026-10-13',{});queueTeamSubmissionEmails(r,'membership','2026-10-13',{});
 const team=Object.values(r.notifications).filter(event=>event.event==='team');
 assert.deepEqual(team.map(e=>e.to),['flynn@rwaf.xyz','zeus@rwaf.xyz']);assert.equal(team.length,2);
 for(const event of team){const message=emailMessage(event,r);assert.match(message.text,/Private funding answer/);assert.match(message.text,/Additional role/);assert.match(message.text,/https:\/\/www.rwaf.xyz\/admin\//);assert.match(message.subject,/M-000001/);}
 assert.doesNotMatch(emailMessage(r.notifications.received,r).text,/Private funding answer|Test Company/);
 const f=setup();f.seed('membership',r);const sent=[];
 await flushSubmissionEmails({...f,env,send:async(event,{submission})=>{sent.push({to:event.to,...emailMessage(event,submission)});return event.id;}});
 await flushSubmissionEmails({...f,env,send:async()=>{throw Error('Duplicate email');}});
 assert.equal(sent.length,3);assert.match(sent.find(e=>e.to==='zeus@rwaf.xyz').text,/Private funding answer/);
});

test('job and directory team copies include original details; staging stays in test inboxes',()=>{
 for(const kind of ['jobs','ecosystem']){
  const r=row(kind);if(kind==='jobs')Object.assign(r,{company:'Test Co',role:'Engineer',email:'person@example.com',description:'Original job description'});else r.submission={name:'Test Co',description:'Original directory description',email:'person@example.com'};
  queueTeamSubmissionEmails(r,kind,'2026-10-13',{SITE_PUBLIC_API_ORIGIN:'https://www.rwaf.xyz',EMAIL_ALLOWED_RECIPIENTS:'dev@rwaf.xyz,dev@rwaf.xyz'});
  const team=Object.values(r.notifications).filter(e=>e.event==='team');assert.equal(team.length,1);assert.equal(team[0].to,'dev@rwaf.xyz');
  const message=emailMessage(team[0],r);assert.match(message.text,/Test Co/);assert.match(message.text,/person@example.com/);assert.match(message.text,/https:\/\/wallystaging.vercel.app\/admin\//);
 }
 const r=row('jobs');queueTeamSubmissionEmails(r,'jobs','2026-10-13',{SITE_PUBLIC_API_ORIGIN:'https://www.rwaf.xyz'});assert.equal(Object.values(r.notifications).length,1);
});
