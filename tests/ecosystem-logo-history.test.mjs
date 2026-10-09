import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {safeLogoPath,currentLogo,logoVersions,logoHTML,logoHistoryHTML} from '../assets/ecosystem-logo-model.js';
import {publicDateClueHTML} from '../assets/ecosystem-directory.js';
import {startEvent} from '../assets/ecosystem-stats-model.js';

const current={src:'/ecosystem/example-current.svg',shape:'symbol',background:'light',checkedOn:'2026-10-09',sourceUrl:'https://example.com/brand'};
const earlier={src:'/ecosystem/example-previous.png',shape:'wordmark',background:'dark',recordedOn:'2025-01-01',archivedOn:'2026-10-09',versionLabel:'Previous wordmark',sourceUrl:'https://example.com/old-brand'};
const profile=()=>({name:'Example',id:'example',logo:{...current},logoHistory:[{...earlier}],blockedWebsiteHosts:[]});

test('stored logo paths reject external images, path traversal and executable URLs',()=>{
  assert.equal(safeLogoPath('/ecosystem/company-logo.v2.svg'),'/ecosystem/company-logo.v2.svg');
  assert.equal(safeLogoPath('/ecosystem/archive/company-2025.png'),'/ecosystem/archive/company-2025.png');
  for(const path of ['https://example.com/logo.png','//example.com/logo.svg','/ecosystem/../secret.png','/ecosystem/%2e%2e/logo.png','/ecosystem/%252e%252e/logo.png','/ecosystem/\\example.png','/ecosystem/logo.svg?redirect=https://example.com','/ecosystem/logo.html','/ecosystem/logo.svg#icon','/ecosystem/logo.svg\n','data:image/svg+xml;base64,PHN2Zz4=','javascript:alert(1)',null,{}])assert.equal(safeLogoPath(path),'',String(path));
});

test('current logo preserves member priority while explicit directory updates can supersede it',()=>{
  const p=profile(),member={icon:'/assets/member-icons/example.svg',src:'data:image/png;base64,aGVsbG8='};
  assert.equal(currentLogo(p,member).src,member.icon);
  assert.equal(currentLogo(p,member).origin,'member');
  assert.equal(currentLogo(p,{icon:'javascript:alert(1)',src:member.src}).src,member.src);
  assert.equal(currentLogo(p,{icon:'https://example.com/tracker.png'}).src,current.src);
  p.logo.useForMembers=true;
  assert.equal(currentLogo(p,member).src,current.src);
  p.logo.src='/ecosystem/../bad.svg';
  assert.equal(currentLogo(p,member).src,member.icon);
});

test('history excludes the default and duplicate paths, rejects unsafe records and retains newest-recorded order',()=>{
  const p=profile();
  p.logoHistory=[{...current},{...earlier},{...earlier,versionLabel:'Duplicate'},null,{src:'https://example.com/remote.svg'},{src:'/ecosystem/newer.svg',checkedOn:'2026-01-01'}];
  const before=structuredClone(p),versions=logoVersions(p);
  assert.deepEqual(versions.map(v=>v.src),[current.src,'/ecosystem/newer.svg',earlier.src]);
  assert.deepEqual(versions.map(v=>v.status),['current','archived','archived']);
  assert.deepEqual(p,before,'rendering must not overwrite the newest asset or mutate saved records');
});

test('member artwork remains visibly current without mislabelling the directory version as a former brand',()=>{
  const p=profile();p.logoHistory.push({...current});
  const versions=logoVersions(p,{icon:'/assets/member-icons/example.svg'});
  assert.deepEqual(versions.map(v=>v.status),['current','directory','archived']);
  assert.equal(versions.filter(v=>v.src===current.src).length,1);
  const html=logoHistoryHTML(p,{icon:'/assets/member-icons/example.svg'});
  assert.match(html,/Current logo/);assert.match(html,/Directory artwork/);assert.match(html,/RWAF member roster/);
});

