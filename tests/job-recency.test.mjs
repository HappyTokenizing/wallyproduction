import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { parseFeed, sources, publicationDate, jobPageDate } from '../lib/job-feed.js';
const context=vm.createContext({});vm.runInContext(readFileSync(new URL('../assets/job-recency.js',import.meta.url),'utf8'),context);
const R=context.RWAFJobRecency, now=Date.parse('2026-09-24T18:00:00Z');
const job=(id,company,days,member=true)=>({id,company,member,imported:true,postedAt:new Date(now-days*R.DAY).toISOString(),checkedAt:new Date(now).toISOString()});
test('7/30/60/90-day windows include their exact boundary, exclude future and undated roles',()=>{
 for(const days of [7,30,60,90]){
   assert.ok(R.withinDays(job('a','A',days),days,now));
   assert.ok(!R.withinDays(job('a','A',days+0.001),days,now));
 }
 assert.ok(!R.withinDays(job('a','A',-1),30,now));
 assert.ok(!R.withinDays({imported:true,checkedAt:new Date(now).toISOString(),ts:now},30,now));
 assert.ok(!R.withinDays({postedAt:'invalid',imported:true},30,now));
});
test('newest ordering takes precedence over membership and preserves older publication dates',()=>{
 const jobs=[job('old-member','A',29),job('new-external','B',1,false),job('middle-member','C',15)];
 assert.deepEqual(jobs.sort(R.newest).map(j=>j.id),['new-external','middle-member','old-member']);
 const greenhouse=sources.find(s=>s.kind==='greenhouse');
 const [g]=parseFeed(greenhouse,{jobs:[{title:'Engineer',absolute_url:greenhouse.url+'/jobs/1',first_published:'2026-01-01T00:00:00Z',updated_at:new Date(now).toISOString()}]},new Date(now).toISOString());
 assert.equal(g.postedAt,'2026-01-01T00:00:00.000Z');assert.ok(!R.withinDays(g,90,now));
 const ashby=sources.find(s=>s.kind==='ashby');
 const [a]=parseFeed(ashby,{jobs:[{title:'Engineer',jobUrl:ashby.url+'/1',publishedAt:'2026-09-20T12:00:00Z'}]},new Date(now).toISOString());
 assert.equal(a.postedAt,'2026-09-20T12:00:00.000Z');
});
test('featured rotation is recent, member-only, starts newest and never triples even at wraparound',()=>{
 const jobs=[...Array.from({length:10},(_,i)=>job('a'+i,'A',i+1)),job('b','B',12),job('c','C',20),job('old','D',31),job('external','E',0,false)];
 const result=R.featured(jobs,now);assert.equal(result[0].id,'a0');assert.ok(result.every(j=>j.member&&R.withinDays(j,30,now)));
 const circular=[...result,...result,...result];
 for(let i=2;i<circular.length;i++)assert.ok(!(R.company(circular[i])===R.company(circular[i-1])&&R.company(circular[i])===R.company(circular[i-2])));
 // Any date window may be wider, but the featured queue is always capped at 30 days.
 assert.ok(!result.some(j=>j.id==='old'||j.id==='external'));
});
test('empty and single-company featured results do not create repeating carousel runs',()=>{
 assert.equal(R.featured([],now).length,0);
 const items=R.featured([job('1','A',1),job('2','A',2),job('3','A',3)],now);
 assert.equal(items.length,1);assert.equal(items[0].id,'1');
});
test('structured publication date extraction ignores generic page modification dates',()=>{
 const html='<script type="application/ld+json">'+JSON.stringify({'@graph':[{'@type':'WebPage',dateModified:'2026-09-24'},{'@type':'JobPosting',datePosted:'2026-09-11'}]})+'</script>';
 assert.equal(jobPageDate(html,now),'2026-09-11T00:00:00.000Z');
 assert.equal(jobPageDate('<script type="application/ld+json">{"dateModified":"2026-09-24"}</script>',now),null);
 for(const value of [null,'Yesterday','2027-01-01','invalid',123])assert.equal(publicationDate(value,now),null);
});
