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

test('all requested additional employers are distinct non-member sources',()=>{
 const ids=['robinhood','aave','morpho','coinbase','redstone','chainlink','pyth','bnb','ripple','ethena','superstate','arbitrum','sky','rwa-xyz'];
 for(const id of ids){const found=sources.filter(s=>s.id===id);assert.equal(found.length,1);assert.equal(found[0].memberName,null);}
});
test('custom career domains and EU Lever preserve employer links without widening host validation',()=>{
 const robinhood=sources.find(s=>s.id==='robinhood');
 const [j]=parseFeed(robinhood,{jobs:[{title:'Engineer',absolute_url:'https://boards.greenhouse.io/robinhood/jobs/123',first_published:'2026-09-20T00:00:00Z'}]},new Date(now).toISOString());assert.ok(j);assert.equal(j.memberName,null);
 assert.equal(normalize(robinhood,{role:'Engineer',apply:'https://untrusted.example/job'},new Date(now).toISOString()),null);
 for(const role of ['Dream Job',"Don't see the right role for you? Apply here!",'General Application'])assert.equal(normalize(source,{role,apply:source.url+'/123'},new Date(now).toISOString()),null);
});
test('embedded Ashby boards are parsed as data and malformed pages cannot erase results',()=>{
 const chainlink=sources.find(s=>s.id==='chainlink');
 const app={jobBoard:{teams:[{id:'team',name:'Engineering'}],jobPostings:[{id:'role-id',title:'Engineer',teamId:'team',locationName:'US',workplaceType:'Remote',employmentType:'FullTime'}]}};
 const [j]=parseFeed(chainlink,'<script>window.__appData = '+JSON.stringify(app)+';</script>',new Date(now).toISOString());assert.equal(j.company,'Chainlink Labs');assert.equal(j.postedAt,null);assert.equal(j.type,'Full time');assert.equal(j.work,'Remote');
 assert.throws(()=>parseFeed(chainlink,'<html>Unavailable</html>',new Date(now).toISOString()));
});
test('official Teamtailor RSS uses publication dates and ignores general applications',()=>{
 const ethena=sources.find(s=>s.id==='ethena');
 const xml='<rss version="2.0"><channel><item><title>Product &amp; Design</title><link>https://careers.ethena.fi/jobs/123</link><pubDate>Wed, 23 Sep 2026 20:27:29 +0100</pubDate><remoteStatus>fully</remoteStatus></item><item><title>General Application</title><link>https://careers.ethena.fi/jobs/456</link></item></channel></rss>';
 const jobs=parseFeed(ethena,xml,new Date(now).toISOString());assert.equal(jobs.length,1);assert.equal(jobs[0].role,'Product & Design');assert.equal(jobs[0].postedAt,'2026-09-23T19:27:29.000Z');assert.equal(jobs[0].work,'Remote');
 assert.throws(()=>parseFeed(ethena,'<html>Unavailable</html>',new Date(now).toISOString()));
});
test('Traffit only accepts published job feed records and explicit dates',()=>{
 const redstone=sources.find(s=>s.id==='redstone');assert.deepEqual(parseFeed(redstone,[],new Date(now).toISOString()),[]);
 const [j]=parseFeed(redstone,[{advert:{name:'Engineer',values:[{field_id:'category',value:'Engineering'}]},url:'https://redstone.traffit.com/public/job/123',valid_start:'2026-09-22T10:00:00Z'}],new Date(now).toISOString());assert.equal(j.postedAt,'2026-09-22T10:00:00.000Z');assert.deepEqual(j.tags,['Engineering']);
 assert.throws(()=>parseFeed(redstone,{},new Date(now).toISOString()));
});
