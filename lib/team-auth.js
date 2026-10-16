import {createStore,defaultStorage,cookieToken,digest} from './fast-submit-store.js';
import {allowedEmail} from './fast-submit-access.js';

// Admin and Fast Submit use the same revocable, server-stored session.
export async function teamSession(req,{storage=defaultStorage,env=process.env,now=Date.now}={}) {
  const token=cookieToken(req);
  if(!token)return null;
  const state=await createStore(storage,env).state();
  return state.sessions.find(s=>s.id===digest(token)&&s.expires>now()&&allowedEmail(s.email))||null;
}
export async function requireTeamSession(req,res,options={}) {
  for(const name of ['Cache-Control','CDN-Cache-Control','Vercel-CDN-Cache-Control'])res.setHeader(name,'no-store');
  const env=options.env||process.env,host=req.headers?.host,origin=req.headers?.origin;
  if(!/^application\/json(?:;|$)/i.test(req.headers?.['content-type']||'')) {res.status(415).json({error:'JSON required.'});return false;}
  if(!host||(origin!==`https://${host}`&&!(env.NODE_ENV!=='production'&&origin===`http://${host}`))) {res.status(403).json({error:'Submit from this website.'});return false;}
  try {
    if(await teamSession(req,options))return true;
    res.status(401).json({error:'Session expired. Sign in with your team email again.'});
  }catch {res.status(503).json({error:'Team sign-in is temporarily unavailable. Please retry.'});}
  return false;
}
