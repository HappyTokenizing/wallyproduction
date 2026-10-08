import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {dateBounds,quarterFromKey,quarterLabel,statsSeries,statsTSV} from '../assets/ecosystem-stats-model.js';
import {chartSVG} from '../assets/ecosystem-stats.js';
const data=JSON.parse(fs.readFileSync(new URL('../data/ecosystem-directory.json',import.meta.url)));
const source={title:'Primary evidence',url:'https://example.com/evidence'};
const profile=(id,section='A')=>({id,name:id,aliases:[],categories:[{section,name:section}],directoryStatus:'current'});
const event=(profileId,date,type='founding')=>({id:profileId+'-'+type,profileId,date,type,note:'Test',sources:[source]});
const criteria={metric:'new',scope:'all',section:'all',basis:'all',from:'2024-Q1',to:'2024-Q4'};
test('calendar dates map to UTC quarters without inventing precision',()=>{
 for(const [date,quarter] of [['2024-01-01','2024-Q1'],['2024-03-31','2024-Q1'],['2024-04-01','2024-Q2'],['2024-12-31','2024-Q4'],['2024-02-29','2024-Q1'],['2024-07','2024-Q3']])assert.equal(dateBounds(date).quarter,quarterFromKey(quarter));
 assert.equal(dateBounds('2024').quarter,null);
 for(const date of ['2023-02-29','2024-02-30','2024-00','2024-13','2024-01-00','2024-Q5','not a date'])assert.equal(dateBounds(date),null,date);
 assert.equal(quarterLabel(quarterFromKey('2024-Q3')),'Q3 2024');
});
test('quarter charts zero-fill gaps, exclude imprecise/future dates, and deduplicate profiles',()=>{
 const d={snapshotDate:'2024-10-07',profiles:['a','b','c','d','e','f'].map(id=>profile(id)),statsEvents:[event('a','2024-02'),event('a','2024-04','launch'),event('b','2024-09'),event('c','2024'),event('d','2024-11'),event('f','invalid')]};
 const s=statsSeries(d,criteria,[]);assert.deepEqual(s.points.map(p=>p.value),[1,0,1,0]);assert.equal(s.points.at(-1).partial,true);assert.deepEqual(s.coverage,{eligible:6,dated:2,yearOnly:1,unknown:2,future:1});assert.equal(s.total,2);
 assert.equal(statsSeries(d,{...criteria,basis:'launch'},[]).total,1);
});
test('cumulative growth carries the prior-window baseline and does not double-count M&A',()=>{
 const d={snapshotDate:'2024-10-07',profiles:['a','b','c'].map(id=>profile(id)),statsEvents:[event('a','2020-01'),event('b','2024-04'),event('c','2024-07')]};
 const s=statsSeries(d,{...criteria,metric:'growth'},[]);assert.equal(s.baseline,1);assert.deepEqual(s.points.map(p=>p.value),[1,2,3,3]);assert.deepEqual(s.points.map(p=>p.growthPercent),[0,100,50,0]);
});
test('sector and current membership filters count each identity once',()=>{
 const d={snapshotDate:'2024-10-07',profiles:[{...profile('a'),categories:[{section:'A',name:'one'},{section:'A',name:'two'}]},profile('b','B')],statsEvents:[event('a','2024-01'),event('b','2024-01')]};
 assert.equal(statsSeries(d,{...criteria,section:'A'},[]).total,1);
 assert.equal(statsSeries(d,{...criteria,scope:'members'},[{name:'b'}]).total,1);
 assert.equal(statsSeries(d,{...criteria,scope:'members'},[]).total,0);
});
test('live dataset has explicit event dates, undated exits, and separately verified failures',()=>{
 const all={...criteria,from:'2000-Q1',to:'2026-Q4'};
 const starts=statsSeries(data,all,[]);
 // Coverage is derived from the sourced start events (founding preferred over launch), so research additions stay consistent.
 const first=new Map();for(const e of data.statsEvents.filter(e=>e.type==='founding'||e.type==='launch')){const c=first.get(e.profileId);if(!c||(c.type!=='founding'&&e.type==='founding'))first.set(e.profileId,e);}
 const quarterDated=[...first.values()].filter(e=>dateBounds(e.date).quarter!=null).length;
 assert.equal(starts.coverage.future,0);assert.equal(starts.coverage.dated,quarterDated);assert.equal(starts.coverage.yearOnly,first.size-quarterDated);assert.equal(starts.coverage.unknown,data.profiles.length-first.size);
 assert.ok(first.size>=490,'sourced start dates for most of the directory');
 const years=statsSeries(data,{...all,unit:'year',from:'1700',to:'2026'},[]);assert.equal(years.coverage.dated,first.size);assert.equal(years.coverage.yearOnly,0);
 const exits=statsSeries(data,{...all,metric:'exits'},[]);assert.equal(exits.coverage.eligible,9);assert.equal(exits.coverage.dated,8);assert.equal(exits.coverage.unknown,1);assert.equal(exits.total,8);
 assert.deepEqual(exits.points.filter(p=>p.value).map(p=>[p.label,p.value]),[['Q1 2025',2],['Q2 2025',1],['Q4 2025',2],['Q1 2026',1],['Q2 2026',1],['Q3 2026',1]]);
 const failures=statsSeries(data,{...all,metric:'failures'},[]);assert.equal(failures.total,3);assert.deepEqual(failures.shownEvents.map(e=>[e.name,quarterLabel(e.quarter)]),[['Neufund','Q1 2022'],['Archblock','Q1 2026'],['Opulous','Q2 2026']]);assert.equal(failures.coverage.eligible,3);
 for(const e of data.statsEvents){assert.ok(data.profiles.some(p=>p.id===e.profileId));assert.ok(e.sources.length&&e.note&&dateBounds(e.date));assert.notEqual(e.date,e.checkedOn);}
});
test('export retains coverage, excludes tooltips/scripts, escapes content and protects pasted cells',()=>{
 const s=statsSeries({snapshotDate:'2024-10-07',profiles:[profile('=HYPERLINK("x")')],statsEvents:[event('=HYPERLINK("x")','2024-01')]},criteria,[]);
 const svg=chartSVG(s,'<script>&',{interactive:false});assert.ok(svg.includes('&lt;script&gt;&amp;'));assert.ok(svg.includes('Dated sample only'));assert.ok(svg.includes('1 of 1'));assert.ok(!svg.includes('data-quarter='));assert.ok(!svg.includes('<script>'));
 const tsv=statsTSV(s,'test');assert.ok(tsv.includes('Date coverage'));assert.ok(tsv.includes('https://example.com/evidence'));assert.ok(tsv.includes("'=HYPERLINK"));
});
test('missing or empty data remains explicit instead of manufacturing quarterly history',()=>{
 const s=statsSeries({snapshotDate:'2026-10-07',profiles:[profile('unknown')],statsEvents:[]},{...criteria,from:'2026-Q1',to:'2026-Q4'},[]);assert.equal(s.total,0);assert.equal(s.coverage.unknown,1);assert.ok(s.points.every(p=>p.value===0));assert.equal(s.shownEvents.length,0);
});
test('the year view charts year-only starts in their own year, never in an invented quarter',()=>{
 const d={snapshotDate:'2024-10-07',profiles:['a','b','c','d'].map(id=>profile(id)),statsEvents:[event('a','2022'),event('b','2023-05-02'),event('c','2024'),event('d','2025')]};
 const y=statsSeries(d,{...criteria,unit:'year',from:'2022',to:'2024'},[]);
 assert.equal(y.unit,'year');assert.deepEqual(y.points.map(p=>[p.label,p.value]),[['2022',1],['2023',1],['2024',1]]);
 assert.equal(y.points.at(-1).partial,true);assert.deepEqual(y.coverage,{eligible:4,dated:3,yearOnly:0,unknown:0,future:1});
 const q=statsSeries(d,{...criteria,from:'2023-Q1',to:'2024-Q4'},[]);assert.equal(q.coverage.yearOnly,2);assert.equal(q.total,1);
 assert.match(statsTSV(y,'All profiles'),/\nYear\t/);
});
