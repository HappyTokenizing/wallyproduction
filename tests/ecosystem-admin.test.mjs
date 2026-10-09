import test from 'node:test';
import assert from 'node:assert/strict';
import {escapeAdmin,profileReview,submissionReview,matchingProfiles,reviewFromValues,reviewProblems,adminSnapshot} from '../assets/ecosystem-admin.js';

const company = (id,name,categories=[]) => ({id,name,aliases:[],description:'',categories,directoryStatus:'current'});
const goodReview = () => ({profileId:null,name:'Example',description:'An example project',website:'https://example.com',region:'Global',categories:[{section:'Tokenization',name:'Tokenized Asset Issuers'}],directoryStatus:'current',start:{date:'2024-Q2',type:'launch',sourceUrl:'https://example.com/launch',sourceTitle:'Project launch'}});

test('admin escape treats submission fields as text and never HTML or attributes',()=>{
  assert.equal(escapeAdmin('<img src=x onerror="alert(1)"> & \'quoted\''),'&lt;img src=x onerror=&quot;alert(1)&quot;&gt; &amp; &#39;quoted&#39;');
  assert.equal(escapeAdmin(null),'');
});

test('submission draft preserves reviewed values while keeping contact information out of public review',()=>{
  const submission={name:'Submitted Name',description:'Original description',website:'https://example.com',email:'private@example.com',type:'Issuer',region:'EU'};
  const record={id:'submission',submission};
  const draft=submissionReview(record);
  assert.equal(draft.name,'Submitted Name');
  assert.equal(draft.profileId,null);
  assert.equal(draft.start,null);
  assert.ok(!('email' in draft));
  assert.ok(!('type' in draft));
  const saved=goodReview();
  const loaded=submissionReview({...record,review:saved});
  loaded.categories[0].name='Edited';
  assert.notEqual(loaded.categories[0].name,saved.categories[0].name);
  assert.equal(record.submission.email,'private@example.com');
});

test('company editor uses the same sourced industry start as charts, not the old incorporation date',()=>{
  const profile={...company('bank','Old Bank',[{section:'Institutions',name:'Banks'}]),website:'https://example.com'};
  const data={statsEvents:[{profileId:'bank',date:'1850',type:'founding',sources:[{url:'https://example.com/history',title:'History'}]},{profileId:'bank',date:'2022-Q4',type:'industry_entry',sources:[{url:'https://example.com/tokenization',title:'First tokenization'}]}]};
  const review=profileReview(profile,data);
  assert.deepEqual(review.start,{date:'2022-Q4',type:'industry_entry',sourceUrl:'https://example.com/tokenization',sourceTitle:'First tokenization'});
  assert.equal(review.profileId,'bank');
  assert.equal(profileReview(profile,{statsEvents:[data.statsEvents[0]]}).start,null);
});

test('canonical match search prioritizes exact company names and aliases to avoid duplicates',()=>{
  const profiles=[company('other','Chainlink CCIP'),company('chainlink','Chainlink'),{...company('alias','A company'),aliases:['LINK']},company('empty','Nothing')];
  assert.deepEqual(matchingProfiles(profiles,'Chainlink').map(profile=>profile.id),['chainlink','other']);
  assert.equal(matchingProfiles(profiles,'LINK')[0].id,'alias');
  assert.equal(matchingProfiles(profiles,'unavailable').length,0);
  assert.equal(matchingProfiles(profiles,'',2).length,2);
});

test('form review emits explicit null for cleared dates and never silently uses a review timestamp',()=>{
  const review=reviewFromValues({profileId:' bank ',name:' Example ',description:' Desc ',website:' https://example.com ',region:' Global ',directoryStatus:'current',date:' ',dateType:'launch',sourceUrl:'https://example.com/old',sourceTitle:'Stale source'},goodReview().categories);
  assert.equal(review.profileId,'bank');
  assert.equal(review.name,'Example');
  assert.equal(review.start,null);
  assert.ok(!('submittedAt' in review));
  const quarter=reviewFromValues({...review,date:'2023-Q3',dateType:'launch',sourceUrl:' https://example.com/launch ',sourceTitle:' Launch '},review.categories);
  assert.equal(quarter.start.date,'2023-Q3');
  assert.equal(quarter.start.sourceTitle,'Launch');
});

