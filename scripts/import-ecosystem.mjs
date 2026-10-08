import fs from 'node:fs';
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
for(const name of ['institutions.json','services.json','networks.json','requested-additions.json','community-additions-20261007.json']){
 for(const entry of researchRead(name)){
  if(byId.has(entry.id)||profiles.some(p=>norm(p.name)===norm(entry.name)))throw Error('Duplicate research identity: '+entry.name);
  if(!entry.sources?.length||!entry.checkedOn||!entry.categories?.length)throw Error('Incomplete research: '+entry.name);
  const p={newsRules:[],newsTags:[],relatedEntities:[],logo:null,officialUpdates:[],legacyIds:[],...entry,aliases:[...new Set([entry.name,...(entry.aliases||[])])],provenance:'RWA Foundation / official-source research'};
  profiles.push(p);byId.set(p.id,p);researched.push(p.id);
  place(p,p.categories);
 }
}
// Explicit, dated corrections preserve upstream IDs, placements and favorites.
const profileUpdates=researchRead('profile-updates.json');
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
const logoOverrides={...researchRead('logos-core.json'),...researchRead('logos-special.json'),...researchRead('logos-refinements.json'),...researchRead('logos-followup.json'),...researchRead('logos-missing.json'),...researchRead('logos-community-20261007.json'),...researchRead('logos-community-fixes-20261007.json')};
// Phantom already has a Stablecoin Builders placement; expose the same identity under Wallets.
const phantom=byId.get('phantom');
if(!phantom.categories.some(c=>c.section==='Wallets'&&c.name==='Wallets'))phantom.categories.push({section:'Wallets',name:'Wallets'});
const wallets=sections.find(s=>s.name==='Wallets').categories.find(c=>c.name==='Wallets');
if(!wallets.ids.includes(phantom.id))wallets.ids.push(phantom.id);
for(const [id,logo] of Object.entries(logoOverrides)){
 if(!byId.has(id)||!logo.src||!logo.sourceUrl||!logo.sourcePage)throw Error('Incomplete logo override: '+id);
 byId.get(id).logo=logo;
}
// Contrast-only corrections retain the original source artwork and provenance.
for(const [id,display] of Object.entries(researchRead('logo-display.json'))){
 const p=byId.get(id);
 if(!p?.logo||Object.keys(display).some(k=>k!=='background')||!['light','dark'].includes(display.background))throw Error('Invalid logo display correction: '+id);
 Object.assign(p.logo,display);
}
// Owner-requested removals are explicit and reproducible without altering the vendor snapshot.
const excludedProfiles=researchRead('excluded-profiles.json');
for(const [id,removal] of Object.entries(excludedProfiles)){
 if(!byId.has(id)||!removal.reason||!removal.requestedOn)throw Error('Invalid exclusion: '+id);
 byId.delete(id);profiles.splice(profiles.findIndex(p=>p.id===id),1);
 for(const section of sections)for(const category of section.categories)category.ids=category.ids.filter(x=>x!==id);
 for(const p of profiles)p.relatedEntities=p.relatedEntities.filter(x=>x.id!==id);
 for(const [legacyId,profileId] of Object.entries(crosswalk))if(profileId===id)delete crosswalk[legacyId];
}
const report={sourceProfiles:source.profiles.length,sourcePlacements:Object.keys(source.bindings).length,mergedLegacy:merged.length,retainedLegacy:added.length,researchedProfiles:researched.length,excludedProfiles:Object.keys(excludedProfiles),updatedProfiles:Object.keys(profileUpdates),updatedLogos:Object.keys(logoOverrides).length,totalProfiles:profiles.length,current:profiles.filter(p=>p.directoryStatus==='current').length,historical:profiles.filter(p=>p.directoryStatus==='historical').length,review:profiles.filter(p=>p.directoryStatus==='review').length,merged,added,researched,crosswalk};
const output={snapshotDate:'2026-10-07',upstreamSnapshotDate:'2026-10-04',source:'https://github.com/Bucktony/rwa-ecosystem-map',sourceRevision:'8669aa303764fa0736284e20e58eb0766eb66063',profiles,sections,crosswalk};
fs.writeFileSync(new URL('../data/ecosystem-directory.json',import.meta.url),JSON.stringify(output));
fs.writeFileSync(new URL('../data/ecosystem-import-report.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log({...report,merged:undefined,added:undefined,researched:undefined,crosswalk:undefined});
