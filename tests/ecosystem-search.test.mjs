import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {filterProfiles,prepareDirectory} from '../assets/ecosystem-model.js';
import {assetsFor,assetOptions} from '../assets/ecosystem-assets.js';
import {applyEcosystemUpdates} from '../assets/ecosystem-updates-model.js';
const data=prepareDirectory(JSON.parse(fs.readFileSync(new URL('../data/ecosystem-directory.json',import.meta.url))));
const state={status:'all',section:'all',q:'',asset:'all'};
const search=(q,extra={},profiles=data.profiles)=>filterProfiles(profiles,{...state,q,...extra},[]);
const ids=rows=>rows.map(p=>p.id);
const profile=extra=>({id:'test',name:'Test Company',description:'',directoryStatus:'current',categories:[],...extra});
test('ecosystem searches combine identity, product aliases, descriptions, domains and recorded asset labels',()=>{
 assert.equal(search('ondo treasury')[0].id,'ondo-finance');
 assert.equal(search('OUSG')[0].id,'ondo-finance');
 assert.equal(search('syrupUSDC')[0].id,'maple-finance');
 assert.equal(search('maple.finance')[0].id,'maple-finance');
 assert.equal(search('centrifuge credit')[0].id,'centrifuge');
 assert.equal(search('Café USA',{},[profile({name:'Café',region:'USA'})]).length,1);
 assert.equal(search('maple irrelevantnonexistent').length,0,'every query word must match');
});
test('common singular/plural and tokenisation variants retrieve equivalent profiles',()=>{
 assert.deepEqual(ids(search('treasury')).sort(),ids(search('treasuries')).sort());
 assert.deepEqual(ids(search('tokenised funds')).sort(),ids(search('tokenized funds')).sort());
 assert.deepEqual(ids(search('stocks')).sort(),ids(search('equities')).sort());
});
test('asset classifications use tags and specific source categories without guessing from general text',()=>{
 assert.deepEqual(assetsFor(profile({assets:['treasuries','funds','funds'],sourceCategory:'Funds'})).map(a=>a.id),['treasuries','funds']);
 assert.equal(assetsFor(profile({sourceCategory:'Real Estate'}))[0].id,'realestate');
 assert.equal(assetsFor(profile({categories:[{section:'Stablecoins',name:'Stablecoin Issuers'}]}))[0].id,'stablecoins');
 assert.deepEqual(assetsFor(profile({description:'Infrastructure supporting gold, stocks and property.',categories:[{section:'Tokenization',name:'Tokenization Platforms'}]})),[]);
 assert.equal(search('gold',{},[profile({assets:['commodities']})]).length,0,'a broad commodity tag does not imply gold');
 assert.equal(search('wine',{},[profile({assets:['collectibles']})]).length,0);
});
test('asset filters intersect search, sectors, status and membership; unclassified profiles remain discoverable',()=>{
 const fixtures=[profile({id:'a',name:'Acme Property',assets:['realestate'],categories:[{section:'Tokenization',name:'Issuers'}]}),profile({id:'b',name:'Beta Property',assets:['realestate'],directoryStatus:'historical'}),profile({id:'c',name:'Acme Fund',assets:['funds']}),profile({id:'d',name:'Not tagged'})];
 assert.deepEqual(ids(filterProfiles(fixtures,{...state,q:'Acme',asset:'realestate',status:'current',section:'Tokenization',members:true},[{name:'Acme Property'}])),['a']);
 assert.deepEqual(ids(search('',{asset:'realestate'},fixtures)),['a','b']);
 assert.deepEqual(ids(search('',{asset:'unclassified'},fixtures)),['d']);
 assert.equal(search('',{},fixtures).length,4);
 assert.equal(assetOptions(fixtures).find(a=>a.id==='realestate').count,2);
 assert.equal(assetOptions(fixtures).find(a=>a.id==='unclassified').count,1);
 assert.ok(search('',{asset:'realestate'}).length>9,'source classifications extend beyond sparse legacy tags');
});
test('approved directory additions participate in search and asset filters',()=>{
 const updated=applyEcosystemUpdates({profiles:[],sections:[],statsEvents:[],snapshotDate:'2026-10-16'},{records:[{id:'new',updatedAt:'2026-10-16',review:{profileId:null,name:'New Project',description:'A new issuer',website:'https://new.example',region:'Europe',directoryStatus:'current',categories:[{section:'Stablecoins',name:'Stablecoin Issuers'}],start:null}}]});
 assert.deepEqual(ids(search('New stablecoins',{asset:'stablecoins'},updated.profiles)),['submitted-new']);
});
