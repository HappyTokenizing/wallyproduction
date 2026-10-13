import {randomUUID,timingSafeEqual} from 'node:crypto';
import {get,put,BlobError,BlobPreconditionFailedError} from '@vercel/blob';
export const emailStores = {jobs:'job-submissions.json',ecosystem:'ecosystem-submissions.json',membership:'membership-submissions.json'};
const rowsOf=store=>Array.isArray(store)?store:store.submissions;
const conflict=e=>e instanceof BlobPreconditionFailedError||(e instanceof BlobError&&/already exists/i.test(e.message));
const emailPattern=/^[^\s@:/<>]+@[^\s@:/<>]+\.[^\s@:/<>]+$/;
export function queueSubmissionEmail(row,kind,event,to,now=new Date()) {
 if(!emailPattern.test(to||''))return false;
 row.notifications ||= {};
 if(row.notifications[event])return false; // One receipt and one first-publication notice per submission.
 row.notifications[event]={id:randomUUID(),kind,event,to:to.toLowerCase(),reference:row.id,status:'pending',createdAt:new Date(now).toISOString(),attempts:0};
 return true;
}
export function emailMessage(event) {
 const kind={jobs:'job listing',ecosystem:'ecosystem directory submission',membership:'membership application'}[event.kind];
 if(!kind||!['received','published'].includes(event.event))throw Error('Invalid notification');
 const published=event.event==='published';
 const url='https://www.rwaf.xyz/'+({jobs:'jobs/',ecosystem:'ecosystem/',membership:'members/'}[event.kind]);
 const subject=published?`Your ${kind} is now live — RWA Foundation`:`We received your ${kind} — RWA Foundation`;
 const text=published?`Hello,\n\nYour ${kind} has been reviewed and added to the RWA Foundation website.\n\nView it here: ${url}\n\nThank you for contributing to the RWA community. Reply to this email if you have any questions.\n\nThe RWA Foundation team`:`Hello,\n\nThank you for your ${kind}. We have received your submission.\n\nThe RWA Foundation team is reviewing it internally and will reach back out to you with next steps.${event.kind==='membership'?'':' We will also email you when it is added to the website.'}\n\nReply to this email if you have any questions.\n\nThe RWA Foundation team`;
 // Never echo applicant-controlled text, links, financial answers or HTML into email.
 return {subject,text:text+`\n\nReference: ${event.reference}`};
}
export function emailConfigured(env=process.env) {
 return !!env.RESEND_API_KEY&&!!env.EMAIL_FROM&&(!env.SITE_PUBLIC_API_ORIGIN||!!env.EMAIL_ALLOWED_RECIPIENTS);
}
export async function sendSubmissionEmail(event,{env=process.env,fetchImpl=fetch}={}) {
 if(!emailConfigured(env))throw Object.assign(Error('Email setup required'),{code:'configuration'});
 const allowed=(env.EMAIL_ALLOWED_RECIPIENTS||'').split(',').map(s=>s.trim().toLowerCase()).filter(Boolean);
 if(allowed.length&&!allowed.includes(event.to))throw Object.assign(Error('Recipient not enabled in this environment'),{code:'recipient_not_allowed'});
 const response=await fetchImpl('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${env.RESEND_API_KEY}`,'Content-Type':'application/json','Idempotency-Key':`rwaf-submission/${event.id}`},body:JSON.stringify({from:env.EMAIL_FROM,to:[event.to],...(env.EMAIL_REPLY_TO?{reply_to:env.EMAIL_REPLY_TO}:{}),...emailMessage(event)}),signal:AbortSignal.timeout(10000)});
 const data=await response.json().catch(()=>({}));
 if(!response.ok||!data.id)throw Object.assign(Error('Email provider did not confirm acceptance'),{code:`provider_${response.status}`});
 return data.id;
}
async function readStore(storage,path,token){
 const r=await storage.get(path,{access:'private',token,useCache:false,headers:{'Accept-Encoding':'identity'}});
 if(!r)return null;
 if(!r.blob?.etag||/^W\//i.test(r.blob.etag))throw Error('Missing storage revision');
 const store=await new Response(r.stream).json();
 if(!Array.isArray(rowsOf(store)))throw Error('Invalid storage');
 return {store,revision:r.blob.etag};
}
async function changeEvent(storage,path,token,id,update){
 for(let attempt=0;attempt<5;attempt++){
  const state=await readStore(storage,path,token);if(!state)return null;
  const row=rowsOf(state.store).find(row=>Object.values(row.notifications||{}).some(item=>item.id===id));
  const event=Object.values(row?.notifications||{}).find(item=>item.id===id);
  if(!event||!update(event,row))return null;
  try{await storage.put(path,JSON.stringify(state.store),{access:'private',token,contentType:'application/json',addRandomSuffix:false,allowOverwrite:true,ifMatch:state.revision});return event;}
  catch(e){if(!conflict(e))throw e;}
 }
 throw Error('Notification storage busy');
}
export async function flushSubmissionEmails({storage={get,put},env=process.env,now=()=>new Date(),send=sendSubmissionEmail,limit=20}={}) {
 if(!emailConfigured(env))return {sent:0,pending:true,configurationRequired:true};
 const token=env.BLOB_READ_WRITE_TOKEN;if(!token)throw Error('Storage unavailable');
 let sent=0,failed=0,processed=0;
 for(const path of Object.values(emailStores)){
  const state=await readStore(storage,path,token);if(!state)continue;
  for(const row of rowsOf(state.store))for(const event of Object.values(row.notifications||{})){
   if(processed>=limit)return {sent,failed};
   const time=+new Date(now());
   if(event.status==='sent'||event.status==='review'||Date.parse(event.nextAttemptAt||0)>time||Date.parse(event.leaseUntil||0)>time)continue;
   const lease=randomUUID();
   const claimed=await changeEvent(storage,path,token,event.id,(current,owner)=>{
    if(current.event==='published'&&owner.status!==(current.kind==='jobs'?'live':'approved'))return false;
    if(current.status==='sent'||current.status==='review'||Date.parse(current.nextAttemptAt||0)>time||Date.parse(current.leaseUntil||0)>time)return false;
    // Resend deduplicates for 24 hours. Stop ambiguous retries before that expires.
    if(current.firstAttemptAt&&time-Date.parse(current.firstAttemptAt)>23*3600000){current.status='review';current.error='delivery_needs_review';return true;}
    current.status='sending';current.lease=lease;current.leaseUntil=new Date(time+120000).toISOString();current.firstAttemptAt ||= new Date(time).toISOString();current.attempts++;return true;
   });
   if(!claimed||claimed.status==='review')continue;
   processed++;
   let providerId,error;
   try{providerId=await send(claimed,{env});}catch(e){error=String(e.code||'temporary_failure').slice(0,80);}
   await changeEvent(storage,path,token,event.id,current=>{
    if(current.lease!==lease)return false;
    delete current.lease;delete current.leaseUntil;
    if(providerId){current.status='sent';current.providerId=providerId;current.sentAt=new Date(now()).toISOString();delete current.error;delete current.nextAttemptAt;}
    else{current.status='pending';current.error=error;current.nextAttemptAt=new Date(+new Date(now())+Math.min(60,2**Math.min(current.attempts,6))*60000).toISOString();}
    return true;
   });
   if(providerId)sent++;else failed++;
  }
 }
 return {sent,failed};
}
export function cronAuthorized(req,env=process.env){
 const actual=Buffer.from(req.headers?.authorization||''),expected=Buffer.from('Bearer '+(env.CRON_SECRET||''));
 return !!env.CRON_SECRET&&actual.length===expected.length&&timingSafeEqual(actual,expected);
}
