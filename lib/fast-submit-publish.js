import {readFile} from 'node:fs/promises';
import {readArchive,archiveNews} from './news-archive.js';
import {validateJob} from '../api/jobs.js';
import {validateEcosystemReview} from '../api/ecosystem.js';
import {applyEcosystemUpdates,ecosystemTaxonomy} from '../assets/ecosystem-updates-model.js';
import {assignSubmissionReferences} from './submission-emails.js';
import {canonicalURL,newsMatches,sourceURL,plain} from './fast-submit-source.js';
import {fail} from './fast-submit-store.js';
let basePromise;
export const loadBase=()=>basePromise ||= readFile(new URL('../data/ecosystem-directory.json',import.meta.url),'utf8').then(JSON.parse);
const host=url=>{try{return new URL(url).hostname.replace(/^www\./,'');}catch{return '';}};
const nameKey=name=>plain(name).toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
const text=(value,max)=>typeof value==='string'?plain(value).slice(0,max):'';
export function validateFields(kind,raw,base) {
  if(!raw||typeof raw!=='object'||Array.isArray(raw))throw fail('Review the submission details.');
  if(kind==='jobs') {
    // Contact addresses are unnecessary for an authenticated internal submission.
    const input=validateJob({...raw,email:'internal@rwaf.xyz',member:0});
    if(!input)throw fail('Complete company, role, location, workplace, employment type, application URL and a description of at least 40 characters.');
    sourceURL(input.apply_to);delete input.email;return input;
  }
  if(kind==='ecosystem') {
    let category;try{category=JSON.parse(raw.category);}catch{}
    const result=validateEcosystemReview({profileId:null,name:raw.name,description:raw.description,website:raw.website,region:raw.region||'',directoryStatus:'current',categories:category?[category]:[],start:null},base,new Date().toISOString().slice(0,10));
    if(result.error)throw fail(result.error);
    sourceURL(result.review.website);return result.review;
  }
  if(kind!=='news')throw fail('Choose news, jobs or ecosystem.');
  const fields={headline:text(raw.headline,300),summary:text(raw.summary,1000),source:text(raw.source,120),url:sourceURL(raw.url),published_at:raw.published_at||''};
  if(fields.headline.length<8||fields.summary.length<20||!fields.source)throw fail('Add a headline, source name and a short factual summary (at least 20 characters).');
  if(fields.published_at&&(!/^\d{4}-\d{2}-\d{2}$/.test(fields.published_at)||!Number.isFinite(Date.parse(fields.published_at))||new Date(fields.published_at).toISOString().slice(0,10)!==fields.published_at||Date.parse(fields.published_at)>Date.now()+86400000))throw fail('Use a valid source publication date.');
  return fields;
}
export function createPublisher({store,storage,env,baseData,fetchImpl=fetch,now=Date.now}) {
  const base=async()=>baseData||await loadBase();
  async function hiddenIds() {
    if(!env.SUPABASE_JOBS_SECRET)return [];
    const key=env.SUPABASE_JOBS_SECRET;
    const response=await fetchImpl('https://qrmbiestcjbedavsorrj.supabase.co/rest/v1/wally_site?k=eq.news_hidden&select=v',{headers:{apikey:key,Authorization:'Bearer '+key},signal:AbortSignal.timeout(8000)});
    if(!response.ok)throw Error('Could not check news moderation');
    return (await response.json())[0]?.v?.ids||[];
  }
  async function news() {const [{items},hidden]=await Promise.all([readArchive({env,storage}),hiddenIds()]);return {items,hidden:new Set(hidden)};}
  async function directory() {
    const {value}=await store.read('ecosystem-submissions.json',{version:1,submissions:[],rateLimits:{}});
    if(value.version!==1||!Array.isArray(value.submissions))throw Error('Invalid directory storage');
    return applyEcosystemUpdates(await base(),{records:value.submissions.filter(x=>x.status==='approved')}).profiles;
  }
  const newsResult=item=>({id:item.id,kind:'news',title:item.headline,description:item.summary,source:item.source?.name,date:item.published_at,dateUnconfirmed:item.flags?.date_unconfirmed===true,sourceUrl:item.url,liveUrl:'/news/?story='+encodeURIComponent(item.id)});
  const jobResult=item=>({id:item.id,kind:'jobs',title:item.role,company:item.company,description:item.description,type:item.type,work:item.work,location:item.location,comp:item.comp,sourceUrl:item.apply_to,liveUrl:'/jobs/?listing='+encodeURIComponent(item.id)});
  const ecoResult=item=>({id:item.id,kind:'ecosystem',title:item.name,description:item.description,region:item.region,categories:item.categories.map(x=>x.name),sourceUrl:item.website,liveUrl:'/ecosystem/?profile='+encodeURIComponent(item.id)});
  async function matches(kind,fields) {
    if(kind==='news') {
      const {items,hidden}=await news();
      const matches=newsMatches(fields,items);
      return matches.map(x=>({...newsResult(x.item),match:hidden.has(x.item.id)?'hidden':x.match,reason:hidden.has(x.item.id)?'This story was removed by an editor. Ask an admin to review it.':x.reason}));
    }
    if(kind==='ecosystem') {
      return (await directory()).filter(x=>(host(fields.website)&&host(x.website)===host(fields.website))||(fields.name&&nameKey(x.name)===nameKey(fields.name))).slice(0,5).map(x=>({...ecoResult(x),match:'exact',reason:'This company is already in the directory.'}));
    }
    const {value:rows}=await store.read('job-submissions.json',[]);
    if(!Array.isArray(rows))throw Error('Invalid job storage');
    // Include the public ATS feeds as well as direct submissions.
    const result=await fetchImpl(`https://${env.FAST_SUBMIT_PUBLIC_HOST||'www.rwaf.xyz'}/api/job-feed`,{signal:AbortSignal.timeout(10000)});
    if(!result.ok)throw Error('Could not check the live job board');
    const feed=await result.json();if(!Array.isArray(feed.jobs))throw Error('Invalid live job feed');
    const all=[...rows,...feed.jobs.filter(x=>now()-Date.parse(x.checkedAt)<7*86400000).map(x=>({...x,apply_to:x.apply,description:x.desc}))];
    return all.filter(x=>canonicalURL(x.apply_to||x.url)===canonicalURL(fields.apply_to)||(fields.role&&fields.company&&nameKey(x.role)===nameKey(fields.role)&&nameKey(x.company)===nameKey(fields.company))).slice(0,5).map(x=>({...jobResult({...x,apply_to:x.apply_to||x.url}),match:rows.includes(x)&&x.status!=='live'?'hidden':'exact',reason:rows.includes(x)&&x.status!=='live'?'This role is pending or closed. Ask an admin to review it.':'This role is already on the job board.'}));
  }
  async function publish(draft,fields) {
    const timestamp=new Date(now()).toISOString(),id='fast-'+draft.id;
    if(draft.kind==='news') {
      const item={id,headline:fields.headline,summary:fields.summary,url:fields.url,source:{name:fields.source,domain:host(fields.url)},published_at:fields.published_at?new Date(fields.published_at).toISOString():timestamp,ingested_at:timestamp,flags:{date_unconfirmed:!fields.published_at},tags:[],universe_tags:[],members:[]};
      await archiveNews([item],{env,storage,now,updateStatus:false});
      const live=await news(),saved=live.items.find(x=>x.id===id&&!live.hidden.has(id));
      if(!saved)throw Error('News publication is not confirmed');return newsResult(saved);
    }
    if(draft.kind==='jobs') {
      await store.update('job-submissions.json',[],rows=>{
        if(!Array.isArray(rows))throw Error('Invalid job storage');
        if(rows.some(x=>x.id===id))return;
        if(rows.some(x=>canonicalURL(x.apply_to)===canonicalURL(fields.apply_to)||(nameKey(x.company)===nameKey(fields.company)&&nameKey(x.role)===nameKey(fields.role))))throw fail('This role was just submitted. Retry to load the existing listing.',409);
        if(rows.length>=1000)throw fail('Job storage is full. Ask an admin to archive old submissions.',503);
        rows.push({...fields,email:'',id,status:'live',src:'fast-submit',ts:timestamp,submittedBy:draft.owner});assignSubmissionReferences(rows,'jobs');
      });
      const {value:rows}=await store.read('job-submissions.json',[]),saved=rows.find(x=>x.id===id&&x.status==='live');
      if(!saved)throw Error('Job publication is not confirmed');return jobResult(saved);
    }
    await store.update('ecosystem-submissions.json',{version:1,submissions:[],rateLimits:{}},value=>{
      if(value.version!==1||!Array.isArray(value.submissions))throw Error('Invalid directory storage');
      if(value.submissions.some(x=>x.id===id))return;
      if(value.submissions.some(x=>x.status==='approved'&&x.review&&(host(x.review.website)===host(fields.website)||nameKey(x.review.name)===nameKey(fields.name))))throw fail('This company was just published. Retry to load its existing profile.',409);
      if(value.submissions.length>=5000)throw fail('Directory storage is full.',503);
      value.submissions.push({id,status:'approved',submission:null,review:fields,submittedAt:timestamp,updatedAt:timestamp,submittedBy:draft.owner});assignSubmissionReferences(value.submissions,'ecosystem');
    });
    const saved=(await directory()).find(x=>x.id==='submitted-'+id);
    if(!saved)throw Error('Directory publication is not confirmed');return ecoResult(saved);
  }
  return {matches,publish,base,categories:async()=>ecosystemTaxonomy(await base())};
}
