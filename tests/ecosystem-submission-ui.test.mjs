import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync(new URL('../templates/site.html',import.meta.url),'utf8');
const script=html.slice(html.indexOf('let seSending=false;'),html.indexOf('/* ---------- ecosystem local additions: merge at boot ---------- */'));
function setup(fetcher) {
  const values={seName:'Example Project',seBlurb:'Tokenized asset infrastructure',seType:'Other',seRegion:'International',seUrl:'https://example.com',seEmail:'private@example.com',seWebsiteConfirm:''};
  const elements=Object.fromEntries(Object.entries(values).map(([key,value])=>['#'+key,{value}]));
  Object.assign(elements,{'#subEcoForm':{hidden:false},'#subEcoOk':{hidden:true},'#subEcoFoot':{lastElementChild:{hidden:false,disabled:false,textContent:'Submit'}}});
  const notices=[],calls=[];
  const context=vm.createContext({URL,AbortSignal,$:selector=>elements[selector],pjMark:()=>true,toast:(...args)=>notices.push(args),fetch:async(...args)=>{calls.push(args);return fetcher(...args);},openModal(){},document:{querySelector(){return null;}}});
  vm.runInContext(script,context);
  return {submit:()=>vm.runInContext('submitEco()',context),elements,notices,calls};
}
test('ecosystem form confirms submission only after the server acknowledges persistence',async()=>{
  let resolve;
  const fixture=setup(()=>new Promise(done=>{resolve=done;}));
  const pending=fixture.submit();await fixture.submit();
  assert.equal(fixture.calls.length,1);assert.equal(fixture.elements['#subEcoForm'].hidden,false);
  assert.equal(fixture.elements['#subEcoFoot'].lastElementChild.disabled,true);
  resolve(new Response(JSON.stringify({ok:true}),{status:200}));await pending;
  assert.equal(fixture.elements['#subEcoForm'].hidden,true);assert.equal(fixture.elements['#subEcoOk'].hidden,false);
  const [url,options]=fixture.calls[0];assert.equal(url,'/api/ecosystem');
  const payload=JSON.parse(options.body);assert.equal(payload.action,'submit');assert.equal(payload.submission.email,'private@example.com');
  assert.doesNotMatch(fixture.elements['#subEcoOk'].innerHTML,/private@example.com/);
});
test('ecosystem form preserves entered values and shows failure when storage is unavailable',async()=>{
  for(const response of [new Response(JSON.stringify({error:'Storage unavailable'}),{status:503}),new Response(JSON.stringify({}),{status:200})]){
    const fixture=setup(async()=>response);await fixture.submit();
    assert.equal(fixture.elements['#subEcoForm'].hidden,false);assert.equal(fixture.elements['#subEcoOk'].hidden,true);
    assert.equal(fixture.elements['#seName'].value,'Example Project');
    assert.equal(fixture.elements['#subEcoFoot'].lastElementChild.disabled,false);
    assert.equal(fixture.notices[0][0],'Project not submitted');
  }
});
