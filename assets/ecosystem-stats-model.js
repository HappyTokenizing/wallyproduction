import {memberFor,exitsFor,safeURL} from './ecosystem-model.js';

// Date precision is explicit. Year-only records never become invented Q1 events.
export function dateBounds(value) {
  const m=/^(\d{4})(?:-(\d{2})(?:-(\d{2}))?|-Q([1-4]))?$/.exec(String(value||''));
  if(!m)return null;
  const year=Number(m[1]);if(year<1000||year>9999)return null;
  const month=m[2]?Number(m[2]):m[4]?(Number(m[4])-1)*3+1:1;
  if(month<1||month>12)return null;
  const day=m[3]?Number(m[3]):1,last=new Date(Date.UTC(year,month,0)).getUTCDate();
  if(day<1||day>last)return null;
  const precision=m[3]?'day':m[2]?'month':m[4]?'quarter':'year';
  return {precision,start:`${m[1]}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`,quarter:precision==='year'?null:year*4+Math.floor((month-1)/3)};
}
export const quarterLabel = q => `Q${q%4+1} ${Math.floor(q/4)}`;
export const quarterKey = q => `${Math.floor(q/4)}-Q${q%4+1}`;
export const quarterFromKey = value => dateBounds(value)?.quarter??null;
// Periods are quarters (index year*4+q) or calendar years. The year view lets year-only sources chart honestly:
// a founding known only to the year lands in that year, never in an invented quarter.
export const periodLabel = (unit,q) => unit==='year'?String(q):quarterLabel(q);
export const periodKey = (unit,q) => unit==='year'?String(q):quarterKey(q);
export const periodFromKey = (unit,value) => unit==='year'?(/^\d{4}$/.test(String(value??''))?Number(value):null):quarterFromKey(value);
export function quarterRange(from,to) {
  if(!Number.isInteger(from)||!Number.isInteger(to)||to<from||to-from>800)return [];
  return Array.from({length:to-from+1},(_,i)=>from+i);
}
const sourced=(e,p)=>e.sources?.some(s=>safeURL(s.url,p));
const profileMatch=(p,criteria,members)=>(criteria.scope!=='members'||memberFor(p,members))&&(criteria.section==='all'||!criteria.section||p.categories.some(c=>c.section===criteria.section));
export function statsSeries(data,criteria={},members=[]) {
  const metric=['new','exits','growth','failures'].includes(criteria.metric)?criteria.metric:'new';
  const basis=['founding','launch'].includes(criteria.basis)?criteria.basis:'all';
  const unit=criteria.unit==='year'?'year':'quarter';
  const asOf=data.snapshotDate,current=unit==='year'?(dateBounds(asOf)?Number(asOf.slice(0,4)):null):dateBounds(asOf)?.quarter;
  if(current==null)throw Error('A dated snapshot is required');
  const profiles=data.profiles.filter(p=>profileMatch(p,criteria,members));
  const byId=new Map(profiles.map(p=>[p.id,p]));let candidates=[];
  const records=(data.statsEvents||[]).filter(e=>byId.has(e.profileId)&&sourced(e,byId.get(e.profileId)));
  if(metric==='exits'){
    const seen=new Set();
    for(const p of profiles)for(const e of exitsFor(p))if(!seen.has(e.id)){
      seen.add(e.id);candidates.push({...e,profileId:p.id,name:e.target,date:e.completedDate||'',note:`${e.target} → ${e.counterparty} · ${e.type}`});
    }
  }else if(metric==='failures'){
    candidates=profiles.filter(p=>p.failedInitiative===true).map(p=>({...records.find(e=>e.profileId===p.id&&e.type==='failure'),profileId:p.id,name:p.name}));
  }else{
    candidates=profiles.map(p=>{
      const possible=records.filter(e=>e.profileId===p.id&&(basis==='all'?['founding','launch'].includes(e.type):e.type===basis));
      // Prefer founding when both exist; don't substitute a later launch to hide imprecise founding data.
      const e=possible.find(e=>e.type==='founding')||possible.find(e=>e.type==='launch');
      return {...e,profileId:p.id,name:p.name};
    });
  }
  const seen=new Set();candidates=candidates.filter(e=>{const key=metric==='exits'?e.id:e.profileId;if(seen.has(key))return false;seen.add(key);return true;});
  const coverage={eligible:candidates.length,dated:0,yearOnly:0,unknown:0,future:0};
  const dated=[];
  for(const e of candidates){
    const date=dateBounds(e.date);
    if(!date){coverage.unknown++;continue;}
    if(date.start>asOf){coverage.future++;continue;}
    const period=unit==='year'?Number(date.start.slice(0,4)):date.quarter;
    if(period==null){coverage.yearOnly++;continue;}
    coverage.dated++;dated.push({...e,quarter:period,precision:date.precision});
  }
  dated.sort((a,b)=>a.quarter-b.quarter||a.name.localeCompare(b.name));
  const requestedFrom=periodFromKey(unit,criteria.from),requestedTo=periodFromKey(unit,criteria.to);
  const to=Math.min(requestedTo??current,current);
  const span=unit==='year'?[24,9]:[19,7];
  const from=Math.min(requestedFrom??Math.max(current-span[0],Math.min(...dated.map(e=>e.quarter),current-span[1])),to);
  const quarters=quarterRange(from,to),buckets=new Map(quarters.map(q=>[q,[]]));
  for(const e of dated)if(buckets.has(e.quarter))buckets.get(e.quarter).push(e);
  const baseline=dated.filter(e=>e.quarter<from).length;let total=baseline;
  const points=quarters.map(q=>{const events=buckets.get(q),previous=total;total+=events.length;return {quarter:q,label:periodLabel(unit,q),events,value:metric==='growth'?total:events.length,change:events.length,growthPercent:previous?events.length/previous*100:null,partial:q===current};});
  const shownEvents=dated.filter(e=>e.quarter>=from&&e.quarter<=to);
  const unknown=candidates.filter(e=>{const date=dateBounds(e.date);return !date||(unit==='quarter'&&date.quarter==null)||date.start>asOf;});
  return {metric,basis,unit,asOf,coverage,points,baseline,shownEvents,unknown,profiles,from,to,total:metric==='growth'?(points.at(-1)?.value||baseline):shownEvents.length};
}
export function statsTSV(series,filterLabel) {
  const clean=v=>{const s=String(v??'').replace(/[\t\r\n]+/g,' ');return /^[=+\-@]/.test(s)?"'"+s:s;};
  return [
    ['RWA Foundation',series.metric,filterLabel],['As of',series.asOf],
    ['Date coverage',`${series.coverage.dated}/${series.coverage.eligible} ${series.unit==='year'?'dated':'quarter-dated'}`,`${series.coverage.yearOnly} year-only`,`${series.coverage.unknown} unknown`,`${series.coverage.future} future excluded`],
    ['Definition',series.metric==='growth'?'Cumulative verified starts, not a complete industry census or active-company count':'Verified dated events only; a zero is not proof of no industry activity'],
    [series.unit==='year'?'Year':'Quarter',series.metric==='growth'?'Cumulative starts':'Events',series.unit==='year'?'New this year':'New this quarter',series.unit==='year'?'Partial year':'Partial quarter','Companies / events'],
    ...series.points.map(p=>[p.label,p.value,p.change,p.partial?'Yes':'No',p.events.map(e=>e.name+(e.counterparty?' → '+e.counterparty:'')).join('; ')]),
    [],['Event','Date','Type','Company','Evidence'],...series.shownEvents.map(e=>[e.id,e.date,e.type,e.name,(e.sources||[]).map(s=>s.url).join(' | ')])
  ].map(row=>row.map(clean).join('\t')).join('\n');
}
