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
const report={sourceProfiles:source.profiles.length,sourcePlacements:Object.keys(source.bindings).length,mergedLegacy:merged.length,retainedLegacy:added.length,totalProfiles:profiles.length,current:profiles.filter(p=>p.directoryStatus==='current').length,historical:profiles.filter(p=>p.directoryStatus==='historical').length,review:profiles.filter(p=>p.directoryStatus==='review').length,merged,added,crosswalk};
const output={snapshotDate:'2026-10-04',source:'https://github.com/Bucktony/rwa-ecosystem-map',sourceRevision:'8669aa303764fa0736284e20e58eb0766eb66063',profiles,sections,crosswalk};
fs.writeFileSync(new URL('../data/ecosystem-directory.json',import.meta.url),JSON.stringify(output));
fs.writeFileSync(new URL('../data/ecosystem-import-report.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log({...report,merged:undefined,added:undefined,crosswalk:undefined});
