import test from 'node:test';
import assert from 'node:assert/strict';
import {createDirectoryLoader} from '../assets/ecosystem-data.js';
import {statsSeries,startEvent} from '../assets/ecosystem-stats-model.js';

const base={snapshotDate:'2026-10-09',profiles:[{
  id:'test-company',name:'Test Company',description:'Test profile',website:'https://test.example',domain:'test.example',
  categories:[{section:'Test sector',name:'Test category'}],directoryStatus:'current',aliases:[],relatedEntities:[],officialUpdates:[],sources:[]
}],sections:[{name:'Test sector',categories:[{name:'Test category',ids:['test-company']}]}],statsEvents:[{
  id:'original-start',profileId:'test-company',type:'launch',date:'2024-01',sources:[{title:'Original',url:'https://test.example/old'}]
}]};
const update={records:[{id:'edit',updatedAt:'2026-10-09T12:00:00.000Z',review:{
  profileId:'test-company',name:'Test Company',description:'Test profile',website:'https://test.example',region:'International',
  categories:[{section:'Test sector',name:'Test category'}],directoryStatus:'current',
  start:{date:'2024-08',type:'launch',sourceUrl:'https://test.example/launch',sourceTitle:'Launch announcement'}
}}],updatedAt:'2026-10-09T12:00:00.000Z'};
const response=value=>new Response(JSON.stringify(value),{headers:{'Content-Type':'application/json'}});

test('saved company dates move both the profile date and chart event on refresh',async()=>{
  let published={records:[],updatedAt:null};
  const load=createDirectoryLoader(async url=>response(url.includes('/data/')?base:published));
  const first=await load();published=update;const second=await load();
  assert.equal(startEvent(first.data.profiles[0],first.data.statsEvents).date,'2024-01');
  assert.equal(startEvent(second.data.profiles[0],second.data.statsEvents).date,'2024-08');
  const range={metric:'new',from:'2024-Q1',to:'2024-Q4'};
  assert.deepEqual(statsSeries(first.data,range).points.map(p=>p.value),[1,0,0,0]);
  assert.deepEqual(statsSeries(second.data,range).points.map(p=>p.value),[0,0,1,0]);
  assert.equal(second.warning,'');
});

test('failed public refresh retains confirmed changes and displays an explicit warning',async()=>{
  let fail=false;
  const load=createDirectoryLoader(async url=>{
    if(url.includes('/data/'))return response(base);
    if(fail)throw Error('offline');return response(update);
  });
  const saved=await load();fail=true;const offline=await load();
  assert.deepEqual(offline.data,saved.data);assert.match(offline.warning,/last confirmed/);
});

test('initial update outage falls back to the static directory without claiming updates loaded',async()=>{
  const load=createDirectoryLoader(async url=>url.includes('/data/')?response(base):new Response('offline',{status:503}));
  const result=await load();
  assert.equal(result.data.profiles.length,1);assert.match(result.warning,/snapshot/);
  assert.equal(startEvent(result.data.profiles[0],result.data.statsEvents).date,'2024-01');
});

test('coincident refreshes share reads and base fetch failures can be retried',async()=>{
  let baseReads=0,updateReads=0,fail=true;
  const load=createDirectoryLoader(async url=>{
    if(url.includes('/data/')){baseReads++;if(fail)throw Error('offline');return response(base);}
    updateReads++;return response(update);
  });
  await assert.rejects(load());fail=false;
  const [a,b]=await Promise.all([load(),load()]);
  assert.deepEqual(a,b);assert.equal(baseReads,2);assert.equal(updateReads,2);
});
