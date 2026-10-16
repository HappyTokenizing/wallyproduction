import {createHash, randomBytes, timingSafeEqual} from 'node:crypto';
import {get, put, list, BlobError, BlobPreconditionFailedError} from '@vercel/blob';
export const defaultStorage = {get,put,list};
export const STATE_PATH='fast-submit/v1/access.json';
export const SESSION_COOKIE='__Host-rwaf-submit';
export const DAY=86400000;
export const digest=value=>createHash('sha256').update(value).digest('hex');
export const secret=()=>randomBytes(24).toString('base64url');
export const fail=(message,status=400)=>Object.assign(Error(message),{status});
export function adminPassword(value,env) {
  const hash=env.JOBS_ADMIN_PW?digest(env.JOBS_ADMIN_PW):env.JOBS_ADMIN_PW_SHA256;
  return typeof value==='string'&&value.length<=1000&&/^[a-f0-9]{64}$/i.test(hash||'')&&timingSafeEqual(Buffer.from(digest(value),'hex'),Buffer.from(hash,'hex'));
}
export function cookieToken(req) {
  const value=(req.headers?.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(SESSION_COOKIE+'='))?.slice(SESSION_COOKIE.length+1);
  return /^[\w-]{32}$/.test(value||'')?value:null;
}
export const sessionCookie=(token,days=30)=>`${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${days*86400}`;
export function createStore(storage,env) {
  const options={access:'private',token:env.BLOB_READ_WRITE_TOKEN};
  async function read(path,fallback) {
    if(!options.token)throw fail('Submission storage is not configured.',503);
    const result=await storage.get(path,{...options,useCache:false,headers:{'Accept-Encoding':'identity'}});
    if(!result)return {value:structuredClone(fallback),etag:null};
    if(!result.blob?.etag||/^W\//i.test(result.blob.etag))throw Error('Missing storage revision');
    return {value:await new Response(result.stream).json(),etag:result.blob.etag};
  }
  async function update(path,fallback,change) {
    for(let attempt=0;attempt<5;attempt++) {
      const {value,etag}=await read(path,fallback), result=await change(value);
      try {
        await storage.put(path,JSON.stringify(value),{...options,contentType:'application/json',addRandomSuffix:false,allowOverwrite:!!etag,...(etag?{ifMatch:etag}:{})});
        return result;
      }catch(error){if(!(error instanceof BlobPreconditionFailedError||(error instanceof BlobError&&/already exists/i.test(error.message))))throw error;}
    }
    throw fail('Another teammate is saving. Please retry.',409);
  }
  const empty={version:1,codes:[],sessions:[],lock:null};
  async function state() {const {value}=await read(STATE_PATH,empty);if(value.version!==1||!Array.isArray(value.codes)||!Array.isArray(value.sessions))throw Error('Invalid access storage');return value;}
  async function accessUpdate(change) {return update(STATE_PATH,empty,value=>{if(value.version!==1||!Array.isArray(value.codes)||!Array.isArray(value.sessions))throw Error('Invalid access storage');return change(value);});}
  return {read,update,state,accessUpdate};
}
