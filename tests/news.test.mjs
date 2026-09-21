import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const script=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].find(m=>m[1].includes('var NW='))[1];
const story=(id,headline,extra={})=>({id,headline,url:'https://example.com/'+id,section:'Markets',summary:'',...extra});
function client(items,hidden=[]){
  const elements=Object.fromEntries(['#nwList','#nwChips','#nwStatus'].map(id=>[id,{innerHTML:''}]));
  const c=vm.createContext({document:{querySelector:id=>elements[id]},fetch:async url=>({ok:true,json:async()=>url.includes('hidden')?{ids:hidden}:{items}})});
  c.window=c;
  vm.runInContext(script,c);
  return {c,elements,load:()=>c.nwAdminLoad(),roster:names=>c.nwSyncMembers(names.map(name=>({name})))};
}
test('logo roster controls tags, feed hints cannot grant absent membership',async()=>{
  const b=client([
    story('a','Securitize expands'),story('b','Tokenized fund launches',{summary:'Backed by Maple Finance.'}),
    story('c','Fund expands',{members:['Removed member']}),story('d','Protocol update',{members:['Solana']}),
    story('e','Dinari updates',{members:['Removed member','Securitize']})
  ]);
  b.roster(['Securitize','Maple','Solana','Dinari']);
  const data=await b.load();
  assert.deepEqual(Array.from(data.items,x=>x.m),['Securitize','Maple',null,'Solana','Securitize, Dinari']);
  b.c.nwSetCat('RWAF Members');
  assert.equal((b.elements['#nwList'].innerHTML.match(/class="nw-card member"/g)||[]).length,4);
  assert.match(b.elements['#nwChips'].innerHTML,/RWAF Members<span class="nw-chip-count">4/);
  assert.match(b.elements['#nwList'].innerHTML,/nw-member-badge/);
});
test('late roster loads and logo additions, deletions and resets reclassify existing stories',async()=>{
  const b=client([story('a','Maple expands'),story('b','New Co launches')]);
  await b.load();b.c.nwSetCat('RWAF Members');
  assert.match(b.elements['#nwList'].innerHTML,/No RWAF member stories/);
  b.roster(['Maple']);assert.match(b.elements['#nwList'].innerHTML,/Maple expands/);
  b.roster(['New Co']);assert.doesNotMatch(b.elements['#nwList'].innerHTML,/Maple expands/);
  assert.match(b.elements['#nwList'].innerHTML,/New Co launches/);
  b.roster([]);assert.match(b.elements['#nwChips'].innerHTML,/RWAF Members<span class="nw-chip-count">0/);
});
test('matching handles punctuation, spacing and case without substring or source matches',async()=>{
  const b=client([
    story('a','IX Swap works with ON-RE'),story('b','maple grows'),
    story('c','Mapleton and Orcadian updates'),story('d','Industry update',{source:{name:'Solana'},url:'https://example.com/solana'})
  ]);b.roster(['IXSwap','OnRe','Maple','Orca','Solana','maple']);
  const data=await b.load();
  assert.deepEqual(Array.from(data.items,x=>x.m),['IXSwap, OnRe','Maple',null,null]);
});
test('hidden stories stay hidden and member filters work with search and empty feeds',async()=>{
  const b=client([story('a','Maple launches'),story('b','Solana launches'),story('c','Maple hidden')],['c']);
  b.roster(['Maple','Solana']);await b.load();b.c.nwSetCat('RWAF Members');b.c.nwSetQ('maple');
  assert.match(b.elements['#nwList'].innerHTML,/Maple launches/);
  assert.doesNotMatch(b.elements['#nwList'].innerHTML,/Solana launches|Maple hidden/);
  assert.match(b.elements['#nwChips'].innerHTML,/RWAF Members<span class="nw-chip-count">2/);
  const empty=client([]);await empty.load();
  assert.match(empty.elements['#nwChips'].innerHTML,/RWAF Members/);
  assert.doesNotMatch(empty.elements['#nwList'].innerHTML,/Loading/);
});
test('feed categories and names render as escaped text with no inline category code',async()=>{
  const b=client([story('a','<img onerror=alert(1)> expands',{section:"Issuer's <news>"})]);
  b.roster(['<img onerror=alert(1)>']);await b.load();
  assert.doesNotMatch(b.elements['#nwList'].innerHTML,/<img/);
  assert.match(b.elements['#nwList'].innerHTML,/&lt;img/);
  assert.doesNotMatch(b.elements['#nwChips'].innerHTML,/onclick=/);
  assert.match(b.elements['#nwChips'].innerHTML,/Issuer&#39;s &lt;news&gt;/);
});
test('logo manager notifies news after remote loads and logo edits',async()=>{
  const sync=html.slice(html.indexOf('const LOGO_LS='),html.indexOf('function admOk()'));
  const changes=[];const c=vm.createContext({
    fetch:async()=>({ok:true,json:async()=>({store:{order:[],del:[],add:[{id:'u1',name:'New Member',src:'data:image/png;base64,aA=='}]},revision:'v1'})}),
    document:{querySelectorAll:()=>[],querySelector:()=>null},$:()=>null,
    lsGet:(k,f)=>f,localStorage:{setItem(){},removeItem(){}},
    sessionStorage:{getItem:()=>''},toast(){},confirm:()=>true,addEventListener(){},
    nwSyncMembers:logos=>changes.push(Array.from(logos,l=>l.name)),
  });c.window=c;
  vm.runInContext("let admTabNow='logos';function admPaintLogos(){};"+sync,c);
  await new Promise(resolve=>setImmediate(resolve));
  assert.deepEqual(changes,[[],['New Member']]);
  vm.runInContext('lgSave({order:[],del:[],add:[]});renderLogoWall()',c);
  assert.deepEqual(changes.at(-1),[]);
});