test('reviewed invalid placeholders stay in the data but are excluded from visible history',()=>{
  const p=profile();
  const hidden={src:'/ecosystem/invalid-old-placeholder.png',displayInHistory:false,reviewNote:'Unrelated platform icon, retained only for the record.',versionLabel:'Do not display'};
  p.logoHistory.unshift(hidden);
  const before=structuredClone(p);
  assert.deepEqual(logoVersions(p).map(v=>v.src),[current.src,earlier.src]);
  const html=logoHistoryHTML(p);
  assert.doesNotMatch(html,/invalid-old-placeholder|Do not display|Unrelated platform/);
  assert.match(html,/1 saved version/);assert.deepEqual(p,before);
  p.logoHistory=[hidden];assert.equal(logoHistoryHTML(p),'');
  // History review metadata must never hide a valid current/default asset.
  p.logo.displayInHistory=false;
  assert.equal(currentLogo(p).src,current.src);
  assert.deepEqual(logoVersions(p).map(v=>v.src),[current.src]);
});

test('history is opt-in, labelled, sourced and does not claim review dates are rebrand dates',()=>{
  const p=profile(),html=logoHistoryHTML(p);
  assert.match(html,/^<details class="ec-logo-history"><summary>/);
  assert.doesNotMatch(html,/<details[^>]+\bopen\b/);
  assert.match(html,/Current logo/);assert.match(html,/Archived artwork/);
  assert.match(html,/Recorded <time datetime="2025-01-01">/);
  assert.match(html,/Archived <time datetime="2026-10-09">/);
  assert.match(html,/do not establish when the brand changed/);
  assert.match(html,/href="https:\/\/example.com\/old-brand"/);
  assert.match(html,/alt="Example — archived artwork"/);
  p.logoHistory=[];assert.equal(logoHistoryHTML(p),'');
  p.logoHistory=[{...current}];assert.equal(logoHistoryHTML(p),'');
});

test('unsafe or excluded provenance links never render and labels are HTML escaped',()=>{
  const p=profile();p.name='A <script> & B';p.blockedWebsiteHosts=['example.com'];
  p.logo.sourceUrl='javascript:alert(1)';p.logoHistory[0].sourceUrl='https://sub.example.com/brand';
  p.logoHistory[0].versionLabel='<img src=x onerror=alert(1)>';
  const html=logoHistoryHTML(p);
  assert.doesNotMatch(html,/href=|<script>|<img src=x/);
  assert.match(html,/&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.match(html,/Original source not recorded/);
});

test('artwork keeps original color and contain sizing with no image recoloring',()=>{
  const html=logoHTML(profile(),{...current,treatment:'reverse-paper',background:'dark',shape:'wordmark'});
  assert.match(html,/ec-wordmark ec-logo-dark/);assert.doesNotMatch(html,/reverse|filter|style=/);
  const css=readFileSync(new URL('../assets/ecosystem-directory.css',import.meta.url),'utf8');
  assert.match(css,/object-fit:contain;object-position:center/);
  assert.doesNotMatch(css,/\.ec-logo[^}]*\{[^}]*(?:filter:|mix-blend-mode:)/);
  const fallback=logoHTML({name:'<Example>'},{src:'javascript:alert(1)'});
  assert.doesNotMatch(fallback,/<img/);assert.match(fallback,/>EX<\/span>/);
});

test('public-presence clues disclose their limited meaning without supplying a statistics start date',()=>{
  const p={id:'allo',publicDateClue:{date:'2024',label:'X account opened',note:'Owner-supplied public-presence clue; not a confirmed founding or launch.',sources:[{url:'https://x.com/allo',title:'Profile'}]},blockedWebsiteHosts:[]};
  const html=publicDateClueHTML(p);
  assert.match(html,/X account opened/);assert.match(html,/not a confirmed founding or launch/);
  assert.match(html,/https:\/\/x.com\/allo/);assert.equal(startEvent(p,[]),null);
  p.blockedWebsiteHosts=['x.com'];p.publicDateClue.label='<script>';
  assert.doesNotMatch(publicDateClueHTML(p),/href=|<script>/);
  assert.match(publicDateClueHTML(p),/&lt;script&gt;/);
  assert.equal(publicDateClueHTML({}), '');
});
