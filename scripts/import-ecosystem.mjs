import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {dateBounds} from '../assets/ecosystem-stats-model.js';
import { MARKET_MAP } from '../vendor/rwa-ecosystem-map/marketMap.ts';
const read = name => JSON.parse(fs.readFileSync(new URL('../vendor/rwa-ecosystem-map/'+name, import.meta.url)));
const source = read('profiles.json'), legacy = read('legacy.json');
const norm = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
// Reviewed identity crosswalk. Do not fuzzy-match short IDs (real != Re.al).
const aliases = {ondo:'ondo-finance',franklin:'franklin-templeton',franklintf:'franklin-templeton',galaxytok:'galaxy-digital',hashnote:'hashnote-usyc',land:'land-invest-corp',maple:'maple-finance',canton:'canton-network',redbelly:'redbelly-network',wellington:'wellingtonmanagement',ixswap:'ixs'};
const profiles = source.profiles.map(p => ({...p, directoryStatus:p.directoryStatus||'current', categories:[], aliases:[p.name], legacyIds:[], provenance:'Bucktony / RWA News Today'}));
const byId = new Map(profiles.map(p => [p.id,p]));
const sections = MARKET_MAP.map(s => ({name:s.section, categories:s.categories.map(c => ({name:c.category, ids:[...new Set(c.entities.map(e=>{
 const id=source.bindings[JSON.stringify([s.section,c.category,e.name])];
 if(!byId.has(id)) throw Error('Unresolved placement: '+e.name);
 const p=byId.get(id);if(!p.categories.some(x=>x.section===s.section&&x.name===c.category)) p.categories.push({section:s.section,name:c.category});
 return id;
}))]}))}));
const crosswalk={}, added=[], merged=[];
for(const l of legacy){
 let p=byId.get(aliases[l.id]||l.id)||profiles.find(p=>norm(p.name)===norm(l.name));
 if(!p){
  const id='rwaf-'+l.id;
  p={id,name:l.name,kind:'Directory entry',description:l.blurb.replace(/\s*RWA Foundation member\.?/gi,''),website:'',domain:'',newsRules:[],newsTags:[],relatedEntities:[],logo:null,officialUpdates:[],checkedOn:'',directoryStatus:'review',statusNote:'Retained from the existing RWAF directory; current activity has not been reverified.',categories:[{section:'RWAF directory',name:({issuer:'Issuers',market:'Marketplaces',defi:'DeFi',protocol:'Protocols',service:'Service providers',tradfi:'TradFi',hub:'Community'})[l.type]}],aliases:[l.name],legacyIds:[],provenance:'Existing RWAF directory'};
  profiles.push(p);byId.set(id,p);added.push(id);
 }else merged.push({legacyId:l.id,profileId:p.id});
 crosswalk[l.id]=p.id;p.legacyIds.push(l.id);p.aliases=[...new Set([...p.aliases,l.name])];p.region=l.region;p.assets=l.assets||[];
}
// Add only previously absent profiles to a separate map section; don't duplicate companies already placed.
const extra={name:'RWAF directory',categories:[]};
for(const id of added){const p=byId.get(id),name=p.categories[0].name;let cat=extra.categories.find(c=>c.name===name);if(!cat)extra.categories.push(cat={name,ids:[]});cat.ids.push(id);}
sections.splice(sections.findIndex(s=>s.name==='Historical'),0,extra);
// Dated, primary-source research is kept separate from the immutable upstream snapshot.
const researchRead = name => JSON.parse(fs.readFileSync(new URL('../data/research/'+name, import.meta.url)));
// Reuse canonical identities when adding placements or reviewing an upstream profile.
function place(p,categories){
 for(const category of categories){
  let section=sections.find(s=>s.name===category.section);
  if(!section){section={name:category.section,categories:[]};sections.splice(sections.findIndex(s=>s.name==='Historical'),0,section);}
  let cat=section.categories.find(c=>c.name===category.name);
  if(!cat)section.categories.push(cat={name:category.name,ids:[]});
  if(!cat.ids.includes(p.id))cat.ids.push(p.id);
 }
}
const researched=[];
for(const name of ['institutions.json','services.json','networks.json','requested-additions.json','community-additions-20261007.json','lifecycle-additions-20261007.json','community-submissions-20261008.json','directory-additions-20261009.json']){
 for(const entry of researchRead(name)){
  if(byId.has(entry.id)||profiles.some(p=>norm(p.name)===norm(entry.name)))throw Error('Duplicate research identity: '+entry.name);
  if(!entry.sources?.length||!entry.checkedOn||!entry.categories?.length)throw Error('Incomplete research: '+entry.name);
  const p={newsRules:[],newsTags:[],relatedEntities:[],logo:null,officialUpdates:[],legacyIds:[],...entry,aliases:[...new Set([entry.name,...(entry.aliases||[])])],provenance:entry.directorySubmission?'RWA Foundation / project submission and public-source review':'RWA Foundation / official-source research'};
  profiles.push(p);byId.set(p.id,p);researched.push(p.id);
  place(p,p.categories);
 }
}
// Explicit, dated corrections preserve upstream IDs, placements and favorites.
const profileUpdates={...researchRead('profile-updates.json'),...researchRead('profile-updates-20261008.json')};
// Submission metadata augments prior corrections instead of dropping earlier fields.
for(const file of ['profile-submissions-20261008.json','profile-updates-20261009.json'])for(const [id,update] of Object.entries(researchRead(file))){
 const prior=profileUpdates[id]||{};
 profileUpdates[id]={...prior,...update,aliases:[...new Set([...(prior.aliases||[]),...(update.aliases||[])])]};
}
for(const [id,update] of Object.entries(profileUpdates)){
 const p=byId.get(id);
 if(!p||!update.sources?.length||!update.checkedOn)throw Error('Incomplete profile update: '+id);
 const {aliases=[],addCategories=[],...fields}=update;
 if(['id','categories','legacyIds','relatedEntities','logo'].some(k=>k in fields))throw Error('Identity-changing profile update: '+id);
 Object.assign(p,fields);
 p.aliases=[...new Set([...p.aliases,p.name,...aliases])];
 for(const c of addCategories)if(!p.categories.some(x=>x.section===c.section&&x.name===c.name))p.categories.push(c);
 place(p,addCategories);
}
// Explicit relationships connect distinct initiatives without merging their identities.
for(const [id,relations] of Object.entries(researchRead('profile-relations-20261009.json'))){
 const p=byId.get(id);if(!p)throw Error('Unknown related profile: '+id);
 for(const relation of relations){
  if(!byId.has(relation.id)||relation.id===id)throw Error('Invalid profile relation: '+id);
  p.relatedEntities=p.relatedEntities.filter(r=>r.id!==relation.id);p.relatedEntities.push(relation);
 }
}
// Exits are completed M&A events, independently of whether a product is still active.
const exitEvents=[...researchRead('exits.json'),...researchRead('exits-20261008.json'),...researchRead('exits-20261009.json')], exitIds=new Set();
for(const event of exitEvents){
 const p=byId.get(event.profileId);
 if(!p||!event.id||exitIds.has(event.id)||!['acquisition','merger'].includes(event.type)||event.status!=='completed'||!event.target||!event.counterparty||!event.summary||!event.checkedOn||!event.sources?.length)throw Error('Invalid M&A exit: '+event.id);
 for(const source of event.sources){const url=new URL(source.url);if(!source.title||url.protocol!=='https:'||url.username||url.password)throw Error('Invalid M&A source: '+event.id);}
 exitIds.add(event.id);
 for(const id of new Set([event.profileId,...(event.relatedProfileIds||[])])){
  const target=byId.get(id);if(!target)throw Error('Unknown shared exit profile: '+id);
  (target.exitEvents||=[]).push(event);
 }
}
const logoFiles=['logos-core.json','logos-special.json','logos-refinements.json','logos-followup.json','logos-missing.json','logos-community-20261007.json','logos-community-fixes-20261007.json','logos-submissions-20261008.json'];
const logoOverrides={};
const logoDigest=logo=>{
 if(!logo?.src?.startsWith('/ecosystem/')||logo.src.includes('..'))throw Error('Invalid logo asset path: '+logo?.src);
 return createHash('sha256').update(fs.readFileSync(new URL('..'+logo.src,import.meta.url))).digest('hex');
};
function replaceLogo(id,logo){
 const p=byId.get(id);
 if(!p||!logo.src)throw Error('Incomplete logo override: '+id);
 if(logo.changeKind==='display-correction'){
  if(logo.src!==p.logo?.src)throw Error('Display correction changes artwork: '+id);
  logo={...p.logo,...logo};
 }else if(!logo.sourceUrl||!logo.sourcePage)throw Error('Unsourced logo replacement: '+id);
 const digest=logoDigest(logo);
 if(p.logo&&logoDigest(p.logo)!==digest){
  const prior={...p.logo,archivedOn:'2026-10-09',versionLabel:'Earlier directory artwork'};
  if(!prior.checkedOn&&!prior.recordedOn)prior.recordedOn='2026-10-04';
  (p.logoHistory||=[]).unshift(prior);
 }
 p.logo={...logo};
 const seen=new Set([digest]);
 p.logoHistory=(p.logoHistory||[]).filter(old=>{const hash=logoDigest(old);if(seen.has(hash))return false;seen.add(hash);return true;});
 if(!p.logoHistory.length)delete p.logoHistory;
 logoOverrides[id]=logo;
}
// Phantom already has a Stablecoin Builders placement; expose the same identity under Wallets.
const phantom=byId.get('phantom');
if(!phantom.categories.some(c=>c.section==='Wallets'&&c.name==='Wallets'))phantom.categories.push({section:'Wallets',name:'Wallets'});
const wallets=sections.find(s=>s.name==='Wallets').categories.find(c=>c.name==='Wallets');
if(!wallets.ids.includes(phantom.id))wallets.ids.push(phantom.id);
for(const file of logoFiles)for(const [id,logo] of Object.entries(researchRead(file)))replaceLogo(id,logo);
// Contrast-only corrections retain the original source artwork and provenance.
for(const [id,display] of Object.entries(researchRead('logo-display.json'))){
 const p=byId.get(id);
 if(!p?.logo||Object.keys(display).some(k=>k!=='background')||!['light','dark'].includes(display.background))throw Error('Invalid logo display correction: '+id);
 Object.assign(p.logo,display);
}
// Freshly reviewed artwork takes precedence; same-file contrast fixes are not new versions.
const refreshedLogos=researchRead('logos-refresh-20261009.json');
for(const [id,logo] of Object.entries(refreshedLogos))replaceLogo(id,logo);
const displayBySource=new Map(Object.values(refreshedLogos).map(logo=>[logo.src,logo.background]));
const historyReview=researchRead('logo-history-review-20261009.json');
for(const p of profiles)for(const logo of p.logoHistory||[]){
 if(displayBySource.has(logo.src))logo.background=displayBySource.get(logo.src);
 const review=historyReview[logo.src];
 if(review){
  if(review.displayInHistory===false&&!review.reviewNote)throw Error('Unexplained hidden logo history: '+logo.src);
  Object.assign(logo,review);
 }
}
// Owner-requested removals are explicit and reproducible without altering the vendor snapshot.
const excludedProfiles=researchRead('excluded-profiles.json');
for(const [id,removal] of Object.entries(excludedProfiles)){
 if(!byId.has(id)||!removal.reason||!removal.requestedOn)throw Error('Invalid exclusion: '+id);
 if(removal.mergedInto){
  const target=byId.get(removal.mergedInto),old=byId.get(id);
  if(!target||target.id===id||excludedProfiles[target.id])throw Error('Invalid merge target: '+id);
  target.aliases=[...new Set([...target.aliases,...old.aliases])];
  target.legacyIds=[...new Set([...target.legacyIds,...old.legacyIds,id])];
  crosswalk[id]=target.id;
  for(const [legacyId,profileId] of Object.entries(crosswalk))if(profileId===id)crosswalk[legacyId]=target.id;
 }
 byId.delete(id);profiles.splice(profiles.findIndex(p=>p.id===id),1);
 for(const section of sections)for(const category of section.categories)category.ids=category.ids.filter(x=>x!==id);
 for(const p of profiles)p.relatedEntities=p.relatedEntities.flatMap(x=>x.id!==id?[x]:removal.mergedInto&&p.id!==removal.mergedInto?[{...x,id:removal.mergedInto}]:[]).filter((x,i,a)=>a.findIndex(y=>y.id===x.id)===i);
 for(const [legacyId,profileId] of Object.entries(crosswalk))if(profileId===id)delete crosswalk[legacyId];
}
// Lifecycle statistics never infer event dates from review or import timestamps.
const statsEvents=[...researchRead('statistics-events.json'),...researchRead('statistics-events-starts-20261008.json'),...researchRead('statistics-events-research-20261008.json'),...researchRead('statistics-events-followup-20261008.json'),...researchRead('statistics-events-industry-entry.json'),...researchRead('statistics-events-owner-20261009.json'),...researchRead('statistics-events-additional-20261009.json')],statsIds=new Set(),statsTypes=new Set();
for(const event of statsEvents){
 const key=event.profileId+':'+event.type;
 if(!byId.has(event.profileId)||!event.id||statsIds.has(event.id)||statsTypes.has(key)||!['founding','launch','industry_entry','failure'].includes(event.type)||!dateBounds(event.date)||!event.note||!event.checkedOn||!event.sources?.length)throw Error('Invalid statistics event: '+event.id);
 for(const s of event.sources){const u=new URL(s.url);if(!s.title||u.protocol!=='https:'||u.username||u.password)throw Error('Invalid statistics source: '+event.id);}
 if(event.type==='failure'&&!byId.get(event.profileId).failedInitiative)throw Error('Failure not verified: '+event.profileId);
 statsIds.add(event.id);statsTypes.add(key);
}
// Corporate history remains in the reviewed source files, but cannot inflate RWA growth.
const industryPolicy=researchRead('industry-entry-policy.json');
const entryRequired=new Set(industryPolicy.profileIds);
for(const p of profiles)if(p.categories.some(c=>c.section==='Institutions'||c.name==='TradFi'))entryRequired.add(p.id);
for(const e of statsEvents)if(['founding','launch'].includes(e.type)&&Number(e.date.slice(0,4))<2011)entryRequired.add(e.profileId);
for(const id of entryRequired){if(!byId.has(id))throw Error('Unknown industry-entry profile: '+id);byId.get(id).industryStartRequired=true;}
const publishedStats=statsEvents.filter(e=>!entryRequired.has(e.profileId)||!['founding','launch'].includes(e.type));
for(const e of publishedStats)if(e.type==='industry_entry'&&Number(e.date.slice(0,4))<2011)throw Error('Pre-2011 industry entry needs review: '+e.id);
for(const e of exitEvents)if(e.completedDate&&!dateBounds(e.completedDate))throw Error('Invalid exit date: '+e.id);
const report={sourceProfiles:source.profiles.length,sourcePlacements:Object.keys(source.bindings).length,mergedLegacy:merged.length,retainedLegacy:added.length,researchedProfiles:researched.length,excludedProfiles:Object.keys(excludedProfiles),updatedProfiles:Object.keys(profileUpdates),updatedLogos:Object.keys(logoOverrides).length,completedExits:exitEvents.length,totalProfiles:profiles.length,current:profiles.filter(p=>p.directoryStatus==='current').length,historical:profiles.filter(p=>p.directoryStatus==='historical').length,review:profiles.filter(p=>p.directoryStatus==='review').length,merged,added,researched,crosswalk};
const output={snapshotDate:'2026-10-09',upstreamSnapshotDate:'2026-10-04',source:'https://github.com/Bucktony/rwa-ecosystem-map',sourceRevision:'8669aa303764fa0736284e20e58eb0766eb66063',profiles,sections,crosswalk,statsEvents:publishedStats};
fs.writeFileSync(new URL('../data/ecosystem-directory.json',import.meta.url),JSON.stringify(output));
fs.writeFileSync(new URL('../data/ecosystem-import-report.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log({...report,merged:undefined,added:undefined,researched:undefined,crosswalk:undefined});