test('admin refuses invalid source dates and unsafe URLs before publication',()=>{
  const valid=goodReview();assert.deepEqual(reviewProblems(valid,{publish:true}),[]);
  for(const date of ['2023-02-29','2024-13','2024-Q5','yesterday'])assert.ok(reviewProblems({...valid,start:{...valid.start,date}}).length,date);
  for(const url of ['javascript:alert(1)','data:text/html,test','https://user:secret@example.com']){
    assert.ok(reviewProblems({...valid,website:url}).length,url);
    assert.ok(reviewProblems({...valid,start:{...valid.start,sourceUrl:url}}).length,url);
  }
  assert.ok(reviewProblems({...valid,start:{...valid.start,sourceTitle:''}},{publish:true}).length);
  assert.ok(reviewProblems({...valid,categories:[]},{publish:true}).length);
  assert.deepEqual(reviewProblems({...valid,categories:[],start:null},{publish:false}),[]);
  assert.deepEqual(reviewProblems({...valid,start:null},{publish:true}),[]);
});

test('institution and pre-2011 start dates require tokenization activity rather than corporate founding',()=>{
  const valid=goodReview();
  assert.ok(reviewProblems({...valid,categories:[{section:'Institutions',name:'Banks'}]}).length);
  assert.ok(reviewProblems({...valid,start:{...valid.start,date:'1999',type:'founding'}}).length);
  assert.ok(reviewProblems(valid,{profile:{industryStartRequired:true}}).length);
  assert.deepEqual(reviewProblems({...valid,categories:[{section:'Institutions',name:'Banks'}],start:{...valid.start,type:'industry_entry'}}),[]);
  for(const date of ['2024','2024-02','2024-02-29','2024-Q1'])assert.deepEqual(reviewProblems({...valid,start:{...valid.start,date}}),[]);
});


test('unfinished drafts can be saved without claiming a publishable sourced date',()=>{
  const partial={...goodReview(),name:'',description:'',categories:[],start:{date:'2024',type:'launch',sourceUrl:'',sourceTitle:''}};
  assert.deepEqual(reviewProblems(partial,{publish:false}),[]);
  assert.ok(reviewProblems(partial,{publish:true}).length>=4);
});


test('admin edits and revision derive from the same inbox snapshot, including rejection rollback',()=>{
  const profile={...company('example','Example',[{section:'Tokenization',name:'Tokenized Asset Issuers'}]),website:'https://example.com'};
  const base={snapshotDate:'2026-10-09',profiles:[profile],sections:[{name:'Tokenization',categories:[{name:'Tokenized Asset Issuers',ids:['example']}]}],statsEvents:[{id:'base-start',profileId:'example',date:'2022',type:'launch',sources:[{title:'Original',url:'https://example.com/original'}]}]};
  const original={id:'review-example',status:'approved',updatedAt:'2026-10-09T09:00:00Z',submission:{email:'private@example.com'},review:{...goodReview(),profileId:'example'}};
  const first=adminSnapshot(base,{revision:'revision-one',submissions:[original]});
  assert.equal(first.revision,'revision-one');
  assert.equal(profileReview(first.data.profiles[0],first.data).start.date,'2024-Q2');
  const newer={...original,updatedAt:'2026-10-09T10:00:00Z',review:{...original.review,start:{...original.review.start,date:'2025-Q3'}}};
  const second=adminSnapshot(base,{revision:'revision-two',submissions:[newer]});
  assert.equal(second.revision,'revision-two');
  assert.equal(profileReview(second.data.profiles[0],second.data).start.date,'2025-Q3');
  assert.equal(first.payload.records[0].review.start.date,'2024-Q2');
  assert.equal(second.submissions[0].submission.email,'private@example.com');
  assert.ok(!JSON.stringify(second.payload).includes('private@example.com'));
  newer.review.start.date='2026-Q4';
  assert.equal(second.payload.records[0].review.start.date,'2025-Q3');
  const rejected=adminSnapshot(base,{revision:'revision-three',submissions:[{...newer,status:'rejected'}]});
  assert.equal(rejected.revision,'revision-three');
  assert.equal(rejected.payload.records.length,0);
  assert.equal(profileReview(rejected.data.profiles[0],rejected.data).start.date,'2022');
  assert.throws(()=>adminSnapshot(base,{submissions:[]}),/incomplete submission list/);
});
