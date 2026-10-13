import {createHash,createHmac,timingSafeEqual,randomUUID} from 'node:crypto';
import {isIP} from 'node:net';
import {get,put,BlobError,BlobPreconditionFailedError} from '@vercel/blob';
import {validateMembership} from '../assets/membership-model.js';
import {queueSubmissionEmail} from '../lib/submission-emails.js';
const PATH='membership-submissions.json',DAY=86400000;
const conflict=e=>e instanceof BlobPreconditionFailedError||(e instanceof BlobError&&/already exists/i.test(e.message));
export function createMembershipHandler(storage={get,put},{env=process.env,now=()=>new Date()}={}){
 return async(req,res)=>{
  for(const name of ['Cache-Control','CDN-Cache-Control','Vercel-CDN-Cache-Control'])res.setHeader(name,'no-store');
  if(req.method!=='POST')return res.status(405).json({error:'POST only'});
  const b=req.body;
  if(!/^application\/json(?:;|$)/i.test(req.headers?.['content-type']||''))return res.status(415).json({error:'JSON required.'});
  const origin=req.headers?.origin,host=req.headers?.host;
  if(!host||!origin||(origin!==`https://${host}`&&!(env.NODE_ENV!=='production'&&origin===`http://${host}`)))return res.status(403).json({error:'Submit from this website.'});
  if(!b||typeof b!=='object'||Array.isArray(b))return res.status(400).json({error:'Invalid request.'});
  if(Buffer.byteLength(JSON.stringify(b))>40000)return res.status(413).json({error:'Application too large.'});
  const submitting=b.action==='submit';
  if(!submitting){
   const hash=env.JOBS_ADMIN_PW?createHash('sha256').update(env.JOBS_ADMIN_PW).digest('hex'):env.JOBS_ADMIN_PW_SHA256;
   if(!hash||!/^[a-f0-9]{64}$/.test(hash)||!timingSafeEqual(createHash('sha256').update(typeof b.pw==='string'?b.pw:'').digest(),Buffer.from(hash,'hex')))return res.status(401).json({error:'Session expired. Sign in again.'});
  }
  if(submitting&&b.application?.websiteConfirm)return res.status(200).json({ok:true});
  const input=submitting?validateMembership(b.application):null;
  if(input?.error)return res.status(400).json(input);
  const token=env.BLOB_READ_WRITE_TOKEN;if(!token)return res.status(503).json({error:'Applications are temporarily unavailable. Please keep this page open and retry.'});
  const timestamp=new Date(now()).toISOString(),time=Date.parse(timestamp);
  const forwarded=env.VERCEL==='1'?req.headers?.['x-vercel-forwarded-for']:null;
  const ip=(typeof forwarded==='string'?forwarded.split(',')[0].trim():'')||req.socket?.remoteAddress;
  if(submitting&&!isIP(ip||'')&&env.NODE_ENV==='production')return res.status(503).json({error:'Could not validate the request. Please retry.'});
  const ipKey=isIP(ip||'')?createHmac('sha256',token).update(ip).digest('hex'):null;
  try{for(let attempt=0;attempt<3;attempt++){
   const stored=await storage.get(PATH,{access:'private',token,useCache:false,headers:{'Accept-Encoding':'identity'}});
   const store=stored?await new Response(stored.stream).json():{version:1,submissions:[],rateLimits:{}};
   const revision=stored?.blob?.etag||null;
   if(store.version!==1||!Array.isArray(store.submissions)||!store.rateLimits||(stored&&(!revision||/^W\//i.test(revision))))throw Error('Invalid storage');
   const rows=store.submissions;
   if(b.action==='list_all')return res.status(200).json({submissions:rows,revision});
   if(submitting){
    const prior=rows.find(row=>row.application.email===input.answers.email&&row.application.company.toLowerCase()===input.answers.company.toLowerCase()&&time-Date.parse(row.submittedAt)<DAY);
    if(prior)return res.status(200).json({ok:true,emailQueued:!!prior.notifications?.received});
    if(rows.length>=3000)return res.status(503).json({error:'The application queue is full. Please contact happy@rwaf.xyz.'});
    store.rateLimits=Object.fromEntries(Object.entries(store.rateLimits).map(([key,times])=>[key,times.filter(t=>t<=time&&time-t<DAY)]).filter(([,times])=>times.length));
    const times=store.rateLimits[ipKey]||[];
    if(times.length>=10||times.filter(t=>time-t<3600000).length>=5){res.setHeader('Retry-After','3600');return res.status(429).json({error:'Too many attempts. Please try again later.'});}
    if(ipKey)store.rateLimits[ipKey]=[...times,time];
    const row={id:randomUUID(),status:'pending',submittedAt:timestamp,updatedAt:timestamp,application:input.answers};
    queueSubmissionEmail(row,'membership','received',input.answers.email,timestamp);rows.push(row);
   }else if(b.action==='moderate'){
    if(b.revision!==revision)return res.status(409).json({error:'Applications changed. Refresh the review queue.'});
    const row=rows.find(r=>r.id===b.id);
    if(!row||!['pending','reviewing','approved','rejected'].includes(b.status))return res.status(400).json({error:'Invalid application or status.'});
    row.status=b.status;row.updatedAt=timestamp;
   }else return res.status(400).json({error:'Unknown action.'});
   try{const saved=await storage.put(PATH,JSON.stringify(store),{access:'private',token,contentType:'application/json',addRandomSuffix:false,allowOverwrite:revision!==null,...(revision?{ifMatch:revision}:{})});return res.status(200).json({ok:true,revision:saved.etag,...(submitting?{emailQueued:true}:{})});}
   catch(e){if(conflict(e)){if(submitting)continue;return res.status(409).json({error:'Applications changed. Refresh the review queue.'});}throw e;}
  }return res.status(409).json({error:'Another application arrived at the same time. Please retry.'});}
  catch(e){console.error('Membership storage failed:',e.name);return res.status(502).json({error:'Could not save your application. Keep this page open and retry.'});}
 };
}
export default createMembershipHandler();
