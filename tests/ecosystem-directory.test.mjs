import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {safeLogoPath,logoVersions} from '../assets/ecosystem-logo-model.js';
import {filterProfiles,memberFor,safeURL,websiteFor,key,memberCount,exitsFor,exitCount} from '../assets/ecosystem-model.js';
const read=name=>JSON.parse(fs.readFileSync(new URL(name,import.meta.url)));
const data=read('../data/ecosystem-directory.json'), source=read('../vendor/rwa-ecosystem-map/profiles.json');
const research=['institutions','services','networks','requested-additions','community-additions-20261007','lifecycle-additions-20261007','community-submissions-20261008','directory-additions-20261009'].flatMap(name=>read(`../data/research/${name}.json`));
const logoManifests=['logos-core','logos-special','logos-refinements','logos-followup','logos-missing','logos-community-20261007','logos-community-fixes-20261007','logos-submissions-20261008','logos-refresh-20261009'].map(name=>read(`../data/research/${name}.json`));
const priorLogos=Object.assign(Object.fromEntries(source.profiles.filter(p=>p.logo).map(p=>[p.id,p.logo])),...logoManifests.slice(0,-1));
const refreshLogos=logoManifests.at(-1);
const logos={...priorLogos,...Object.fromEntries(Object.entries(refreshLogos).map(([id,logo])=>[id,logo.changeKind==='display-correction'?{...priorLogos[id],...logo}:logo]))};
const excluded=read('../data/research/excluded-profiles.json');
const dated=read('../data/research/profile-updates-20261008.json');
const updates={...read('../data/research/profile-updates.json'),...dated};
const submissions=read('../data/research/community-submissions-20261008.json');
const submissionUpdates=read('../data/research/profile-submissions-20261008.json');
for(const [id,update] of Object.entries(submissionUpdates))updates[id]={...(updates[id]||{}),...update};
for(const [id,update] of Object.entries(read('../data/research/profile-updates-20261009.json')))updates[id]={...(updates[id]||{}),...update};
const origins=new Map([...source.profiles,...research].map(p=>[p.id,p]));
const expectedStatus=id=>updates[id]?.directoryStatus||origins.get(id)?.directoryStatus||(origins.has(id)?'current':'review');
const exitRecords=['exits','exits-20261008','exits-20261009'].flatMap(name=>read(`../data/research/${name}.json`));
const assetHash=src=>createHash('sha256').update(fs.readFileSync(new URL('..'+src,import.meta.url))).digest('hex');
const byId=new Map(data.profiles.map(p=>[p.id,p]));
const state={q:'',status:'all',section:'all',members:false};
test('submission import maps every response once without granting membership or inventing event dates',()=>{
 const report=read('../data/research/submission-import-20261008.json');
 assert.equal(report.submissions,42);assert.equal(report.mapping.length,42);
 assert.equal(new Set(report.mapping.map(r=>r.row)).size,42);
 assert.equal(report.mapping.filter(r=>r.action==='added').length,23);
 assert.equal(report.mapping.filter(r=>r.action==='merged').length,19);
 for(const row of report.mapping){
  if(excluded[row.profileId]){assert.ok(!byId.has(row.profileId));assert.ok(excluded[row.profileId].reason&&excluded[row.profileId].requestedOn);continue;}
  const p=byId.get(row.profileId);assert.ok(p,row.profileId);assert.equal(p.directorySubmission.row,row.row);
  assert.equal(memberFor(p,[]),undefined);assert.ok(!('member' in p.directorySubmission));
 }
 assert.equal(report.mapping.find(r=>r.row===15).profileId,'zig-finance');
 assert.notEqual(report.mapping.find(r=>r.row===40).profileId,'strata-markets');
 const hyve=data.statsEvents.find(e=>e.profileId==='hyve');
 assert.equal(hyve.date,'2023','owner resolved the earlier submission conflict');
 assert.ok(hyve.sources.some(s=>s.url.endsWith('/owner-clarifications-20261008.json')));
 for(const payload of [report,submissions,submissionUpdates])assert.doesNotMatch(JSON.stringify(payload),/Primary contact email|mailto:|[\w.+-]+@[\w.-]+\.[a-z]{2,}/i);
});
test('source identities survive except explicit owner removals, without duplicate IDs or names',()=>{
 assert.equal(source.profiles.length,831);assert.ok(data.profiles.length>1000);
 assert.equal(data.profiles.length,866+research.length-Object.keys(excluded).length);
 assert.equal(new Set(data.profiles.map(p=>p.id)).size,data.profiles.length);
 assert.equal(new Set(data.profiles.map(p=>key(p.name))).size,data.profiles.length);
 for(const p of source.profiles){if(excluded[p.id]){assert.ok(!byId.has(p.id));continue;}const imported=byId.get(p.id);assert.ok(imported);assert.equal(imported.description,updates[p.id]?.description||p.description);assert.equal(imported.logo?.src,(logos[p.id]||p.logo)?.src);}
});
test('every non-excluded source map placement resolves to its canonical profile',()=>{
 let count=0;
 for(const [binding,id] of Object.entries(source.bindings)){if(excluded[id])continue;const [section,category]=JSON.parse(binding);const c=data.sections.find(s=>s.name===section)?.categories.find(c=>c.name===category);assert.ok(c?.ids.includes(id),binding);count++;}
 assert.equal(count,Object.values(source.bindings).filter(id=>!excluded[id]).length);
 const mapped=new Set();for(const s of data.sections)for(const c of s.categories){assert.equal(new Set(c.ids).size,c.ids.length);for(const id of c.ids){assert.ok(byId.has(id));mapped.add(id);}}
 assert.equal(mapped.size,data.profiles.length);
});
test('default current filter separates historical and retained unreviewed entries',()=>{
 for(const status of ['current','historical','review']){
  const expected=data.profiles.filter(p=>expectedStatus(p.id)===status).map(p=>p.id).sort();
  assert.deepEqual(filterProfiles(data.profiles,{...state,status},[]).map(p=>p.id).sort(),expected);
 }
 assert.equal(filterProfiles(data.profiles,state,[]).length,data.profiles.length);
 for(const p of data.profiles.filter(p=>p.directoryStatus==='historical'))assert.equal(websiteFor(p),'');
});
test('known identity overlaps merge while unrelated names and distinct initiatives remain',()=>{
 assert.equal(data.crosswalk.franklin,data.crosswalk.franklintf);
 assert.equal(data.crosswalk.ondo,'ondo-finance');assert.equal(data.crosswalk.ixswap,'ixs');
 assert.notEqual(data.crosswalk.real,'re.al');
 assert.ok(byId.has('ondo-finance')&&byId.has('ondo-network'));
 assert.ok(byId.has('blackrock')&&byId.has('blackrock-buidl'));
 assert.equal(data.crosswalk['daylight-energy-by-anode-labs'],'daylight');
 assert.ok(!byId.has('daylight-energy-by-anode-labs'));
 assert.equal(filterProfiles(data.profiles,{...state,q:'Anode Labs'},[])[0].id,'daylight');
 assert.equal(byId.get('daylight').directoryStatus,'current');
 assert.match(byId.get('kaio').description,/^Previously Libre, KAIO/);
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
 for(const p of data.profiles)for(const logo of [p.logo,...(p.logoHistory||[])].filter(Boolean)){
  assert.equal(safeLogoPath(logo.src),logo.src,p.id);
  const file=new URL('..'+logo.src,import.meta.url);assert.ok(fs.existsSync(file),logo.src);assets.add(logo.src);
  if(path.extname(file.pathname)==='.svg'){const svg=fs.readFileSync(file,'utf8');assert.doesNotMatch(svg,/<\s*(script|foreignObject)\b/i);assert.doesNotMatch(svg,/(?:href|src)\s*=\s*["'](?:https?:|\/\/|javascript:)/i);}
 }
 assert.ok(assets.size>780);
});
test('all requested logo repairs are bundled with official provenance and original colors',()=>{
 const required='chronicle chainlink avici ether-fi galaxy-digital galaxyone ur-app rabby privy consolfreight mystic-finance opentrade pendle aptos arbitrum bnb-chain ethereum noble ondo-network own-network realio-network vaulta xdc-network agora exa frax hifi mastercard midas relay state-of-wyoming tether zerohash'.split(' ');
 for(const id of required){const logo=byId.get(id)?.logo;assert.ok(logo?.src,id);assert.equal(logo.treatment,'original',id);assert.ok(safeURL(logo.sourceUrl,{}),id);assert.ok(safeURL(logo.sourcePage,{}),id);assert.match(logo.checkedOn,/^\d{4}-\d{2}-\d{2}$/);assert.ok(logo.checkedOn>='2026-10-07'&&logo.checkedOn<=data.snapshotDate);}
 assert.equal(byId.get('chainlink').logo.treatment,'original');
 assert.ok(byId.has('phantom')&&byId.has('solflare'));
 const wallets=data.sections.find(s=>s.name==='Wallets').categories.flatMap(c=>c.ids);
 assert.equal(wallets.filter(id=>id==='phantom').length,1);assert.equal(wallets.filter(id=>id==='solflare').length,1);
});
test('new profiles have dated official evidence and no duplicate aliases or domains',()=>{
 const existing=data.profiles.filter(p=>!research.some(r=>r.id===p.id));
 const identity=new Map(existing.flatMap(p=>[p.name,...p.aliases].map(n=>[key(n),p.id])));
 const domains=new Map(existing.filter(p=>p.domain).map(p=>[p.domain.toLowerCase().replace(/^www\./,''),p.id]));
 for(const p of research){
  if(excluded[p.id]){assert.ok(!byId.has(p.id));continue;}
  assert.match(p.id,/^[a-z0-9]+(?:-[a-z0-9]+)*$/);assert.match(p.checkedOn,/^\d{4}-\d{2}-\d{2}$/);assert.ok(p.checkedOn<=data.snapshotDate);
  assert.ok(p.sources.length&&p.evidenceNote&&p.categories.length,p.id);if(p.directoryStatus==='historical'){assert.equal(websiteFor(p),'');}else assert.ok(safeURL(p.website,p),p.id);
  for(const s of p.sources){assert.ok(s.title);assert.ok(safeURL(s.url,p),p.id);}
  for(const name of [p.name,...(p.aliases||[])]){const k=key(name);assert.ok(!identity.has(k)||identity.get(k)===p.id,`${p.id} duplicates ${identity.get(k)}`);identity.set(k,p.id);}
  const host=p.domain.toLowerCase().replace(/^www\./,'');assert.ok(host);if(p.directoryStatus==='review'&&host==='x.com'){assert.match(p.website,/^https:\/\/x\.com\/[a-zA-Z0-9_]+$/);}else if(domains.has(host)){assert.equal(p.parentProfileId,domains.get(host),`${p.id} shares ${host} without a parent relationship`);assert.ok(p.relatedEntities?.some(r=>r.id===p.parentProfileId));assert.notEqual(key(p.name),key(byId.get(p.parentProfileId).name));}else domains.set(host,p.id);
  const imported=byId.get(p.id);assert.ok(imported);assert.deepEqual(imported.sources,updates[p.id]?.sources||p.sources);
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
 for(const [id,update] of Object.entries(updates)){if(excluded[id]){assert.ok(!byId.has(id));continue;}assert.equal(byId.get(id).checkedOn,update.checkedOn);assert.deepEqual(byId.get(id).sources,update.sources);}
});
test('six follow-up logo fixes preserve official artwork without inverted color treatments',()=>{
 for(const id of 'sky franklin-templeton xstocks aave rwa-nova securitize'.split(' ')){
  const logo=byId.get(id).logo;assert.equal(logo.treatment,'original');assert.equal(logo.src,logos[id].src);assert.ok(logo.sourcePage&&logo.sourceUrl);assert.match(logo.checkedOn,/^\d{4}-\d{2}-\d{2}$/);assert.ok(logo.checkedOn>='2026-10-07'&&logo.checkedOn<=data.snapshotDate);
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
 const failed=data.profiles.filter(p=>p.failedInitiative===true);assert.deepEqual(failed.map(p=>p.id).sort(),['archblock','dominion-market','neufund','opulous']);for(const p of failed){assert.ok(p.sources.length);assert.equal(exitsFor(p).length,0);}
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
  const logo=byId.get(id).logo;assert.equal(logo.treatment,'original',id);assert.ok(logo.sourceUrl&&logo.sourcePage,id);assert.match(logo.checkedOn,/^\d{4}-\d{2}-\d{2}$/);assert.ok(logo.checkedOn>='2026-10-07'&&logo.checkedOn<=data.snapshotDate);
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
 const records=exitRecords;assert.equal(exitCount(data.profiles),records.length);
 assert.equal(new Set(records.map(e=>e.id)).size,records.length);
 const targets=new Set(records.flatMap(e=>[e.profileId,...(e.relatedProfileIds||[])]));
 assert.deepEqual(filterProfiles(data.profiles,{...state,status:'exits'},[]).map(p=>p.id).sort(),[...targets].sort());
 for(const e of records){for(const id of [e.profileId,...(e.relatedProfileIds||[])]){const p=byId.get(id);assert.ok(p,id);assert.ok(exitsFor(p).some(x=>x.id===e.id));for(const s of e.sources)assert.ok(s.title&&safeURL(s.url,p));}assert.ok(e.target&&e.counterparty&&e.summary);assert.match(e.checkedOn,/^\d{4}-\d{2}-\d{2}$/);assert.ok(e.checkedOn<=data.snapshotDate,e.id);}
 for(const id of ['archblock','neufund','realityfi','zodia-custody','mountain-protocol','xstocks'])assert.equal(exitsFor(byId.get(id)).length,0,id);
 const n=byId.get('neufund');assert.equal(n.directoryStatus,'historical');assert.equal(n.lifecycle,'Closed');assert.equal(n.failedInitiative,true);assert.match(n.sources[0].url,/medium\.com\/neufund\/neufund-closure-faq/);assert.equal(websiteFor(n),'');
 assert.equal(filterProfiles(data.profiles,{...state,status:'historical',q:'Neufund'},[])[0].id,'neufund');
});


test('logo revisions retain prior local artwork while the latest reviewed override stays current',()=>{
 for(const p of data.profiles){
  if(!p.logo)continue;
  const versions=[p.logo,...(p.logoHistory||[])],paths=versions.map(v=>v.src);
  assert.equal(new Set(paths).size,paths.length,p.id+' duplicate history paths');
  assert.equal(logoVersions(p).filter(v=>v.status==='current').length,1,p.id);
  assert.equal(logoVersions(p)[0].src,p.logo.src,p.id);
  const known=[origins.get(p.id)?.logo,...logoManifests.map(m=>m[p.id])].filter(v=>v?.src);
  const savedHashes=new Set(versions.map(v=>assetHash(v.src)));
  for(const v of known)assert.ok(savedHashes.has(assetHash(v.src)),p.id+' dropped previously bundled artwork '+v.src);
  const latest=logos[p.id];
  if(latest){assert.equal(p.logo.src,latest.src,p.id);assert.equal(p.logo.sourceUrl,latest.sourceUrl,p.id);assert.equal(p.logo.sourcePage,latest.sourcePage,p.id);assert.equal(p.logo.checkedOn,latest.checkedOn,p.id);}
  for(const version of p.logoHistory||[])for(const field of ['checkedOn','recordedOn','archivedOn'])if(version[field]){assert.match(version[field],/^\d{4}-\d{2}-\d{2}$/);assert.ok(version[field]<=data.snapshotDate,p.id);}
 }
});

test('display corrections retain provenance and member priority while actual refreshes require official sources',()=>{
 for(const [id,record] of Object.entries(refreshLogos)){
  const current=byId.get(id)?.logo;assert.ok(current,id);assert.equal(current.treatment,'original',id);
  if(record.changeKind==='display-correction'){
   const prior=priorLogos[id];assert.ok(prior,id);assert.equal(record.src,prior.src,id+' display-only update must retain original bytes');
   for(const field of ['sourceUrl','sourcePage','sourceTitle','useForMembers'])if(!(field in record))assert.equal(current[field],prior[field],id+' lost '+field);
   assert.equal(current.background,record.background,id);
  }else{
   assert.ok(safeURL(record.sourceUrl,byId.get(id)),id+' missing official asset source');
   assert.ok(safeURL(record.sourcePage,byId.get(id)),id+' missing official brand/site reference');
   assert.equal(current.sourceUrl,record.sourceUrl,id);assert.equal(current.sourcePage,record.sourcePage,id);
   if(record.changeKind==='historical-asset-recovery'){
    assert.equal(byId.get(id).directoryStatus,'historical',id);
    assert.equal(current.useForMembers,false,id+' archived artwork must not override a current member upload');
   }else assert.equal(current.useForMembers,true,id+' newest reviewed artwork must stay default for members');
  }
 }
});

test('owner removals disappear everywhere and TokenizeThis remains distinct from Security Token Market',()=>{
 for(const id of ['adcentral','agama-finance']){
  assert.ok(excluded[id]?.reason&&excluded[id]?.requestedOn,id);
  assert.ok(!byId.has(id));assert.ok(!Object.values(data.crosswalk).includes(id));
  assert.ok(data.sections.every(s=>s.categories.every(c=>!c.ids.includes(id))));
  assert.ok(data.statsEvents.every(e=>e.profileId!==id));
 }
 const conference=byId.get('tokenizethis'),market=byId.get('security-token-market');
 assert.ok(conference&&market);assert.notEqual(conference.id,market.id);
 assert.equal(filterProfiles(data.profiles,{...state,q:'TokenizeThis'},[])[0].id,'tokenizethis');
 const shared='redstone-stm-tokenizethis-2026';
 const first=exitsFor(conference).find(e=>e.id===shared),second=exitsFor(market).find(e=>e.id===shared);
 assert.ok(first&&second);assert.equal(first.status,'completed');assert.equal(first.type,'acquisition');
 assert.equal(first.announcedDate,'2026-01-21');assert.ok(!first.completedDate,'announcement is not an inferred closing date');
 assert.equal(exitCount([conference,market]),1);
});
