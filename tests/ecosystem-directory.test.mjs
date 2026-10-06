import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {filterProfiles,memberFor,safeURL,websiteFor,key} from '../assets/ecosystem-model.js';
const read=name=>JSON.parse(fs.readFileSync(new URL(name,import.meta.url)));
const data=read('../data/ecosystem-directory.json'), source=read('../vendor/rwa-ecosystem-map/profiles.json');
const byId=new Map(data.profiles.map(p=>[p.id,p]));
const state={q:'',status:'all',section:'all',members:false};
test('all 831 source identities survive without duplicate IDs or normalized names',()=>{
 assert.equal(source.profiles.length,831);assert.equal(data.profiles.length,866);
 assert.equal(new Set(data.profiles.map(p=>p.id)).size,866);
 assert.equal(new Set(data.profiles.map(p=>key(p.name))).size,866);
 for(const p of source.profiles){const imported=byId.get(p.id);assert.ok(imported);assert.equal(imported.description,p.description);assert.deepEqual(imported.logo,p.logo);}
});
test('every source map placement is retained and resolves to its canonical profile',()=>{
 let count=0;
 for(const [binding,id] of Object.entries(source.bindings)){const [section,category]=JSON.parse(binding);const c=data.sections.find(s=>s.name===section)?.categories.find(c=>c.name===category);assert.ok(c?.ids.includes(id),binding);count++;}
 assert.equal(count,844);
 const mapped=new Set();for(const s of data.sections)for(const c of s.categories){assert.equal(new Set(c.ids).size,c.ids.length);for(const id of c.ids){assert.ok(byId.has(id));mapped.add(id);}}
 assert.equal(mapped.size,866);
});
test('default current filter separates historical and retained unreviewed entries',()=>{
 assert.equal(filterProfiles(data.profiles,{...state,status:'current'},[]).length,692);
 assert.equal(filterProfiles(data.profiles,{...state,status:'historical'},[]).length,139);
 assert.equal(filterProfiles(data.profiles,{...state,status:'review'},[]).length,35);
 assert.equal(filterProfiles(data.profiles,state,[]).length,866);
 for(const p of data.profiles.filter(p=>p.directoryStatus==='historical'))assert.equal(websiteFor(p),'');
});
test('known identity overlaps merge while unrelated names and distinct initiatives remain',()=>{
 assert.equal(data.crosswalk.franklin,data.crosswalk.franklintf);
 assert.equal(data.crosswalk.ondo,'ondo-finance');assert.equal(data.crosswalk.ixswap,'ixs');
 assert.notEqual(data.crosswalk.real,'re.al');
 assert.ok(byId.has('ondo-finance')&&byId.has('ondo-network'));
 assert.ok(byId.has('blackrock')&&byId.has('blackrock-buidl'));
});
test('membership follows the current admin roster including deletions and aliases',()=>{
 const maple=byId.get('maple-finance');
 assert.ok(memberFor(maple,[{name:'Maple Finance'}]));assert.equal(memberFor(maple,[]),undefined);
 assert.ok(memberFor(byId.get('ixs'),[{name:'IX Swap'}]));
 assert.ok(memberFor(byId.get('drvn-labo'),[{name:'DRVN Lab'}]));
 assert.equal(filterProfiles(data.profiles,{...state,members:true},[]).length,0);
 assert.equal(filterProfiles(data.profiles,{...state,members:true},[{name:'Maple Finance'}]).length,1);
 assert.equal(memberFor(byId.get('blackrock-buidl'),[{name:'BlackRock'}]),undefined);
});
test('search reaches beyond the first page and across legacy aliases',()=>{
 const last=[...data.profiles].sort((a,b)=>a.name.localeCompare(b.name)).at(-1);
 assert.ok(filterProfiles(data.profiles,{...state,q:last.name},[]).some(p=>p.id===last.id));
 assert.equal(filterProfiles(data.profiles,{...state,q:'Franklin (TradFi)'},[])[0].id,'franklin-templeton');
});
test('all 780 local logos exist and SVGs contain no active or remote content',()=>{
 const assets=new Set();
 for(const p of data.profiles){if(!p.logo)continue;assert.match(p.logo.src,/^\/ecosystem\/[a-zA-Z0-9._-]+$/);
  const file=new URL('..'+p.logo.src,import.meta.url);assert.ok(fs.existsSync(file),p.logo.src);assets.add(p.logo.src);
  if(path.extname(file.pathname)==='.svg'){const svg=fs.readFileSync(file,'utf8');assert.doesNotMatch(svg,/<\s*(script|foreignObject)\b/i);assert.doesNotMatch(svg,/(?:href|src)\s*=\s*["'](?:https?:|\/\/|javascript:)/i);}
 }
 assert.equal(assets.size,780);
});
test('profile links reject active protocols and former blocked domains',()=>{
 const p={blockedWebsiteHosts:['former.example']};
 for(const url of ['javascript:alert(1)','data:text/html,test','https://former.example','https://www.former.example','https://name:password@example.com'])assert.equal(safeURL(url,p),'');
 assert.equal(safeURL('https://current.example/path',p),'https://current.example/path');
 for(const profile of data.profiles)for(const related of profile.relatedEntities)assert.ok(byId.has(related.id));
});
