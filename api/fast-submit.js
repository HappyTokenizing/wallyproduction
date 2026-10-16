import {randomBytes,randomUUID} from 'node:crypto';
import {createStore,defaultStorage,digest,secret,fail,adminPassword,cookieToken,sessionCookie,DAY} from '../lib/fast-submit-store.js';
import {fetchSource,extractSource,sourceURL} from '../lib/fast-submit-source.js';
import {createPublisher,validateFields} from '../lib/fast-submit-publish.js';

export function createFastSubmitHandler({storage=defaultStorage,env=process.env,now=Date.now,source=fetchSource,fetchImpl=fetch,baseData}={}) {
  const store=createStore(storage,env),publisher=createPublisher({store,storage,env,now,fetchImpl,baseData});
  const draftPath=id=>{if(typeof id!=='string'||!/^[-\da-f]{36}$/.test(id))throw fail('Invalid submission reference.');return 'fast-submit/v1/drafts/'+id+'.json';};
  const publicDraft=d=>({id:d.id,kind:d.kind,url:d.url,fields:d.fields,warnings:d.warnings,matches:d.matches,status:d.status,receipt:d.receipt});
  return async function handler(req,res) {
    for(const name of ['Cache-Control','CDN-Cache-Control','Vercel-CDN-Cache-Control'])res.setHeader(name,'no-store');
    res.setHeader('X-Robots-Tag','noindex, nofollow');
    try {
      if(env.SITE_PUBLIC_API_ORIGIN)throw fail('Fast submit is available on the main RWAF website. This preview mirrors public data and cannot publish to it.',503);
      if(!['GET','POST'].includes(req.method))throw fail('GET or POST only.',405);
      const body=req.body||{};
      if(req.method==='POST') {
        if(!/^application\/json(?:;|$)/i.test(req.headers?.['content-type']||''))throw fail('JSON required.',415);
        const host=req.headers?.host,origin=req.headers?.origin;
        if(!host||origin!==`https://${host}`) {
          if(!(env.NODE_ENV!=='production'&&host&&origin===`http://${host}`))throw fail('Submit from this website.',403);
        }
        if(!body||typeof body!=='object'||Array.isArray(body)||Buffer.byteLength(JSON.stringify(body))>16000)throw fail('Submission too large or invalid.',413);
      }
      if(req.method==='POST'&&['create_code','revoke_sessions'].includes(body.action)) {
        if(!adminPassword(body.pw,env))throw fail('Open the admin console and sign in again.',401);
        if(body.action==='revoke_sessions') {await store.accessUpdate(s=>{s.codes=[];s.sessions=[];});return res.status(200).json({ok:true});}
        const code=randomBytes(10).toString('hex').toUpperCase(),expires=now()+DAY;
        await store.accessUpdate(s=>{s.codes=s.codes.filter(x=>x.expires>now());if(s.codes.length>=200)throw fail('Too many unused codes. Revoke existing access first.',429);s.codes.push({hash:digest(code),expires,label:typeof body.label==='string'?body.label.trim().slice(0,80):'Teammate'});});
        return res.status(200).json({code:code.match(/.{1,5}/g).join('-'),expires:new Date(expires).toISOString()});
      }
      if(req.method==='POST'&&body.action==='redeem') {
        const code=typeof body.code==='string'?body.code.replace(/[\s-]/g,'').toUpperCase():'';
        if(!/^[A-F\d]{20}$/.test(code))throw fail('Enter the one-time code from your admin.',401);
        const token=secret(),id=digest(token),expires=now()+30*DAY;
        await store.accessUpdate(s=>{
          const grant=s.codes.find(x=>x.hash===digest(code)&&x.expires>now());
          if(!grant)throw fail('This code has expired or was already used. Ask your admin for a new one.',401);
          s.codes=s.codes.filter(x=>x!==grant&&x.expires>now());s.sessions=s.sessions.filter(x=>x.expires>now());
          if(s.sessions.length>=1000)throw fail('Too many remembered browsers. Ask an admin to revoke old access.',429);
          s.sessions.push({id,expires,label:grant.label,requests:[]});
        });
        res.setHeader('Set-Cookie',sessionCookie(token));return res.status(200).json({authenticated:true,expires:new Date(expires).toISOString()});
      }
      const token=cookieToken(req),state=await store.state(),session=token&&state.sessions.find(x=>x.id===digest(token)&&x.expires>now());
      if(!session) {if(req.method==='GET')return res.status(200).json({authenticated:false});throw fail('Unlock this browser with a one-time code.',401);}
      if(req.method==='GET')return res.status(200).json({authenticated:true,expires:new Date(session.expires).toISOString(),categories:await publisher.categories()});
      if(body.action==='logout') {await store.accessUpdate(s=>{s.sessions=s.sessions.filter(x=>x.id!==session.id);});res.setHeader('Set-Cookie',sessionCookie('',0));return res.status(200).json({ok:true});}
      if(body.action==='inspect') {
        const url=sourceURL(body.url);
        if(!['auto','news','jobs','ecosystem'].includes(body.kind))throw fail('Choose a submission type.');
        await store.accessUpdate(s=>{const current=s.sessions.find(x=>x.id===session.id&&x.expires>now());if(!current)throw fail('Session expired.',401);current.requests=(current.requests||[]).filter(t=>now()-t<3600000);if(current.requests.length>=40)throw fail('You have submitted 40 links this hour. Please try again later.',429);current.requests.push(now());});
        let extracted,finalURL=url;
        try {const result=await source(url);finalURL=result.url;extracted=extractSource(result.html,finalURL,body.kind);}
        catch {extracted=extractSource('',url,body.kind==='auto'?'news':body.kind);extracted.warnings.unshift('We could not read this page automatically. Choose the right type and enter the details from the source.');}
        const matches=await publisher.matches(extracted.kind,extracted.fields);
        const draft={id:randomUUID(),owner:session.id,url:finalURL,...extracted,matches,status:'review',createdAt:now()};
        await store.update(draftPath(draft.id),{},value=>Object.assign(value,draft));
        return res.status(200).json({draft:publicDraft(draft),categories:await publisher.categories()});
      }
      if(!['status','publish','use_existing'].includes(body.action))throw fail('Unknown action.');
      const path=draftPath(body.id),{value:draft}=await store.read(path,null);
      if(!draft||draft.owner!==session.id)throw fail('Submission not found for this browser.',404);
      if(body.action==='status'||draft.receipt)return res.status(200).json({draft:publicDraft(draft),categories:await publisher.categories()});
      if(now()-draft.createdAt>DAY)throw fail('This review is more than a day old. Submit the URL again to recheck it.',409);
      if(body.action==='use_existing') {
        if(draft.kind!=='news')throw fail('Choose an existing news article.');
        const current=await publisher.matches('news',draft.fields),details=current.find(x=>x.id===body.existingId&&['possible','exact'].includes(x.match));
        if(!details)throw fail('That article is no longer a live match. Check the link again.',409);
        const receipt={status:'existing',message:'An article about this is already live.',details,verifiedAt:new Date(now()).toISOString()};
        await store.update(path,{},d=>{d.status='existing';d.receipt=receipt;});
        return res.status(200).json({receipt});
      }
      const fields=validateFields(draft.kind,body.fields,await publisher.base());
      if(draft.warnings.length&&body.reviewed!==true)throw fail('Review the flagged details before publishing.');
      const lock=secret();
      await store.accessUpdate(s=>{if(s.lock&&s.lock.expires>now())throw fail('Another submission is publishing. Retry in a few seconds.',409);if(!s.sessions.some(x=>x.id===session.id&&x.expires>now()))throw fail('Session expired.',401);s.lock={id:lock,expires:now()+90000};});
      try {
        const matches=await publisher.matches(draft.kind,fields),existing=matches.find(x=>x.match==='exact'),blocked=matches.find(x=>x.match==='hidden');
        let receipt;
        if(blocked)throw fail(blocked.reason,409);
        if(existing)receipt={status:'existing',message:draft.kind==='news'?'An article about this is already live.':'This listing is already live.',details:existing};
        else if(matches.some(x=>x.match==='possible')&&body.distinct!==true) {
          await store.update(path,{},d=>{d.fields=body.fields;d.matches=matches;});
          return res.status(409).json({error:'Review the related articles before publishing.',matches});
        } else {
          await store.update(path,{},d=>{d.fields=body.fields;d.status='publishing';});
          const details=await publisher.publish(draft,fields);
          receipt={status:'published',message:draft.kind==='news'?'Article added to the news feed.':'Published successfully.',details};
        }
        receipt.verifiedAt=new Date(now()).toISOString();
        await store.update(path,{},d=>{d.status=receipt.status;d.receipt=receipt;});
        return res.status(200).json({receipt});
      } finally {await store.accessUpdate(s=>{if(s.lock?.id===lock)s.lock=null;});}
    }catch(error) {
      if(!error.status)console.error('Fast submission failed:',error.name);
      return res.status(error.status||502).json({error:error.status?error.message:'Could not confirm this submission. Keep this page open and retry; existing submissions are checked before anything is added.'});
    }
  };
}
export default createFastSubmitHandler();
