import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { sources, parseFeed, normalize, collectJobs, MAX_AGE } from '../lib/job-feed.js';
const now=Date.parse('2026-09-24T18:00:00Z');
const source=sources.find(s=>s.id==='stellar');
const fixture={jobs:[{title:'Engineer',jobUrl:source.url+'/123',isListed:true,employmentType:'FullTime',isRemote:true,workplaceType:'Hybrid',location:'San Francisco'}]};
test('ATS workplace type takes precedence over broad remote eligibility',()=>{
 const jobs=parseFeed(source,fixture,new Date(now).toISOString());assert.equal(jobs[0].work,'Hybrid');assert.equal(jobs[0].type,'Full time');assert.equal(jobs[0].ts,0);
});
test('general applications, unlisted roles and unsafe/mismatched URLs are excluded',()=>{
 for(const extra of [{role:'Open Application'},{isListed:false},{apply:'javascript:alert(1)'},{apply:'https://example.org/job'}])assert.equal(normalize(source,{role:'Engineer',apply:source.url+'/123',...extra},new Date(now).toISOString()),null);
});
test('empty successful feed removes old jobs; failure keeps only unexpired snapshots',async()=>{
 const snapshot={jobs:[{sourceId:'stellar',id:'recent',checkedAt:new Date(now-1000).toISOString()},{sourceId:'stellar',id:'expired',checkedAt:new Date(now-MAX_AGE-1).toISOString()}]};
 const failed=await collectJobs({now,snapshot,fetcher:async()=>{throw Error('offline')}});
 assert.deepEqual(failed.jobs.filter(j=>j.sourceId==='stellar').map(j=>j.id),['recent']);
 assert.equal(failed.coverage.find(s=>s.id==='stellar').status,'cached');
 const empty=await collectJobs({now,snapshot,fetcher:async()=>({ok:true,json:async()=>({jobs:[]})})});
 assert.equal(empty.jobs.filter(j=>j.sourceId==='stellar').length,0);
});
test('expired manually reviewed jobs are hidden rather than refreshed by server time',async()=>{
 const data=await collectJobs({now:Date.parse('2027-01-01'),fetcher:async()=>{throw Error('offline')}});
 assert.equal(data.jobs.length,0);assert.equal(data.coverage.find(s=>s.id==='dinari').status,'needs-review');
});
test('snapshot covers all 19 member companies and uses unique real application URLs',()=>{
 const data=JSON.parse(readFileSync(new URL('../data/jobs-snapshot.json',import.meta.url)));
 assert.equal(sources.filter(s=>s.memberName).length,19);
 assert.equal(new Set(data.jobs.map(j=>j.id)).size,data.jobs.length);
 assert.equal(new Set(data.jobs.map(j=>j.apply)).size,data.jobs.length);
 assert.ok(data.jobs.length>90);assert.ok(!data.jobs.some(j=>/open application|intern-2026/i.test(j.role+' '+j.id)));
});
test('malformed and incomplete feeds fail instead of erasing the verified fallback',()=>{
 assert.throws(()=>parseFeed(source,{},new Date(now).toISOString()));
 const rippling=sources.find(s=>s.id==='plume');
 const data={props:{pageProps:{dehydratedState:{queries:[{state:{data:{items:[],totalPages:2}}}]}}}};
 assert.throws(()=>parseFeed(rippling,'<script id="__NEXT_DATA__" type="application/json">'+JSON.stringify(data)+'</script>',new Date(now).toISOString()));
});
