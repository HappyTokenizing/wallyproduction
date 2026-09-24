import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
export const sources = JSON.parse(readFileSync(new URL('../data/job-sources.json', import.meta.url)));
const manual = JSON.parse(readFileSync(new URL('../data/jobs-manual.json', import.meta.url)));
export const MAX_AGE = 7 * 24 * 60 * 60 * 1000;
const general = /open application|general application|talent (?:pool|community|network)|don't see your role|opportunistic/i;
const typeName = value => ({fulltime:'Full time',parttime:'Part time',contract:'Contract',contractor:'Contract',intern:'Internship',internship:'Internship'}[String(value || '').toLowerCase().replace(/[\s_-]/g,'')] || 'Not specified');
const text = value => String(value || '').replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim().replace(/on-chain/gi,'onchain');
export function safeURL(value) {
  try { const u = new URL(value); return u.protocol === 'https:' && !u.username && !u.password ? u.href : ''; } catch { return ''; }
}
export function publicationDate(value, now=Date.now()) {
  // Only explicit dates are accepted; null, relative text and refresh timestamps are not dates.
  if(typeof value!=='string' || !/^\d{4}-\d{2}-\d{2}(?:T|$)/.test(value)) return null;
  const time=Date.parse(value);
  return Number.isFinite(time) && time>0 && time<=now ? new Date(time).toISOString() : null;
}
export function jobPageDate(html, now=Date.now()) {
  for(const match of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const scan=value=>{
        if(Array.isArray(value)) {for(const item of value){const date=scan(item);if(date)return date;}}
        else if(value && typeof value==='object') {
          if([value['@type']].flat().includes('JobPosting'))return publicationDate(value.datePosted,now);
          if(value['@graph'])return scan(value['@graph']);
        }
        return null;
      };
      const date=scan(JSON.parse(match[1]));if(date)return date;
    } catch {}
  }
  return null;
}
export function normalize(source, raw, checkedAt) {
  const role=text(raw.role); const apply=safeURL(raw.apply);
  if (!role || !apply || general.test(role) || raw.isListed === false || (raw.deadline && Date.parse(raw.deadline)<Date.parse(checkedAt))) return null;
  const host=new URL(apply).hostname;
  if(host!==new URL(source.url).hostname) return null;
  const tags=[...new Set((raw.tags || []).map(text).filter(Boolean))].slice(0,4);
  return {id:raw.id?.startsWith('import-') ? raw.id : 'import-'+source.id+'-'+createHash('sha256').update(apply).digest('hex').slice(0,16),
    sourceId:source.id, company:source.company, memberName:source.memberName, role, apply, sourceUrl:source.url,
    type:raw.type || 'Not specified', work:raw.work && raw.work!=='Not specified' ? raw.work : /remote/i.test(raw.location || '') ? 'Remote' : 'Not specified', location:text(raw.location) || 'Location not specified',
    comp:text(raw.comp), tags, desc:text(raw.desc) || `${role} at ${source.company}${tags.length ? ' · '+tags.join(' / ') : ''}. Visit the employer’s listing for responsibilities, requirements and application details.`,
    checkedAt, postedAt:publicationDate(raw.postedAt,Date.parse(checkedAt)), dateSource:raw.dateSource||null, ts:0, status:'live', imported:true};
}
export function parseFeed(source, data, checkedAt) {
  let rows;
  if(source.kind==='ashby') {
    if(!Array.isArray(data.jobs)) throw new Error('Invalid Ashby response');
    rows=data.jobs.map(j=>({role:j.title,apply:j.jobUrl,postedAt:j.publishedAt,dateSource:'Ashby · publishedAt',isListed:j.isListed,type:typeName(j.employmentType),
      work:({Remote:'Remote',Hybrid:'Hybrid',OnSite:'On-site'})[j.workplaceType] || (j.isRemote?'Remote':'Not specified'),
      location:[...new Set([j.location,...(j.secondaryLocations || []).map(l=>l.location)].filter(Boolean))].join(' / '),tags:[j.department,j.team]}));
  } else if(source.kind==='greenhouse') {
    if(!Array.isArray(data.jobs)) throw new Error('Invalid Greenhouse response');
    rows=data.jobs.map(j=>({role:j.title,apply:j.absolute_url,postedAt:j.first_published,dateSource:'Greenhouse · first_published',deadline:j.application_deadline,location:j.location?.name,
      work:/remote/i.test(j.location?.name || '')?'Remote':/hybrid/i.test(j.location?.name || '')?'Hybrid':'Not specified',
      tags:(j.departments || []).map(d=>d.name)}));
  } else if(source.kind==='lever') {
    if(!Array.isArray(data)) throw new Error('Invalid Lever response');
    rows=data.map(j=>({role:j.text,apply:j.hostedUrl,type:typeName(j.categories?.commitment),
      location:j.categories?.location,work:({remote:'Remote',hybrid:'Hybrid',onsite:'On-site'})[j.workplaceType] || 'Not specified',tags:[j.categories?.team]}));
  } else if(source.kind==='rippling') {
    const match=data.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
    if(!match) throw new Error('Missing Rippling data');
    const queries=JSON.parse(match[1]).props.pageProps.dehydratedState.queries;
    const page=queries.map(q=>q.state.data).find(d=>Array.isArray(d?.items));
    if(!page || page.totalPages>1) throw new Error('Incomplete Rippling board');
    rows=page.items.map(j=>({role:j.name,apply:j.url,location:j.locations.map(l=>l.name).join(' / '),
      work:j.locations.every(l=>l.workplaceType==='REMOTE')?'Remote':'Not specified',tags:[j.department?.name]}));
  } else throw new Error('Unsupported source');
  return rows.map(r=>normalize(source,r,checkedAt)).filter(Boolean);
}
export function sourceEndpoint(source) {
  if(source.kind==='ashby') return 'https://api.ashbyhq.com/posting-api/job-board/'+encodeURIComponent(source.slug);
  if(source.kind==='greenhouse') return 'https://boards-api.greenhouse.io/v1/boards/'+source.slug+'/jobs';
  if(source.kind==='lever') return 'https://api.lever.co/v0/postings/'+source.slug+'?mode=json';
  return source.url;
}
export function fallbackJobs(source, snapshot, now) {
  return (snapshot.jobs || []).filter(j=>j.sourceId===source.id && now-Date.parse(j.checkedAt)<MAX_AGE && now>=Date.parse(j.checkedAt));
}
export async function collectJobs({fetcher=fetch,snapshot={jobs:[]},now=Date.now()}={}) {
  const checkedAt=new Date(now).toISOString();
  const results=await Promise.all(sources.map(async source=>{
    const base={id:source.id,company:source.company,memberName:source.memberName,url:source.url,reviewedAt:source.reviewedAt};
    if(source.kind==='review') return {coverage:{...base,status:'reviewed',checkedAt:source.reviewedAt,count:0},jobs:[]};
    if(source.kind==='manual') {
      const jobs=manual.filter(j=>j.sourceId===source.id && now-Date.parse(j.checkedAt)<MAX_AGE).map(j=>normalize(source,j,j.checkedAt)).filter(Boolean);
      return {coverage:{...base,status:jobs.length?'manual':'needs-review',checkedAt:source.reviewedAt,count:jobs.length},jobs};
    }
    try {
      const response=await fetcher(sourceEndpoint(source),{signal:AbortSignal.timeout(6500),headers:{Accept:source.kind==='rippling'?'text/html':'application/json'}});
      if(!response.ok) throw new Error('Upstream unavailable');
      const data=source.kind==='rippling'?await response.text():await response.json();
      const jobs=parseFeed(source,data,checkedAt);
      if(source.kind==='lever') {
        await Promise.all(jobs.map(async job=>{
          try {
            const response=await fetcher(job.apply,{signal:AbortSignal.timeout(5000)});
            if(!response.ok) return;
            job.postedAt=jobPageDate(await response.text(),now);
            if(job.postedAt)job.dateSource='Employer listing · datePosted';
          } catch {
            const previous=(snapshot.jobs||[]).find(old=>old.id===job.id);
            job.postedAt=publicationDate(previous?.postedAt,now);
            if(job.postedAt)job.dateSource=previous.dateSource;
          }
        }));
      }
      return {coverage:{...base,status:'live',checkedAt,count:jobs.length},jobs};
    } catch {
      const jobs=fallbackJobs(source,snapshot,now);
      return {coverage:{...base,status:jobs.length?'cached':'unavailable',checkedAt:jobs[0]?.checkedAt || null,count:jobs.length},jobs};
    }
  }));
  return {generatedAt:checkedAt,jobs:results.flatMap(r=>r.jobs),coverage:results.map(r=>r.coverage)};
}
