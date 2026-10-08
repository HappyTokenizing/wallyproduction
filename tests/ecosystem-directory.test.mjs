import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {filterProfiles,memberFor,safeURL,websiteFor,key,memberCount,exitsFor,exitCount} from '../assets/ecosystem-model.js';
const read=name=>JSON.parse(fs.readFileSync(new URL(name,import.meta.url)));
const data=read('../data/ecosystem-directory.json'), source=read('../vendor/rwa-ecosystem-map/profiles.json');
const research=['institutions','services','networks','requested-additions','community-additions-20261007','lifecycle-additions-20261007'].flatMap(name=>read(`../data/research/${name}.json`));
const logos={...read('../data/research/logos-core.json'),...read('../data/research/logos-special.json'),...read('../data/research/logos-refinements.json'),...read('../data/research/logos-followup.json'),...read('../data/research/logos-missing.json'),...read('../data/research/logos-community-20261007.json'),...read('../data/research/logos-community-fixes-20261007.json')};
const excluded=read('../data/research/excluded-profiles.json');
const display=read('../data/research/logo-display.json');
const updates=read('../data/research/profile-updates.json');
const byId=new Map(data.profiles.map(p=>[p.id,p]));
const state={q:'',status:'all',section:'all',members:false};
test('source identities survive except explicit owner removals, without duplicate IDs or names',()=>{
 assert.equal(source.profiles.length,831);assert.ok(data.profiles.length>1000);
 assert.equal(data.profiles.length,866+research.length-Object.keys(excluded).length);
 assert.equal(new Set(data.profiles.map(p=>p.id)).size,data.profiles.length);
 assert.equal(new Set(data.profiles.map(p=>key(p.name))).size,data.profiles.length);
 for(const p of source.profiles){if(excluded[p.id]){assert.ok(!byId.has(p.id));continue;}const imported=byId.get(p.id);assert.ok(imported);assert.equal(imported.description,updates[p.id]?.description||p.description);assert.deepEqual(imported.logo,display[p.id]?{...(logos[p.id]||p.logo),...display[p.id]}:logos[p.id]||p.logo);}
});
test('every non-excluded source map placement resolves to its canonical profile',()=>{
 let count=0;
 for(const [binding,id] of Object.entries(source.bindings)){if(excluded[id])continue;const [section,category]=JSON.parse(binding);const c=data.sections.find(s=>s.name===section)?.categories.find(c=>c.name===category);assert.ok(c?.ids.includes(id),binding);count++;}
 assert.equal(count,Object.values(source.bindings).filter(id=>!excluded[id]).length);
 const mapped=new Set();for(const s of data.sections)for(const c of s.categories){assert.equal(new Set(c.ids).size,c.ids.length);for(const id of c.ids){assert.ok(byId.has(id));mapped.add(id);}}
 assert.equal(mapped.size,data.profiles.length);
});
test('default current filter separates historical and retained unreviewed entries',()=>{
 assert.equal(filterProfiles(data.profiles,{...state,status:'current'},[]).length,693+research.filter(p=>p.directoryStatus==='current').length);
 assert.equal(filterProfiles(data.profiles,{...state,status:'historical'},[]).length,139+research.filter(p=>p.directoryStatus==='historical').length);
 assert.equal(filterProfiles(data.profiles,{...state,status:'review'},[]).length,34);
 assert.equal(filterProfiles(data.profiles,state,[]).length,data.profiles.length);
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
test('all local logos exist and SVGs contain no active or remote content',()=>{
 const assets=new Set();
 for(const p of data.profiles){if(!p.logo)continue;assert.match(p.logo.src,/^\/ecosystem\/[a-zA-Z0-9._-]+$/);
  const file=new URL('..'+p.logo.src,import.meta.url);assert.ok(fs.existsSync(file),p.logo.src);assets.add(p.logo.src);
  if(path.extname(file.pathname)==='.svg'){const svg=fs.readFileSync(file,'utf8');assert.doesNotMatch(svg,/<\s*(script|foreignObject)\b/i);assert.doesNotMatch(svg,/(?:href|src)\s*=\s*["'](?:https?:|\/\/|javascript:)/i);}
 }
 assert.ok(assets.size>780);
});
test('all requested logo repairs are bundled with official provenance and original colors',()=>{
 const required='chronicle chainlink avici ether-fi galaxy-digital galaxyone ur-app rabby privy consolfreight mystic-finance opentrade pendle aptos arbitrum bnb-chain ethereum noble ondo-network own-network realio-network vaulta xdc-network agora exa frax hifi mastercard midas relay state-of-wyoming tether zerohash'.split(' ');
 for(const id of required){const logo=byId.get(id)?.logo;assert.ok(logo?.src,id);assert.equal(logo.treatment,'original',id);assert.ok(safeURL(logo.sourceUrl,{}),id);assert.ok(safeURL(logo.sourcePage,{}),id);assert.equal(logo.checkedOn,'2026-10-07');}
 assert.match(fs.readFileSync(new URL('..'+byId.get('chainlink').logo.src,import.meta.url),'utf8'),/#0847f7/i);
 assert.ok(byId.has('phantom')&&byId.has('solflare'));
 const wallets=data.sections.find(s=>s.name==='Wallets').categories.flatMap(c=>c.ids);
 assert.equal(wallets.filter(id=>id==='phantom').length,1);assert.equal(wallets.filter(id=>id==='solflare').length,1);
});
test('new profiles have dated official evidence and no duplicate aliases or domains',()=>{
 const existing=data.profiles.filter(p=>!research.some(r=>r.id===p.id));
 const identity=new Map(existing.flatMap(p=>[p.name,...p.aliases].map(n=>[key(n),p.id])));
 const domains=new Map(existing.filter(p=>p.domain).map(p=>[p.domain.toLowerCase().replace(/^www\./,''),p.id]));
 for(const p of research){
  assert.match(p.id,/^[a-z0-9]+(?:-[a-z0-9]+)*$/);assert.equal(p.checkedOn,'2026-10-07');
  assert.ok(p.sources.length&&p.evidenceNote&&p.categories.length,p.id);if(p.directoryStatus==='historical'){assert.equal(websiteFor(p),'');}else assert.ok(safeURL(p.website,p),p.id);
  for(const s of p.sources){assert.ok(s.title);assert.ok(safeURL(s.url,p),p.id);}
  for(const name of [p.name,...(p.aliases||[])]){const k=key(name);assert.ok(!identity.has(k)||identity.get(k)===p.id,`${p.id} duplicates ${identity.get(k)}`);identity.set(k,p.id);}
  const host=p.domain.toLowerCase().replace(/^www\./,'');assert.ok(host);if(p.directoryStatus==='review'&&host==='x.com'){assert.match(p.website,/^https:\/\/x\.com\/[a-zA-Z0-9_]+$/);}else if(domains.has(host)){assert.equal(p.parentProfileId,domains.get(host),`${p.id} shares ${host} without a parent relationship`);assert.ok(p.relatedEntities?.some(r=>r.id===p.parentProfileId));assert.notEqual(key(p.name),key(byId.get(p.parentProfileId).name));}else domains.set(host,p.id);
  const imported=byId.get(p.id);assert.ok(imported);assert.deepEqual(imported.sources,p.sources);
  for(const c of p.categories)assert.ok(data.sections.find(s=>s.name===c.section)?.categories.find(x=>x.name===c.name)?.ids.includes(p.id));
 }
});
test('profile links reject active protocols and former blocked domains',()=>{
 const p={blockedWebsiteHosts:['former.example']};
 for(const url of ['javascript:alert(1)','data:text/html,test','https://former.example','https://www.former.example','https://name:password@example.com'])assert.equal(safeURL(url,p),'');
 assert.equal(safeURL('https://current.example/path',p),'https://current.example/path');
 for(const profile of data.profiles)for(const related of profile.relatedEntities)assert.ok(byId.has(related.id));
});
test('requested additions reuse existing identities and expose all requested RWA Perps profiles',()=>{
 const requested={Orca:'rwaf-orca',Aerodrome:'aerodrome',Meteora:'meteora','Base Chain by Coinbase':'base-chain','Bondi Finance':'bondi-finance',JPMorgan:'jpmorgan','Ether.fi':'ether-fi',HastraFi:'hastra','1inch':'1inch','USD.AI':'usd-ai','3Jane':'3jane','Reserve Protocol':'reserve-rights',Solstice:'solstice','Strata Markets':'strata-markets',Uniswap:'uniswap',Pact:'pact-protocol',bStocks:'bstocks',StreamEx:'streamex','Oro Finance (Gold)':'oro-finance','Lend.xyz':'lendxyz',Pharos:'pharos','Chainlink CCIP':'chainlink',XRPL:'xrp-ledger',Multipli:'multipli','Pleasing Gold':'pleasing-gold',Cap:'cap'};
 for(const [q,id] of Object.entries(requested)){assert.ok(filterProfiles(data.profiles,{...state,q,status:'current'},[]).some(p=>p.id===id),q);assert.equal(data.profiles.filter(p=>p.id===id).length,1);}
 const expected='trade-xyz variational qfex gmtrade lighter ondo-finance extended entropy paragon edgex risex arcus hyperliquid'.split(' ').sort();
 const perps=filterProfiles(data.profiles,{...state,section:'RWA Perps',status:'current'},[]).map(p=>p.id).sort();assert.deepEqual(perps,expected);
 const mapped=data.sections.find(s=>s.name==='RWA Perps').categories.flatMap(c=>c.ids);assert.deepEqual(mapped.sort(),expected);
 assert.notEqual(byId.get('base-chain').domain,byId.get('base').domain);
 assert.ok(byId.get('rwaf-orca').legacyIds.includes('orca'));assert.equal(byId.get('rwaf-orca').directoryStatus,'current');
 assert.equal(byId.get('bstocks').parentProfileId,'binance');
 for(const [id,update] of Object.entries(updates)){assert.equal(byId.get(id).checkedOn,update.checkedOn);assert.deepEqual(byId.get(id).sources,update.sources);}
});
test('six follow-up logo fixes preserve official artwork without inverted color treatments',()=>{
 for(const id of 'sky franklin-templeton xstocks aave rwa-nova securitize'.split(' ')){
  const logo=byId.get(id).logo;assert.equal(logo.treatment,'original');assert.match(logo.src,/official-followup-20261007/);assert.ok(logo.sourcePage&&logo.sourceUrl);assert.equal(logo.checkedOn,'2026-10-07');
 }
 assert.equal(byId.get('securitize').logo.background,'light');assert.equal(byId.get('aave').logo.background,'light');
});
test('search ranks exact identity before name words, partial names and description mentions',()=>{
 const profile=(id,name,description='',aliases=[])=>({id,name,description,aliases,kind:'Company',directoryStatus:'current',categories:[{section:'Test',name:'Test'}]});
 const items=[profile('mention','Aardvark Capital','Uses Aave for lending'),profile('partial','Aavenue'),profile('words','The Aave Initiative'),profile('prefix','Aave Labs'),profile('exact','Aave')];
 const member=[{name:'Aardvark Capital'}];
 assert.deepEqual(filterProfiles(items,{...state,q:'aave'},member).map(p=>p.id),['exact','prefix','words','partial','mention']);
 assert.equal(filterProfiles(items,{...state,q:''},member)[0].id,'mention');
 assert.equal(filterProfiles([profile('alias','J.P. Morgan / Kinexys','',['JPMorgan']),profile('mention','AAA','Research on JP Morgan')],{...state,q:'JP Morgan'},[])[0].id,'alias');
 assert.equal(filterProfiles([profile('words','Markets Strata')],{...state,q:'strata markets'},[]).length,1);
 assert.equal(filterProfiles(items,{...state,q:'unmatched'},[]).length,0);
});

test('member summary tracks the live roster and documented closures remain distinct from exits',()=>{
 assert.equal(memberCount([{name:'Maple'},{name:'Maple Finance'},{name:'Securitize'}]),2);
 assert.equal(memberCount([{name:'Securitize'}]),1);assert.equal(memberCount([]),0);
 const failed=data.profiles.filter(p=>p.failedInitiative===true);assert.deepEqual(failed.map(p=>p.id),['archblock','neufund']);for(const p of failed){assert.ok(p.sources.length);assert.equal(exitsFor(p).length,0);}
 assert.ok(data.profiles.filter(p=>p.directoryStatus==='historical').length>failed.length);
 const seda=byId.get('seda-protocol');assert.ok(seda.categories.some(c=>c.section==='Oracles'));assert.ok(seda.sources.length);
});


test('community additions reuse existing companies and preserve renamed identities',()=>{
 const expected={TX:'coreum',Coreum:'coreum','Real Finance':'rwaf-real','GRT Wines':'grtwines','Jade City':'jadecity','Quant':'quant','RealityFi':'realityfi'};
 for(const [q,id] of Object.entries(expected))assert.equal(filterProfiles(data.profiles,{...state,q},[])[0]?.id,id,q);
 assert.equal(byId.get('rwaf-real').directoryStatus,'current');
 assert.equal(byId.get('realityfi').directoryStatus,'review');
 assert.equal(byId.get('realityfi').website,'https://x.com/RealityFi_xyz');
 assert.ok(!byId.get('realityfi').failedInitiative);
 assert.ok(!filterProfiles(data.profiles,{...state,q:'RealityFi',status:'current'},[]).length);
 assert.equal(byId.get('coreum').name,'TX');assert.ok(!byId.has('tx'));
 assert.ok(!byId.has('novastro'));
 for(const s of data.sections)for(const c of s.categories)assert.ok(!c.ids.includes('novastro'));
});
test('Collectibles and Data categories group canonical companies without duplicating them',()=>{
 for(const [section,ids] of Object.entries({'Collectibles':['collector-crypt','beezie','phygitals','courtyard','dualmint','grtwines'],'Data & analytics':['rwa-xyz','defillama','token-terminal','refraction-research','dune','blockworks']})){
  const profiles=filterProfiles(data.profiles,{...state,section,status:'current'},[]);
  for(const id of ids)assert.ok(profiles.some(p=>p.id===id),section+': '+id);
  assert.equal(new Set(profiles.map(p=>p.id)).size,profiles.length);
 }
});
test('community logo repairs retain original artwork and dated provenance',()=>{
 for(const id of ['stellar','sui','intesa-sanpaolo','natwest-group','bank-of-england','world-bank','rwaf-orca','grtwines','jadecity','vaneck']){
  const logo=byId.get(id).logo;assert.equal(logo.treatment,'original',id);assert.ok(logo.sourceUrl&&logo.sourcePage,id);assert.equal(logo.checkedOn,'2026-10-07');
 }
});


test('Exits includes only completed sourced M&A and counts each deal once',()=>{
 const source={title:'Official completion',url:'https://example.com/completed'};
 const event={id:'one-deal',status:'completed',type:'acquisition',sources:[source]};
 const base={name:'Example',aliases:[],description:'',kind:'Company',categories:[],directoryStatus:'current'};
 const p={...base,id:'one',exitEvents:[event,event]};
 assert.equal(exitCount([p,{...p,id:'two'}]),1);
 for(const invalid of [{...event,status:'announced'},{...event,type:'closure'},{...event,type:'bankruptcy'},{...event,type:'rebrand'},{...event,sources:[]},{...event,sources:[{url:'javascript:alert(1)'}]}])assert.equal(exitCount([{...p,exitEvents:[invalid]}]),0);
 const profiles=[p,{...base,id:'historic',directoryStatus:'historical',exitEvents:[{...event,id:'two-deal',type:'merger'}]},{...base,id:'closed',failedInitiative:true,directoryStatus:'historical'}];
 assert.deepEqual(filterProfiles(profiles,{...state,status:'exits'},[]).map(p=>p.id).sort(),['historic','one']);
 assert.equal(exitCount(profiles),2);
});
test('reviewed M&A records have canonical targets and Neufund is a documented closure',()=>{
 const records=read('../data/research/exits.json');assert.equal(records.length,8);assert.equal(exitCount(data.profiles),records.length);
 assert.equal(new Set(records.map(e=>e.id)).size,records.length);
 assert.equal(filterProfiles(data.profiles,{...state,status:'exits'},[]).length,8);
 for(const e of records){const p=byId.get(e.profileId);assert.ok(p,e.profileId);assert.ok(exitsFor(p).some(x=>x.id===e.id));assert.ok(e.target&&e.counterparty&&e.summary);assert.equal(e.checkedOn,'2026-10-07');for(const s of e.sources)assert.ok(s.title&&safeURL(s.url,p));}
 for(const id of ['archblock','neufund','realityfi','zodia-custody','mountain-protocol','xstocks'])assert.equal(exitsFor(byId.get(id)).length,0,id);
 const n=byId.get('neufund');assert.equal(n.directoryStatus,'historical');assert.equal(n.lifecycle,'Closed');assert.equal(n.failedInitiative,true);assert.match(n.sources[0].url,/medium\.com\/neufund\/neufund-closure-faq/);assert.equal(websiteFor(n),'');
 assert.equal(filterProfiles(data.profiles,{...state,status:'historical',q:'Neufund'},[])[0].id,'neufund');
});
