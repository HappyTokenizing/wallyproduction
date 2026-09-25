// Private, project-specific Vercel Blob storage. Public readers receive approved fields only.
import { createHash, timingSafeEqual, randomUUID } from 'node:crypto';
import { get, put, BlobError, BlobPreconditionFailedError } from '@vercel/blob';
const PATH='job-submissions.json';
const email=v=>/^[^\s@:/<>]+@[^\s@:/<>]+\.[^\s@:/<>]+$/.test(v);
export function validateJob(j){
  if(!j||typeof j!=='object'||Array.isArray(j))return null;
  const row={};
  for(const [k,max,min] of [['company',60,1],['role',80,1],['location',70,1],['comp',50,0],['description',900,40],['apply_to',200,1],['email',254,1]]){
    const v=j[k]??'';if(typeof v!=='string'||v.trim().length<min||v.length>max)return null;row[k]=v.trim();
  }
  if(!email(row.email))return null;
  if(!email(row.apply_to)){
    try{const u=new URL(row.apply_to);if(u.protocol!=='https:'||u.username||u.password)return null;}catch{return null;}
  }
  if(!['Full time','Part time','Contract','Internship'].includes(j.type)||!['Remote','Hybrid','On site'].includes(j.work))return null;
  if(!Array.isArray(j.tags)||j.tags.length>4||!j.tags.every(t=>typeof t==='string'&&t.length<=40))return null;
  return {...row,type:j.type,work:j.work,tags:j.tags.map(t=>t.trim()).filter(Boolean),member:j.member===1?1:0};
}
function authenticated(pw){
  const secret=process.env.JOBS_ADMIN_PW;
  const hash=secret?createHash('sha256').update(secret).digest('hex'):process.env.JOBS_ADMIN_PW_SHA256;
  return !!hash&&/^[a-f0-9]{64}$/.test(hash)&&timingSafeEqual(createHash('sha256').update(typeof pw==='string'?pw:'').digest(),Buffer.from(hash,'hex'));
}
function conflict(e){return e instanceof BlobPreconditionFailedError||(e instanceof BlobError&&/already exists/i.test(e.message));}
export function createJobsHandler(storage={get,put}){
 return async(req,res)=>{
  res.setHeader('Cache-Control','no-store');
  if(!['GET','POST'].includes(req.method))return res.status(405).json({error:'GET or POST only'});
  if(req.method==='POST'){
   if(!/^application\/json(?:;|$)/i.test(req.headers?.['content-type']||''))return res.status(415).json({error:'JSON required'});
   const origin=req.headers?.origin;
   // Reject cross-site browser requests. This complements, rather than replaces, the edge rate limit.
   if(!origin||origin!==`https://${req.headers.host}`){
    if(!(process.env.NODE_ENV!=='production'&&origin===`http://${req.headers.host}`))return res.status(403).json({error:'Submit from this website.'});
   }
   if(Buffer.byteLength(JSON.stringify(req.body||{}))>12000)return res.status(413).json({error:'Submission too large.'});
  }
  const b=req.body||{},token=process.env.BLOB_READ_WRITE_TOKEN;
  if(req.method==='POST'&&b.action!=='submit'&&!authenticated(b.pw))return res.status(401).json({error:'Session expired. Sign in again.'});
  if(b.action==='submit'&&b.job?.website)return res.status(200).json({ok:true});
  const input=b.action==='submit'?validateJob(b.job):null;
  if(b.action==='submit'&&!input)return res.status(400).json({error:'Check all fields. Use an HTTPS application link or email and a description of at least 40 characters.'});
  if(!token)return res.status(503).json({error:'Submissions are temporarily unavailable. Please try again later.'});
  try{
   for(let attempt=0;attempt<3;attempt++){
    const result=await storage.get(PATH,{access:'private',token,useCache:false});
    const rows=result?await new Response(result.stream).json():[];
    const revision=result?.blob.etag||null;
    if(req.method==='GET'){
     res.setHeader('Cache-Control','public, s-maxage=60');
     return res.status(200).json({jobs:rows.filter(j=>j.status==='live').map(({id,company,role,type,work,location,comp,tags,description,apply_to,ts})=>({id,company,role,type,work,location,comp,tags,description,apply_to,ts}))});
    }
    if(b.action==='list_all')return res.status(200).json({jobs:rows,revision});
    if(b.action==='submit'){
     if(rows.some(j=>j.email.toLowerCase()===input.email.toLowerCase()&&j.company===input.company&&j.role===input.role&&Date.now()-Date.parse(j.ts)<86400000))return res.status(200).json({ok:true});
     if(rows.length>=1000)return res.status(503).json({error:'The review queue is full. Please contact happy@rwaf.xyz.'});
     rows.push({...input,id:'u-'+randomUUID(),status:'pending',src:'site',ts:new Date().toISOString()});
    }else if(b.action==='moderate'){
     if(b.revision!==revision)return res.status(409).json({error:'Listings changed. Refresh the review queue.'});
     const job=rows.find(j=>j.id===b.id);
     if(!job||!['live','closed','pending'].includes(b.status))return res.status(400).json({error:'Invalid listing or status.'});
     job.status=b.status;job.updated_at=new Date().toISOString();
    }else return res.status(400).json({error:'Unknown action'});
    try{
     const saved=await storage.put(PATH,JSON.stringify(rows),{access:'private',token,contentType:'application/json',addRandomSuffix:false,allowOverwrite:revision!==null,...(revision?{ifMatch:revision}:{})});
     return res.status(200).json({ok:true,revision:saved.etag});
    }catch(e){if(conflict(e)){if(b.action==='submit')continue;return res.status(409).json({error:'Listings changed. Refresh the review queue.'});}throw e;}
   }
   return res.status(409).json({error:'Another submission arrived at the same time. Please retry.'});
  }catch(e){console.error('Job storage request failed:',e.name);return res.status(502).json({error:'Could not save the listing. Keep this form open and retry.'});}
 };
}
export default createJobsHandler();
