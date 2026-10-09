import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  RWAF_DIRECTORY, prepareDirectory, directorySections, filterProfiles, memberFor
} from '../assets/ecosystem-model.js';

const original=JSON.parse(fs.readFileSync(new URL('../data/ecosystem-directory.json',import.meta.url)));
const roster=['Securitize','Maple','Solana','Stellar','Avalanche','Plume','Prestocks','Dinari','Brickken','OnRe','Etherfuse','IXSwap','Real Finance','Mu Digital','Credefi','Orca','DRVNLab','InvestReady'].map(name=>({name}));
const state={q:'',status:'all',section:RWAF_DIRECTORY,members:false};
const ids=profiles=>profiles.map(p=>p.id).sort();
const memberIds=(data,members)=>ids(data.profiles.filter(p=>memberFor(p,members)));
const sectionIds=sections=>sections.find(s=>s.name===RWAF_DIRECTORY)?.categories.flatMap(c=>c.ids)||[];

// Membership is an admin-managed relationship, independent of a profile's research status.
test('RWAF Directory contains all eighteen roster members and no legacy nonmembers',()=>{
  const data=prepareDirectory(original);
  const expected=memberIds(data,roster);
  assert.equal(expected.length,18);
  assert.ok(expected.includes('mu-digital'));
  assert.ok(expected.includes('rwaf-investready'));
  const sections=directorySections(data,roster);
  assert.equal(sections[0].name,'RWAF Directory');
  assert.equal(sections[0].categories.length,1);
  assert.equal(sections[0].categories[0].name,'RWAF Members');
  assert.deepEqual([...sectionIds(sections)].sort(),expected);
  assert.equal(new Set(sectionIds(sections)).size,18);
  assert.deepEqual(ids(filterProfiles(data.profiles,state,roster)),expected);
  assert.ok(!sectionIds(sections).includes('rwaf-google'));
  assert.ok(!sectionIds(sections).includes('rwaf-wally'));
});

test('member section follows roster additions, removals and an empty roster immediately',()=>{
  const data=prepareDirectory(original);
  const removed=roster.filter(m=>m.name!=='Maple');
  const added=[...removed,{name:'Chainlink'}];
  assert.ok(!sectionIds(directorySections(data,removed)).includes('maple-finance'));
  assert.ok(sectionIds(directorySections(data,added)).includes('chainlink'));
  assert.deepEqual(ids(filterProfiles(data.profiles,state,added)),memberIds(data,added));
  assert.equal(filterProfiles(data.profiles,{...state,q:'Maple'},added).length,0);
  assert.deepEqual(sectionIds(directorySections(data,[])),[]);
  assert.deepEqual(filterProfiles(data.profiles,state,[]),[]);
  // Repeated renders use the supplied roster, never a cached membership flag.
  assert.deepEqual([...sectionIds(directorySections(data,roster))].sort(),memberIds(data,roster));
});

test('member filtering retains exact-name search relevance and explicit status filters',()=>{
  const data=prepareDirectory(original);
  const extra=[...roster,{name:'Chainlink'},{name:'Chainlink CCIP'}];
  const chainlink=data.profiles.find(p=>p.id==='chainlink');
  const searchable=[...data.profiles,{...chainlink,id:'test-chainlink-ccip',name:'Chainlink CCIP',aliases:['Chainlink CCIP']}];
  const found=filterProfiles(searchable,{...state,q:'Chainlink'},extra);
  assert.equal(found.length,2);
  assert.equal(found[0].id,'chainlink');
  assert.ok(found.every(p=>memberFor(p,extra)));
  for(const status of ['current','historical','review']){
    const result=filterProfiles(data.profiles,{...state,status},roster);
    assert.deepEqual(ids(result),ids(data.profiles.filter(p=>memberFor(p,roster)&&p.directoryStatus===status)));
  }
  assert.ok(filterProfiles(data.profiles,{...state,status:'historical'},roster).some(p=>p.id==='mu-digital'));
  assert.ok(filterProfiles(data.profiles,{...state,status:'review'},roster).some(p=>p.id==='rwaf-investready'));
});

test('legacy directory entries stay discoverable without being labelled members',()=>{
  const data=prepareDirectory(original);
  const before=original.sections.find(s=>s.name==='RWAF directory');
  const after=data.sections.find(s=>s.name==='Additional ecosystem');
  assert.ok(before&&after);
  assert.deepEqual(after.categories,before.categories);
  assert.ok(!data.sections.some(s=>s.name==='RWAF directory'));
  const legacy=original.profiles.filter(p=>p.categories.some(c=>c.section==='RWAF directory'));
  for(const profile of legacy){
    const prepared=data.profiles.find(p=>p.id===profile.id);
    assert.ok(prepared.categories.some(c=>c.section==='Additional ecosystem'),profile.id);
    assert.ok(!prepared.categories.some(c=>c.section==='RWAF directory'),profile.id);
  }
  assert.deepEqual(
    ids(filterProfiles(data.profiles,{...state,section:'Additional ecosystem'},[])),
    ids(legacy)
  );
  assert.equal(data.profiles.length,original.profiles.length);
  assert.deepEqual(ids(data.profiles),ids(original.profiles));
  assert.deepEqual(data.statsEvents,original.statsEvents);
  assert.deepEqual(directorySections(data,roster).slice(1),data.sections);
});

test('preparing member views leaves source data and research statuses unchanged',()=>{
  const input=structuredClone(original),before=JSON.stringify(input);
  const data=prepareDirectory(input);
  directorySections(data,roster);
  directorySections(data,[]);
  filterProfiles(data.profiles,state,roster);
  assert.equal(JSON.stringify(input),before);
  assert.equal(data.profiles.find(p=>p.id==='mu-digital').directoryStatus,'historical');
  assert.equal(data.profiles.find(p=>p.id==='rwaf-investready').directoryStatus,'review');
  // It is safe to prepare an already prepared view without moving or duplicating entries.
  assert.deepEqual(prepareDirectory(data),data);
});
