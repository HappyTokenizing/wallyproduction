/* ============================================================
   RWA JOB BOARD · ECOSYSTEM SUBMISSIONS · ADMIN CONSOLE
   Prefixes: jb (job board) · se/sub (submissions) · adm (admin)
   ============================================================ */

/* ---------- shared helpers ---------- */
function comingSoon(what){ toast(what+': coming soon','Being finalized for release. Follow @RWAFoundation_ for the announcement.'); }
function escHtml(s){ return String(s==null?'':s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function jbAgo(ts){
  const d=Math.floor((Date.now()-ts)/86400000);
  if(d<=0) return 'Today';
  if(d<7)  return d+'d ago';
  if(d<60) return Math.round(d/7)+'w ago';
  return Math.round(d/30)+'mo ago';
}
function jbSlug(s){ return String(s).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,32)||'entry'; }
function jbMonoLetter(name){ return (String(name).replace(/^the\s+/i,'').trim()[0]||'?').toUpperCase(); }
function jbCopyTxt(btn, txt){
  const done=()=>{ if(btn){ btn.textContent='Copied'; btn.classList.add('did'); setTimeout(()=>{ btn.textContent='Copy'; btn.classList.remove('did'); },1600);} };
  if(navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(txt).then(done).catch(()=>done()); }
  else { const t=document.createElement('textarea'); t.value=txt; document.body.appendChild(t); t.select(); try{ document.execCommand('copy'); }catch(e){} t.remove(); done(); }
}

/* ---------- storage ---------- */
const JB_LS='wally_jobs_v1', ECOSUB_LS='wally_ecosub_v1', ECOADD_LS='wally_ecoadd_v1';
function lsGet(k,f){ try{ const v=JSON.parse(localStorage.getItem(k)); return v==null?f:v; }catch(e){ return f; } }
function lsSet(k,v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
function jbStore(){ return lsGet(JB_LS, {items:[], ovr:{}}); }
function jbSaveStore(s){ lsSet(JB_LS, s); }

/* ---------- job data ---------- */
const JB_SEED=[]; // Only verified employer feeds and reviewed submissions are listed.
/* Reviewed submissions use the project's private store; public reads exclude contact details. */
let JB_REMOTE=[], JB_SYNCED=0, JB_IMPORTED=[], JB_COVERAGE=[], JB_FEED_STATE='loading';
const JB_MAX_AGE=7*86400000;
function jbSync(force){
  if(!force && Date.now()-JB_SYNCED<5*60*1000) return;
  JB_SYNCED=Date.now();
  jbSyncFeed();
  fetch('/api/jobs')
    .then(r=>r.ok?r.json():[])
    .then(data=>{
      JB_REMOTE=(data.jobs||[]).map(r=>({id:r.id,company:r.company,role:r.role,type:r.type||'Full time',
        work:r.work||'Remote',location:r.location||'',comp:r.comp||'',tags:r.tags||[],
        desc:r.description||'',apply:r.apply_to||'',member:r.member?1:0,featured:r.featured?1:0,
        status:'live',ts:Date.parse(r.ts)||Date.now()}));
      if(window.__page==='jobs'&&window.renderJobs) renderJobs(true);
    }).catch(()=>{});
}
function jbAll(){
  const s=jbStore();
  const merge=j=>Object.assign({}, j, s.ovr[j.id]||{});
  const remoteIds=new Set(JB_REMOTE.map(j=>j.id));
  return JB_SEED.filter(j=>!remoteIds.has(j.id)).map(merge)
    .concat(JB_REMOTE.map(merge))
    .concat(JB_IMPORTED.filter(j=>Date.now()-Date.parse(j.checkedAt)<JB_MAX_AGE).map(merge))
    .concat(s.items.filter(j=>!remoteIds.has(j.id)).map(merge)).map(j=>{
      const member=jbIsMember(j.memberName || j.company);
      return {...j,member:member?1:0,featured:member&&RWAFJobRecency.withinDays(j,30)?1:0};
    });
}
function jbLive(){ return jbAll().filter(j=>j.status==='live' && !j.hidden && !(j.id==='rwaf-intern-2026' && j.ts<=Date.parse('2026-07-18T12:00:00Z'))); }
function jbApplyHref(v){
  v=String(v||'').trim();
  if(!v) return '#';
  if(/^https?:\/\//i.test(v)) return v;
  if(v.indexOf('@')>-1 && v.indexOf('/')<0) return 'mailto:'+v+'?subject='+encodeURIComponent('Application via the RWA Job Board');
  return 'https://'+v;
}

function jbMember(name){
  const key=v=>String(v||'').toLowerCase().replace(/[^a-z0-9]/g,'');
  const aliases={maplefinance:'maple',solanafoundation:'solana',stellardevelopmentfoundation:'stellar',avalabs:'avalanche',ixs:'ixswap',drvnlabo:'drvnlab'};
  const wanted=aliases[key(name)]||key(name);
  return logoAll().find(l=>(aliases[key(l.name)]||key(l.name))===wanted);
}
function jbIsMember(name){ return !!jbMember(name); }
function jbLogoHtml(j){
  const member=jbMember(j.memberName || j.company);
  const src=member && (member.icon || member.src);
  return src ? '<span class="jb-logo company-icon"><img src="'+escHtml(src)+'" alt="" loading="lazy" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><span hidden>'+escHtml(jbMonoLetter(j.company))+'</span></span>' : '<span class="jb-logo">'+escHtml(jbMonoLetter(j.company))+'</span>';
}
function jbWhen(j){
  const time=RWAFJobRecency.postedTime(j);
  return time?'Posted '+new Date(time).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'}):'Posting date unavailable';
}
function jbSetDays(value){
  const days=Number(value);if(!RWAFJobRecency.WINDOWS.includes(days))return;
  jbState.days=days;jbState.limit=30;renderJobs();
}
function jbToggleMember(){jbState.member=!jbState.member;jbState.limit=30;renderJobs(true);}
function jbRows(jobs){
  return jobs.slice(0,jbState.limit).map(jbRowHtml).join('')+(jobs.length>jbState.limit?'<button class="btn btn-ghost jb-more" onclick="jbState.limit+=30;renderJobs(true)">Show more roles ('+(jobs.length-jbState.limit)+' remaining)</button>':'');
}
async function jbSyncFeed(){
  try{
    let data;
    try{const r=await fetch('/api/job-feed',{signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error();data=await r.json();JB_FEED_STATE='ready';}
    catch{const r=await fetch('/data/jobs-snapshot.json');if(!r.ok)throw Error();data=await r.json();JB_FEED_STATE='cached';}
    if(!Array.isArray(data.jobs)||!Array.isArray(data.coverage))throw Error();
    JB_IMPORTED=data.jobs.filter(j=>/^import-[a-z0-9-]+$/.test(j.id)&&/^https:\/\//.test(j.apply)&&Date.now()-Date.parse(j.checkedAt)<JB_MAX_AGE);
    JB_COVERAGE=data.coverage;
  }catch{JB_FEED_STATE='unavailable';}
  if(window.__page==='jobs')renderJobs(true);
}
function jbRenderCoverage(){
  const members=logoAll();
  const sources=JB_COVERAGE.slice();
  const known=new Set(sources.map(s=>String(s.memberName||'').toLowerCase().replace(/[^a-z0-9]/g,'')));
  members.forEach(m=>{if(!known.has(m.name.toLowerCase().replace(/[^a-z0-9]/g,'')))sources.push({company:m.name,memberName:m.name,status:'needs-review'});});
  sources.sort((a,b)=>Number(jbIsMember(b.memberName||b.company))-Number(jbIsMember(a.memberName||a.company))||a.company.localeCompare(b.company));
  const active=JB_IMPORTED.filter(j=>Date.now()-Date.parse(j.checkedAt)<JB_MAX_AGE);
  const visible=active.filter(j=>RWAFJobRecency.withinDays(j,jbState.days));
  const companies=new Set(visible.map(j=>j.company)).size;
  const undated=active.filter(j=>!RWAFJobRecency.postedTime(j)).length;
  $('#jbFeedStatus').textContent=JB_FEED_STATE==='loading'?'Checking employer listings…':JB_FEED_STATE==='unavailable'?'Employer feeds are unavailable. Please try again later.':companies+' employers with roles in this window · '+undated+' undated roles excluded · '+(JB_FEED_STATE==='cached'?'Saved listings shown; live refresh unavailable.':'Application details and eligibility are set by each employer.');
  $('#jbCoverageTitle').textContent='Company coverage · '+members.length+' RWAF members + '+sources.filter(s=>!jbIsMember(s.memberName||s.company)).length+' other RWA employers';
  $('#jbCoverageGrid').innerHTML=sources.map(s=>{
    const companyJobs=active.filter(j=>j.sourceId===s.id);
    const count=companyJobs.filter(j=>RWAFJobRecency.withinDays(j,jbState.days)).length;
    const unknown=companyJobs.filter(j=>!RWAFJobRecency.postedTime(j)).length;
    const day=s.checkedAt?new Date(s.checkedAt).toLocaleDateString('en-US',{month:'short',day:'numeric'}):'';
    const status=count?count+' '+(count===1?'role':'roles')+' within '+jbState.days+' days':companyJobs.length?'No dated roles within '+jbState.days+' days':(s.status==='unavailable'?'Feed unavailable':s.status==='needs-review'?'Awaiting review':'No verified public vacancy');
    const label=s.url&&/^https:\/\//.test(s.url)?'<a href="'+escHtml(s.url)+'" target="_blank" rel="noopener noreferrer">'+escHtml(s.company)+'</a>':escHtml(s.company);
    return '<div class="jb-company">'+label+(jbIsMember(s.memberName||s.company)?' · <b>RWAF Member</b>':'')+'<small>'+status+(unknown?' · '+unknown+' undated excluded':'')+(day?' · Checked '+day:'')+(s.status==='cached'?' · Saved results; refresh unavailable':s.status==='manual'?' · Manually reviewed':'')+'</small></div>';
  }).join('');
}

/* ---------- job board rendering ---------- */
const JB_TYPES=['All','Full time','Part time','Contract','Internship'];
const jbState={q:'', type:'All', remote:false, member:false, limit:30, days:30};
const jbRot={i:0, timer:null, items:[]};
function jbSetQ(v){ jbState.q=v.trim().toLowerCase(); jbState.limit=30; renderJobs(true); }
function jbSetType(t){ jbState.type=t; jbState.limit=30; renderJobs(true); }
function jbToggleRemote(){ jbState.remote=!jbState.remote; jbState.limit=30; renderJobs(true); }
function jbMatch(j){
  if(!RWAFJobRecency.withinDays(j,jbState.days))return false;
  if(jbState.type!=='All' && j.type!==jbState.type) return false;
  if(jbState.remote && !/remote/i.test(j.work)) return false;
  if(jbState.member && !j.member) return false;
  if(jbState.q){
    const h=(j.role+' '+j.company+' '+j.location+' '+(j.tags||[]).join(' ')).toLowerCase();
    if(h.indexOf(jbState.q)<0) return false;
  }
  return true;
}
function jbChipsHtml(){
  const c=JB_TYPES.map(t=>'<button class="jb-chip'+(jbState.type===t?' on':'')+'" onclick="jbSetType(\''+t+'\')">'+t+'</button>').join('');
  return c+'<button class="jb-chip'+(jbState.remote?' on':'')+'" onclick="jbToggleRemote()">Remote</button>'
    +'<button class="jb-chip'+(jbState.member?' on':'')+'" onclick="jbToggleMember()">RWAF Member</button>';
}
function jbBadges(j){
  let b='';
  if(j.featured) b+='<span class="jb-badge">RWAF Member &middot; Featured</span>';
  else if(j.member) b+='<span class="jb-badge mem">RWAF Member</span>';
  return b;
}
function jbRowHtml(j){
  const tags=(j.tags||[]).slice(0,4).map(t=>'<span class="jb-tag">'+escHtml(t)+'</span>').join('');
  return '<button class="jb-row'+(j.featured?' feat':'')+'" onclick="jbOpenJob(\''+escHtml(encodeURIComponent(j.id).replace(/'/g,'%27'))+'\')">'
    +jbLogoHtml(j)
    +'<span class="jb-main"><span class="jb-role">'+escHtml(j.role)+' '+jbBadges(j)+'</span>'
    +'<span class="jb-meta">'+escHtml(j.company)+'<span class="sep">&middot;</span>'+escHtml(j.type)+'<span class="sep">&middot;</span>'+escHtml(j.work)+'<span class="sep">&middot;</span>'+escHtml(j.location)+'</span>'
    +(tags?'<span class="jb-tags">'+tags+'</span>':'')+'</span>'
    +'<span class="jb-side">'+(j.comp?'<span class="jb-comp">'+escHtml(j.comp)+'</span>':'')+'<span class="jb-ago">'+jbWhen(j)+'</span></span></button>';
}
function jbSpotHtml(j, n){
  const controls='<div class="jb-spot-nav"><button type="button" aria-label="Previous featured role" onclick="jbStep(-1)"'+(n<2?' disabled':'')+'>&larr;</button><span aria-live="polite">'+(jbRot.i+1)+' / '+n+'</span><button type="button" aria-label="Next featured role" onclick="jbStep(1)"'+(n<2?' disabled':'')+'>&rarr;</button></div>';
  return '<div class="jb-spot jb-fade" onmouseenter="jbHold=true" onmouseleave="jbHold=false" onfocusin="jbHold=true" onfocusout="jbHold=false">'+controls
    +'<span class="jb-spot-eyebrow"><span class="dot"></span>RWAF Member &middot; Featured role</span>'
    +'<h3>'+escHtml(j.role)+'</h3><div class="jb-spot-co">'+jbLogoHtml(j)+escHtml(j.company)+' &middot; '+escHtml(j.type)+' &middot; '+escHtml(j.work)+' &middot; '+escHtml(j.location)+'</div>'
    +'<p class="jb-spot-desc">'+escHtml(j.desc)+'</p>'
    +'<div class="jb-spot-foot"><button class="btn btn-orange btn-sm" onclick="jbOpenJob(\''+escHtml(encodeURIComponent(j.id).replace(/'/g,'%27'))+'\')">View role</button>'
    +(j.comp?'<span class="jb-comp">'+escHtml(j.comp)+'</span>':'')+'<span class="jb-ago">'+jbWhen(j)+'</span></div></div>';
}
let jbHold=false;
function jbRenderSpot(){
  const items=jbRot.items;
  $('#jbSpotMount').innerHTML=items.length?jbSpotHtml(items[jbRot.i],items.length):'';
}
function renderJobs(keepRot){
  const chips=$('#jbChips'); if(!chips) return;
  chips.innerHTML=jbChipsHtml();
  $('#jbRecency').value=String(jbState.days);
  jbRenderCoverage();
  const hits=jbLive().filter(jbMatch).sort(RWAFJobRecency.newest);
  const previous=keepRot?jbRot.items[jbRot.i]?.id:null;
  jbRot.items=RWAFJobRecency.featured(hits);
  const index=jbRot.items.findIndex(j=>j.id===previous);jbRot.i=index<0?0:index;
  jbRenderSpot();
  $('#jbCount').textContent=hits.length+(hits.length===1?' open role':' open roles')+' · Posted within '+jbState.days+' days · Newest first';
  $('#jbList').innerHTML=hits.length?jbRows(hits):'<div class="jb-empty"><b>No recent roles match.</b><p>Try a wider posting window or clear the filters. Jobs without a verified posting date are excluded.</p><button class="btn btn-ghost btn-sm" onclick="jbReset()">Clear filters</button></div>';
  jbStartRotation();
}
function jbStartRotation(){
  jbPause();
  if(jbRot.items.length>1&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
    jbRot.timer=setInterval(()=>{if(!jbHold&&!document.hidden)jbStep(1,false);},6500);
  }
}
function jbStep(direction,manual=true){
  if(jbRot.items.some(j=>!RWAFJobRecency.withinDays(j,30))){renderJobs(true);return;}
  if(jbRot.items.length<2)return;
  jbRot.i=(jbRot.i+direction+jbRot.items.length)%jbRot.items.length;
  jbRenderSpot();
  if(manual){jbStartRotation();$('#jbSpotMount button[aria-label="'+(direction<0?'Previous':'Next')+' featured role"]')?.focus();}
}
function jbGo(k){if(k>=0&&k<jbRot.items.length){jbRot.i=k;jbRenderSpot();jbStartRotation();}}
function jbReset(){ jbState.q=''; jbState.type='All'; jbState.remote=false; jbState.member=false; jbState.limit=30; jbState.days=30; const q=$('#jbQ'); if(q) q.value=''; renderJobs(); }
function jbPause(){ if(jbRot.timer){ clearInterval(jbRot.timer); jbRot.timer=null; } }

/* ---------- job detail ---------- */
function jbOpenJob(id){
  const j=jbLive().find(x=>x.id===decodeURIComponent(id)); if(!j) return;
  $('#jvTitle').textContent=j.role;
  $('#jvBody').innerHTML='<div class="jb-meta" style="margin-bottom:12px">'+escHtml(j.company)+'<span class="sep">&middot;</span>'+escHtml(j.type)+'<span class="sep">&middot;</span>'+escHtml(j.work)+'<span class="sep">&middot;</span>'+escHtml(j.location)+'</div>'
    +(j.featured||j.member?'<div style="margin-bottom:12px">'+jbBadges(j)+'</div>':'')
    +'<p style="font-size:14.5px;line-height:1.7;color:var(--text2);white-space:pre-line">'+escHtml(j.desc)+'</p>'
    +((j.tags||[]).length?'<div class="jb-tags" style="margin-top:14px">'+j.tags.map(t=>'<span class="jb-tag">'+escHtml(t)+'</span>').join('')+'</div>':'');
  $('#jvMeta').textContent=(j.comp?j.comp+' · ':'')+jbWhen(j);
  if(j.imported) $('#jvBody').insertAdjacentHTML('beforeend','<p class="jb-source-note">Listed on <a target="_blank" rel="noopener noreferrer" href="'+escHtml(j.sourceUrl)+'">'+escHtml(j.company)+' careers</a>. Confirm availability and full details with the employer.</p>');
  $('#jvApply').href=jbApplyHref(j.apply);
  openModal('mJobView');
}

/* ---------- post a job ---------- */
function openPostJob(){ $('#postJobForm').hidden=false; $('#postJobOk').hidden=true; $('#postJobFoot').lastElementChild.hidden=false; openModal('mPostJob'); }
function pjVal(id){ return ($('#'+id).value||'').trim(); }
function pjMark(id, bad){ $('#'+id).closest('.field').classList.toggle('f-err', !!bad); return !bad; }
let pjSending=false;
async function submitJob(){
  if(pjSending)return;
  const co=pjVal('pjCo'), role=pjVal('pjRole'), loc=pjVal('pjLoc'), desc=pjVal('pjDesc'), apply=pjVal('pjApply'), email=pjVal('pjEmail');
  let ok=true;
  ok=pjMark('pjCo',!co)&&ok; ok=pjMark('pjRole',!role)&&ok; ok=pjMark('pjLoc',!loc)&&ok;
  ok=pjMark('pjDesc',desc.length<40)&&ok; ok=pjMark('pjApply',!apply)&&ok; ok=pjMark('pjEmail',!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))&&ok;
  if(!ok){ jbShowErrs('mPostJob','Check the highlighted fields. The role description needs at least 40 characters.'); return; }
  const item={ id:'u-'+Date.now(), company:co, role:role, type:pjVal('pjType')||'Full time', work:pjVal('pjWork')||'Remote',
    location:loc, comp:pjVal('pjComp'), tags:pjVal('pjTags').split(',').map(t=>t.trim()).filter(Boolean).slice(0,4),
    desc:desc, apply:apply, email:email, member:$('#pjMember').checked?1:0, featured:0, status:'pending', src:'site', ts:Date.now() };
  pjSending=true;
  const button=$('#postJobFoot').lastElementChild;button.disabled=true;button.textContent='Submitting…';
  try{
    const r=await fetch('/api/jobs',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({action:'submit',job:{company:co,role:role,type:item.type,work:item.work,
        location:loc,comp:item.comp,tags:item.tags,description:desc,apply_to:apply,email:email,member:item.member,website:pjVal('pjWebsite')}})});
    const data=await r.json().catch(()=>({}));
    if(!r.ok||!data.ok)throw Error(r.status===429?'Too many attempts. Please wait a minute and retry.':data.error||'Could not submit. Please retry.');
    $('#postJobForm').hidden=true;$('#postJobOk').hidden=false;
    $('#postJobOk').innerHTML='<div class="sub-ok"><h5>Listing queued for review</h5><p>Your listing was received. A confirmation email will be sent to the address you provided. The RWA Foundation team is reviewing it internally and will reach back out. We will also email you when your listing is published.</p></div>';
    button.hidden=true;toast('Listing received','Queued for review.');
  }catch(e){toast('Listing not submitted',e.message);}
  finally{pjSending=false;button.disabled=false;button.textContent='Submit listing';}
}

/* ---------- ecosystem submissions: private server-side review queue ---------- */
let seSending=false;
function openSubmitEco(){
  if(seSending)return;
  $('#subEcoForm').hidden=false;$('#subEcoOk').hidden=true;
  $('#subEcoFoot').lastElementChild.hidden=false;openModal('mSubmitEco');
}
async function submitEco(){
  if(seSending)return;
  const submission={name:pjValById('seName'),description:pjValById('seBlurb'),type:pjValById('seType'),region:pjValById('seRegion'),website:pjValById('seUrl'),email:pjValById('seEmail'),websiteConfirm:pjValById('seWebsiteConfirm')};
  let validURL=false;
  try{const u=new URL(submission.website);validURL=u.protocol==='https:'&&!u.username&&!u.password&&u.hostname.includes('.');}catch(e){}
  let ok=true;
  ok=pjMark('seName',!submission.name)&&ok;ok=pjMark('seBlurb',!submission.description)&&ok;
  ok=pjMark('seType',!submission.type)&&ok;ok=pjMark('seRegion',!submission.region)&&ok;
  ok=pjMark('seUrl',!validURL)&&ok;
  ok=pjMark('seEmail',!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(submission.email))&&ok;
  if(!ok){jbShowErrs('mSubmitEco','Check the highlighted fields and use a full HTTPS website URL.');return;}
  const button=$('#subEcoFoot').lastElementChild;
  seSending=true;button.disabled=true;button.textContent='Submitting…';
  try{
    const r=await fetch('/api/ecosystem',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'submit',submission}),signal:AbortSignal.timeout(20000)});
    const result=await r.json().catch(()=>({}));
    if(!r.ok||!result.ok)throw Error(r.status===429?'Too many attempts. Please wait and retry.':result.error||'The server did not confirm receipt. Keep this form open and retry.');
    $('#subEcoForm').hidden=true;$('#subEcoOk').hidden=false;
    $('#subEcoOk').innerHTML='<div class="sub-ok"><h5>Project queued for review</h5><p>Your project was received. A confirmation email will be sent to the address you provided. The RWA Foundation team is reviewing it internally and will reach back out. We will also email you when your project is added to the directory. Your contact email stays private.</p></div>';
    button.hidden=true;toast('Project received','Queued for admin review.');
  }catch(e){toast('Project not submitted',e.name==='TimeoutError'?'The request timed out. Keep the form open and retry.':e.message);}
  finally{seSending=false;button.disabled=false;button.textContent='Submit';}
}
function pjValById(id){return ($('#'+id).value||'').trim();}
function jbShowErrs(mid,msg){
  const f=document.querySelector('#'+mid+' .field.f-err');
  if(f)f.scrollIntoView({behavior:'smooth',block:'center'});
  toast('Almost there',msg||'Check the highlighted fields.');
}

/* ---------- ecosystem local additions: merge at boot ---------- */
(function(){
  try{
    lsGet(ECOADD_LS,[]).forEach(e=>{ if(e && e.id && !ECO.some(x=>x.id===e.id)) ECO.push(e); });
  }catch(e){}
})();

/* ---------- admin console ---------- */
const ADM_HASH='c544ce7c40eab55c481233a301356ecd1f7a7c5adce93d1aa4906f7886482ce9';
const ADM_TABS=[['logos','Member logos'],['news','News feed'],['jobs','Job submissions'],['ecosystem','Ecosystem'],['membership','Membership applications']];
let admTabNow='logos';

/* ---------- member logo manager: the console's only job ---------- */
const LOGO_LS='wally_logos_v1';
/* Snapshot the logos baked into the page BEFORE any re-render overwrites them. */
const LOGO_DEFAULTS=window.RWAF_MEMBER_DEFAULTS||[...document.querySelectorAll('#page-foundation .logowall .lw-grid .lw-tile')].map(function(el,i){
  const im=el.querySelector('img');
  return im ? {id:'d'+i, name:(im.getAttribute('alt')||'').trim()||('Member logo '+(i+1)), src:im.getAttribute('src')}
            : {id:'d'+i, name:el.textContent.trim()||('Member logo '+(i+1)), word:1};
});
const LOGO_DRAFT='wally_logos_draft_v2';
let lgState=lsGet(LOGO_LS,{order:[],del:[],add:[]});
let lgRevision=null, lgReady=false, lgSaving=false, lgConflict=false, lgError='';
let lgEdit=0, lgSaved=0, lgLoading=null;
let lgRecovery=lsGet(LOGO_DRAFT,null);
function lgStore(){ return JSON.parse(JSON.stringify(lgState)); }
function lgCache(s){ try{ localStorage.setItem(LOGO_LS,JSON.stringify(s)); }catch(e){} }
function lgSave(s){
  lgState=s; lgEdit++; lgError=''; lgCache(s);
  lgRecovery={store:s,revision:lgRevision};
  try{ localStorage.setItem(LOGO_DRAFT,JSON.stringify(lgRecovery)); }
  catch(e){ lgError='Browser backup is full. Keep this page open until the server confirms the save.'; }
}
function lgCustomized(){ const s=lgStore(); return !!(s.order.length||s.del.length||s.add.length||Object.keys(s.icons||{}).length); }
function logoAll(){
  const s=lgStore();
  const base=LOGO_DEFAULTS.filter(l=>s.del.indexOf(l.id)<0).concat(s.add);
  const pos=id=>{ const i=s.order.indexOf(id); return i<0?1e9:i; };
  return base.map(l=>({...l,icon:(s.icons||{})[l.id] || (window.MEMBER_ICONS||{})[l.name.toLowerCase().replace(/[^a-z0-9]/g,'')] || ''})).sort((a,b)=>pos(a.id)-pos(b.id));
}
function renderLogoWall(){
  window.__rwafRoster=logoAll();
  const grid=document.querySelector('#page-foundation .logowall .lw-grid');
  if(grid) grid.innerHTML=logoAll().map(l=> l.word
    ? '<div class="lw-tile word">'+escHtml(l.name)+'</div>'
    : '<div class="lw-tile"><img src="'+escHtml(l.src)+'" alt="'+escHtml(l.name)+'"></div>').join('');
  if(window.buildLogoMarquee) buildLogoMarquee();
  if(window.nwSyncMembers) nwSyncMembers(logoAll());
  if(window.__page==='jobs' && window.renderJobs) renderJobs(true);
  document.querySelector('#ecoMount')?.__ecosystem?.refresh();
}
renderLogoWall();
function lgStatus(){
  const el=$('#lgStatus'); if(!el) return;
  el.textContent=lgSaving?'Saving changes…':lgError||(lgReady?(lgEdit>lgSaved?'Unsaved changes — click Save changes to publish.':(lgSaved?'Changes saved. The member list is live.':'No unsaved changes.')):'Loading saved logos…');
  const save=$('#lgSaveChanges');
  if(save){save.disabled=!lgReady||lgSaving||lgConflict||lgEdit===lgSaved;save.textContent=lgSaving?'Saving…':'Save changes';}
  const retry=$('#lgRetry'); if(retry) retry.hidden=lgSaving||!lgError;
  const load=$('#lgLoad'); if(load) load.hidden=!lgConflict;
  const recovery=$('#lgRecoveryNotice'); if(recovery) recovery.hidden=!lgRecovery||lgSaving||lgEdit>lgSaved;
}
function lgFetchRemote(){
  if(lgLoading) return lgLoading;
  lgLoading=lgReadRemote().finally(()=>{lgLoading=null;});
  return lgLoading;
}
async function lgReadRemote(){
  if(lgSaving||lgEdit>lgSaved) return;
  const edit=lgEdit;
  try{
    const r=await fetch('/api/logos',{cache:'no-store'});
    const d=await r.json();
    if(!r.ok) throw new Error(d.error||'Could not load saved logos.');
    if(!d.store||!Array.isArray(d.store.add)||!Array.isArray(d.store.order)||!Array.isArray(d.store.del)||!('revision' in d)) throw new Error('Please refresh the page to load the updated logo manager.');
    if(edit!==lgEdit) return;
    // Preserve older browser-only uploads for explicit recovery, never publish them silently.
    if(!lgRecovery&&d.revision===null&&lgCustomized()){
      lgRecovery={store:lgStore(),revision:null};
      try{ localStorage.setItem(LOGO_DRAFT,JSON.stringify(lgRecovery)); }catch(e){}
    }
    lgState=d.store; lgRevision=d.revision; lgReady=true; lgConflict=false; lgError=''; lgCache(lgState);
    renderLogoWall();
    if(window.__page==='admin'&&admTabNow==='logos') admPaintLogos();
  }catch(e){ lgError=e.message+' Your browser copy is kept; editing is paused until storage is available.'; }
  lgStatus();
}
lgFetchRemote();
window.nwRefreshMembers=lgFetchRemote;
window.refreshMembers=lgFetchRemote;
// Refresh after another tab saves or the visitor returns to an already-open page.
window.addEventListener('storage',function(e){if(e.key===LOGO_LS)lgFetchRemote();});
window.addEventListener('focus',function(){if(['home','foundation','jobs','news','admin'].includes(window.__page))lgFetchRemote();});
function admPw(){ try{ return sessionStorage.getItem('wally_adm_pw')||''; }catch(e){ return ''; } }
async function lgPush(){
  if(!lgReady||lgSaving||lgConflict) return;
  lgSaving=true; lgStatus();
  try{
    // One request at a time. Rapid reorders are coalesced behind the current save.
    while(lgSaved<lgEdit){
      const edit=lgEdit, store=lgStore();
      const r=await fetch('/api/logos',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pw:admPw(),store:store,revision:lgRevision})});
      let d; try{ d=await r.json(); }catch(e){ throw new Error('Server did not confirm the save. Keep this page open and retry.'); }
      if(!r.ok||!d.ok){ lgConflict=r.status===409; throw new Error(d.error||'Save failed. Please retry.'); }
      lgRevision=d.revision; lgSaved=edit; lgError='';
    }
    lgRecovery=null;
    try{ localStorage.removeItem(LOGO_DRAFT); }catch(e){}
  }catch(e){ lgError=e.message; toast('Changes not saved',lgError); }
  finally{ lgSaving=false; lgStatus(); }
}
function lgCanEdit(){
  if(lgReady&&!lgConflict&&!lgSaving) return true;
  if(lgSaving){toast('Saving changes','Wait for the current save to finish.');return false;}
  toast('Logos not ready',lgError||'Wait for saved logos to load.'); return false;
}
function lgRetry(){ if(lgConflict) return lgLoadLatest(); if(!lgReady) return lgFetchRemote(); return lgPush(); }
async function lgLoadLatest(){
  if(lgSaving) return;
  if(lgEdit>lgSaved&&!confirm('Load the current server version? Your unsaved browser copy will remain available to restore.')) return;
  lgEdit=lgSaved; lgReady=false; await lgFetchRemote();
}
function lgRestoreDraft(){
  if(!lgCanEdit()||!lgRecovery) return;
  if(!confirm('Restore the saved browser copy for review? Click Save changes to publish it.')) return;
  lgSave(JSON.parse(JSON.stringify(lgRecovery.store)));
  renderLogoWall(); admPaintLogos();
}
window.addEventListener('beforeunload',function(e){ if(lgSaving||lgEdit>lgSaved){ e.preventDefault(); e.returnValue=''; } });
function admOk(){ try{ return sessionStorage.getItem('wally_adm_ok')==='1'; }catch(e){ return false; } }
async function admSha(s){
  const b=await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,'0')).join('');
}
function admLock(){ return lsGet('wally_adm_lock',{n:0,until:0}); }
async function admLogin(){
  const lock=admLock();
  if(Date.now()<lock.until){ $('#admErr').textContent='Locked. Try again in '+Math.ceil((lock.until-Date.now())/1000)+'s.'; return; }
  const v=$('#admPw').value||'';
  let h=''; try{ h=await admSha(v); }catch(e){ $('#admErr').textContent='This browser blocks crypto here. Open the site over https.'; return; }
  if(h===ADM_HASH){
    lsSet('wally_adm_lock',{n:0,until:0});
    try{ sessionStorage.setItem('wally_adm_ok','1'); sessionStorage.setItem('wally_adm_pw', v); }catch(e){}
    renderAdmin();
  } else {
    lock.n=(lock.n||0)+1;
    if(lock.n>=3){ lock.until=Date.now()+30000; lock.n=0; }
    lsSet('wally_adm_lock',lock);
    $('#admErr').textContent=lock.until>Date.now()?'Three misses. Locked for 30 seconds.':'Wrong password.';
    $('#admPw').value='';
  }
}
function admLogout(){ try{ sessionStorage.removeItem('wally_adm_ok'); sessionStorage.removeItem('wally_adm_pw'); }catch(e){} renderAdmin(); }
function renderAdmin(){
  const M=$('#admMount'); if(!M) return;
  $('#admBody')?.__ecosystemAdminCleanup?.();admEcoCleanup?.();admEcoCleanup=null;
  if(!admOk()){
    M.innerHTML='<div class="adm-gate"><div class="adm-lock"><svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="9" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg></div>'
      +'<h3>RWA Foundation console</h3><p>For the team. Enter the console password.</p>'
      +'<div class="field" style="margin-bottom:8px"><input id="admPw" type="password" placeholder="Password" onkeydown="if(event.key===\'Enter\')admLogin()"></div>'
      +'<button class="btn btn-orange" style="width:100%" onclick="admLogin()">Unlock</button><div class="adm-err" id="admErr"></div></div>';
    setTimeout(()=>{ const p=$('#admPw'); p&&p.focus(); },60);
    return;
  }
  const tabs=ADM_TABS.map(t=>'<button class="adm-tab'+(admTabNow===t[0]?' on':'')+'" onclick="admGoTab(\''+t[0]+'\')">'+t[1]+'</button>').join('');
  M.innerHTML='<div class="adm-head"><div class="adm-tabs">'+tabs+'</div>'
    +'<div class="adm-tools">'+(admTabNow==='logos'?'<button class="adm-btn" onclick="admLogoReset()">Reset to defaults</button>':'')+'<button class="adm-btn" onclick="admLogout()">Sign out</button></div></div>'
    +'<p class="adm-note">'+(admTabNow==='logos'
      ?'Member logos: reorder, upload or delete below. The foundation logo wall, homepage banner and RWAF Members news tags update together. Use the organization’s name for each logo so its stories can be matched. Check the save status below to confirm your changes are published for all visitors.'
      :admTabNow==='membership'?'Review membership applications privately. Confirmations are queued when applications are received.':admTabNow==='ecosystem'?'Review directory submissions and edit sourced company dates. Approved changes update the directory and charts together. Earlier Google Form responses remain in the original form.':admTabNow==='jobs'?'Review employer submissions before approving them. Contact emails are private. Closing a role removes it from the public board.': 'The site pulls rwanews.today hourly. Delete a story to remove it from the feed for every visitor; you can restore it any time.')
    +'</p><div id="admBody"></div>';
  if(admTabNow==='logos') admPaintLogos(); else if(admTabNow==='jobs') admPaintJobs(); else if(admTabNow==='ecosystem') admPaintEcosystem(); else if(admTabNow==='membership') admPaintMembership(); else admPaintNews();
}
let admEcoCleanup=null,admEcoRequest=0;
async function admPaintEcosystem(){
  const body=$('#admBody'),request=++admEcoRequest;body.textContent='Loading ecosystem manager…';
  try{
    const {mountEcosystemAdmin}=await import('/assets/ecosystem-admin.js');
    if(admTabNow!=='ecosystem'||!body.isConnected||request!==admEcoRequest)return;
    const cleanup=await mountEcosystemAdmin(body,{getPassword:admPw,onPublished:async()=>{
      await document.querySelector('#ecoMount')?.__ecosystem?.reload(true);
    }});
    if(admTabNow!=='ecosystem'||!body.isConnected||request!==admEcoRequest){if(typeof cleanup==='function')cleanup();return;}
    admEcoCleanup=typeof cleanup==='function'?cleanup:null;
  }catch(e){if(body.isConnected&&admTabNow==='ecosystem')body.textContent='The ecosystem manager could not load. Select Ecosystem to retry.';}
}
async function admPaintMembership(){
 const body=$('#admBody');body.textContent='Loading membership applications…';
 try{const {mountMembershipAdmin}=await import('/assets/membership-admin.js');if(admTabNow==='membership'&&body.isConnected)await mountMembershipAdmin(body,{getPassword:admPw});}
 catch(e){if(body.isConnected)body.textContent='Could not load membership applications. Select the tab to retry.';}
}
function submissionEmailStatus(row){return Object.entries(row.notifications||{}).map(([name,email])=>name+': '+(email.status==='sent'?'sent':email.status==='review'?'delivery needs review':email.error?'queued — '+email.error:'queued')).join(' · ')||'No confirmation email recorded';}
let admJobsRevision=null;
async function admPaintJobs(){
  const B=$('#admBody');B.textContent='Loading submissions…';
  try{
    const r=await fetch('/api/jobs',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'list_all',pw:admPw()})});
    const data=await r.json();if(!r.ok)throw Error(data.error||'Could not load submissions.');
    if(admTabNow!=='jobs')return;admJobsRevision=data.revision;
    B.innerHTML='<button class="adm-btn" onclick="admPaintJobs()">Refresh submissions</button>'+data.jobs.slice().reverse().map(j=>
      '<div class="adm-empty" style="text-align:left;margin-top:16px"><b>'+escHtml(j.role)+' · '+escHtml(j.company)+'</b><p>'+escHtml(j.status)+' · '+escHtml(j.email)+' · '+escHtml(j.location)+'</p><p style="white-space:pre-wrap">'+escHtml(j.description)+'</p><p>Apply: '+escHtml(j.apply_to)+'</p><p class="membership-mail">Emails: '+escHtml(submissionEmailStatus(j))+'</p><button class="adm-btn" onclick="admModerateJob(\''+j.id+'\',\'live\')">Approve</button> <button class="adm-btn" onclick="admModerateJob(\''+j.id+'\',\'closed\')">Close / reject</button></div>'
    ).join('')+(data.jobs.length?'':'<p>No submissions yet.</p>');
  }catch(e){if(admTabNow==='jobs')B.textContent=e.message;}
}
async function admModerateJob(id,status){
  try{
    const r=await fetch('/api/jobs',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'moderate',id,status,revision:admJobsRevision,pw:admPw()})});
    const data=await r.json();if(!r.ok)throw Error(data.error||'Could not save.');
    toast('Listing updated',status==='live'?'Approved for publication.':'Removed from the public board.');await admPaintJobs();jbSync(true);
  }catch(e){toast('Not saved',e.message);}
}
function admGoTab(t){ admTabNow=t; renderAdmin(); }
function admPaintLogos(){
  const B=$('#admBody'); if(!B) return;
  const list=logoAll();
  const row=(l,i)=>'<div class="adm-row"><span style="flex:none;width:110px;height:44px;display:flex;align-items:center;justify-content:center;background:var(--bg2);border:1px solid var(--line);border-radius:10px;padding:4px 10px;overflow:hidden">'
    +(l.word?'<b style="font-size:13px;white-space:nowrap">'+escHtml(l.name)+'</b>':'<img src="'+l.src+'" alt="" style="max-height:26px;max-width:100%;width:auto">')
    +'</span><div class="who"><b>'+escHtml(l.name)+'</b><span>Position '+(i+1)+' of '+list.length+(l.id.charAt(0)==='u'?' &middot; uploaded here':'')+'</span></div>'
    +'<div class="lg-icon-control"><span class="lg-icon-preview">'+(l.icon?'<img src="'+escHtml(l.icon)+'" alt="'+escHtml(l.name)+' icon">':'<span>No icon</span>')+'</span><label class="adm-btn lg-icon-upload">'+((lgState.icons||{})[l.id]?'Replace icon':'Upload icon')+'<input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" aria-label="Upload icon for '+escHtml(l.name)+'" onchange="admLogoIconUpload(\''+l.id+'\',this)"></label>'+((lgState.icons||{})[l.id]?'<button class="adm-btn" onclick="admLogoIconReset(\''+l.id+'\')">Reset icon</button>':'')+'</div>'
    +'<div class="adm-acts">'
    +(i===0?'<button class="adm-btn" disabled style="opacity:.35">&uarr; Up</button>':'<button class="adm-btn" onclick="admLogoMove(\''+l.id+'\',-1)">&uarr; Up</button>')
    +(i===list.length-1?'<button class="adm-btn" disabled style="opacity:.35">&darr; Down</button>':'<button class="adm-btn" onclick="admLogoMove(\''+l.id+'\',1)">&darr; Down</button>')
    +'<button class="adm-btn danger" onclick="admLogoDel(\''+l.id+'\')">Delete</button></div></div>';
  B.innerHTML='<div class="adm-sec"><div class="lg-save-bar"><p id="lgStatus" role="status" aria-live="polite"></p><button id="lgSaveChanges" class="btn btn-orange btn-sm" onclick="lgPush()" disabled>Save changes</button></div><button id="lgRetry" class="adm-btn" onclick="lgRetry()" hidden>Retry</button><button id="lgLoad" class="adm-btn" onclick="lgLoadLatest()" hidden>Load latest logos</button>'
    +(lgRecovery?'<p id="lgRecoveryNotice">A browser copy is available. <button class="adm-btn" onclick="lgRestoreDraft()">Restore browser copy</button></p>':'')
    +'<p class="adm-note">The wide logo is used on the member wall. Upload a square company symbol for the job board. Changes preview here until you click Save changes. Saved icons follow this member everywhere on the board. Deleting a member removes their logos and member badges throughout the site; their jobs remain as regular listings.</p>'
    +'<h6>Logos on the wall ('+list.length+')</h6>'
    +(list.map(row).join('')||'<div class="adm-empty">No logos on the wall. Upload one below, or reset to the defaults.</div>')
    +'<h6>Upload a logo</h6>'
    +'<div class="adm-form">'
    +'<div class="field"><label>Company name</label><input id="lgName" maxlength="48" placeholder="Company name"></div>'
    +'<div class="field"><label>Logo image &middot; PNG, JPG, WebP or SVG</label><input id="lgFile" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml"></div>'
    +'<div class="field"><label>Job board icon &middot; optional</label><input id="lgIconFile" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml"><span class="fhint">A square symbol works best. PNG, JPG, WebP or SVG.</span></div>'
    +'<button id="lgUpload" class="btn btn-orange btn-sm" onclick="admLogoUpload()">Add to the wall</button>'
    +'</div></div>';
  lgStatus();
}
function admLogoMove(id,dir){
  if(!lgCanEdit()) return;
  const ids=logoAll().map(l=>l.id);
  const i=ids.indexOf(id), j=i+dir;
  if(i<0||j<0||j>=ids.length) return;
  ids.splice(i,1); ids.splice(j,0,id);
  const s=lgStore(); s.order=ids; lgSave(s);
  renderLogoWall(); admPaintLogos();
}
function admLogoDel(id){
  if(!lgCanEdit()) return;
  if(!confirm('Remove this member? Click Save changes to remove their logos and badges. Their jobs will remain as regular listings.')) return;
  const s=lgStore();
  const k=s.add.findIndex(l=>l.id===id);
  if(k>-1) s.add.splice(k,1);
  else if(s.del.indexOf(id)<0) s.del.push(id);
  s.order=s.order.filter(x=>x!==id);
  if(s.icons) delete s.icons[id];
  lgSave(s);
  renderLogoWall(); admPaintLogos();
}
function admLogoReset(){
  if(!lgCanEdit()) return;
  if(!confirm('Restore the default logos in your draft? Click Save changes to publish them.')) return;
  lgSave({order:[],del:[],add:[],icons:{}});
  renderLogoWall(); admPaintLogos();
}
// Find visible bounds, removing transparent padding and opaque white margins.
function lgBounds(data,w,h){
  const corners=[0,(w-1)*4,(h-1)*w*4,(w*h-1)*4];
  const white=i=>data[i+3]>250&&data[i]>245&&data[i+1]>245&&data[i+2]>245;
  const trimWhite=corners.every(white);
  let left=w, top=h, right=-1, bottom=-1;
  for(let y=0;y<h;y++) for(let x=0;x<w;x++){
    const i=(y*w+x)*4;
    if(data[i+3]<=8||(trimWhite&&white(i))) continue;
    left=Math.min(left,x); right=Math.max(right,x); top=Math.min(top,y); bottom=Math.max(bottom,y);
  }
  if(right<left) throw new Error('The image has no visible artwork.');
  return {x:left,y:top,width:right-left+1,height:bottom-top+1};
}
function lgNormalize(img,icon=false){
  const nw=img.naturalWidth,nh=img.naturalHeight;
  if(!nw||!nh) throw new Error('That image has no dimensions.');
  const scale=Math.min(1,2048/Math.max(nw,nh));
  const scan=document.createElement('canvas'); scan.width=Math.max(1,Math.round(nw*scale)); scan.height=Math.max(1,Math.round(nh*scale));
  const ctx=scan.getContext('2d',{willReadFrequently:true}); ctx.drawImage(img,0,0,scan.width,scan.height);
  const b=lgBounds(ctx.getImageData(0,0,scan.width,scan.height).data,scan.width,scan.height);
  if(icon){
    const c=document.createElement('canvas'); c.width=128; c.height=128;
    const sc=104/Math.max(b.width,b.height), w=b.width*sc, h=b.height*sc;
    c.getContext('2d').drawImage(scan,b.x,b.y,b.width,b.height,(128-w)/2,(128-h)/2,w,h);
    return c.toDataURL('image/png');
  }
  // Two-times display resolution, bounded width, original aspect ratio.
  const sc=Math.min(64/b.height,400/b.width);
  const c=document.createElement('canvas'); c.width=Math.max(1,Math.round(b.width*sc)); c.height=Math.max(1,Math.round(b.height*sc));
  c.getContext('2d').drawImage(scan,b.x,b.y,b.width,b.height,0,0,c.width,c.height);
  return c.toDataURL('image/png');
}
async function lgPrepareIcon(file){
  if(!/^image\/(png|jpeg|webp|svg\+xml)$/.test(file.type)) throw new Error('Choose a PNG, JPG, WebP or SVG.');
  if(file.size>10000000) throw new Error('Choose an image smaller than 10 MB.');
  const raw=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(new Error('The file could not be read.'));r.readAsDataURL(file);});
  const img=await new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(new Error('That file could not be decoded as an image.'));im.src=raw;});
  const src=lgNormalize(img,true);
  if(src.length>400000) throw new Error('Please choose a simpler icon image.');
  return src;
}
async function admLogoIconUpload(id,input){
  if(!lgCanEdit()) return;
  const file=(input.files||[])[0]; if(!file) return;
  input.disabled=true;
  try{
    const src=await lgPrepareIcon(file);
    if(!lgCanEdit()||!logoAll().some(l=>l.id===id)) return;
    const s=lgStore();s.icons=s.icons||{};s.icons[id]=src;
    lgSave(s);renderLogoWall();admPaintLogos();
  }catch(e){toast('Icon not saved',e.message);}
  finally{input.disabled=false;input.value='';}
}
function admLogoIconReset(id){
  if(!lgCanEdit()) return;
  const s=lgStore();if(s.icons)delete s.icons[id];
  lgSave(s);renderLogoWall();admPaintLogos();
}

async function admLogoUpload(){
  if(!lgCanEdit()) return;
  const name=($('#lgName').value||'').trim();
  const f=($('#lgFile').files||[])[0];
  if(!name){ toast('Name needed','Give the logo a company name first.'); return; }
  if(!f){ toast('File needed','Choose an image file to upload.'); return; }
  if(!/^image\/(png|jpeg|webp|svg\+xml)$/.test(f.type)){ toast('Unsupported image','Choose a PNG, JPG, WebP or SVG.'); return; }
  if(f.size>10000000){ toast('Image too large','Choose an image smaller than 10 MB.'); return; }
  const button=$('#lgUpload'); if(button){button.disabled=true;button.textContent='Preparing logo…';}
  try{
    const raw=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(new Error('The file could not be read.'));r.readAsDataURL(f);});
    const img=await new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(new Error('That file could not be decoded as an image.'));im.src=raw;});
    const src=lgNormalize(img);
    if(src.length>400000) throw new Error('Please choose a simpler logo image.');
    const iconFile=($('#lgIconFile').files||[])[0];
    const icon=iconFile?await lgPrepareIcon(iconFile):'';
    if(!lgCanEdit()) return;
    const s=lgStore();
    if(s.add.length>=100) throw new Error('The wall supports up to 100 uploaded logos.');
    const id='u'+crypto.randomUUID();
    s.add.push({id:id,name:name,src:src});
    if(icon){s.icons=s.icons||{};s.icons[id]=icon;}
    lgSave(s); renderLogoWall(); admPaintLogos();
  }catch(e){toast('Logo not added',e.message);}
  finally{if(button){button.disabled=false;button.textContent='Add to the wall';}}
}

/* ---------- news moderation (admin) ---------- */
let ADM_NEWS=[];
function admPaintNews(){
  const B=$('#admBody'); if(!B) return;
  B.innerHTML='<div class="adm-empty">Loading the live feed…</div>';
  if(!window.nwAdminLoad){ B.innerHTML='<div class="adm-empty">News engine not loaded.</div>'; return; }
  nwAdminLoad().then(function(d){
    if(admTabNow!=='news') return;
    ADM_NEWS=d.items;
    const hid={}; d.hidden.forEach(function(id){ hid[id]=1; });
    const row=function(x,i){ return '<div class="adm-row'+(hid[x.id]?' dim':'')+'">'
      +'<div class="who"><b>'+escHtml(x.t)+' '+(hid[x.id]?'<span class="adm-st">Deleted</span>':'<span class="adm-st live">Live</span>')+'</b>'
      +'<span>'+escHtml(x.s)+' &middot; '+escHtml(x.d)+' &middot; '+escHtml(x.c)+(x.m?' &middot; Member: '+escHtml(x.m):'')+'</span>'
      +(x.b?'<span>'+escHtml(x.b.length>150?x.b.slice(0,150)+'…':x.b)+'</span>':'')+'</div>'
      +'<div class="adm-acts"><a class="adm-btn" href="'+escHtml(x.u)+'" target="_blank" rel="noopener" style="text-decoration:none">Open</a>'
      +(hid[x.id]?'<button class="adm-btn" onclick="admNewsAct('+i+',\'unhide\')">Restore</button>'
                 :'<button class="adm-btn danger" onclick="admNewsAct('+i+',\'hide\')">Delete</button>')
      +'</div></div>'; };
    const live=[], gone=[];
    d.items.forEach(function(x,i){ (hid[x.id]?gone:live).push(row(x,i)); });
    B.innerHTML='<div class="adm-sec"><h6>Live on the site ('+live.length+')</h6>'
      +(live.join('')||'<div class="adm-empty">The feed is empty right now.</div>')
      +(gone.length?'<h6>Deleted from the site ('+gone.length+')</h6>'+gone.join(''):'')+'</div>';
  }).catch(function(e){
    if(admTabNow==='news') B.innerHTML='<div class="adm-empty">Couldn&rsquo;t reach the news feed ('+escHtml(e&&e.message||'error')+'). Try again in a minute.</div>';
  });
}
function admNewsAct(i,act){
  const x=ADM_NEWS[i]; if(!x) return;
  fetch('/api/news',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pw:admPw(),action:act,id:x.id})})
    .then(function(r){ return r.json().then(function(d){ return {ok:r.ok&&d&&d.ok,msg:d&&d.error}; }); })
    .catch(function(){ return {ok:false,msg:'network error'}; })
    .then(function(res){
      if(!res.ok){ toast('Not saved', res.msg||'The server rejected the change.'); return; }
      toast(act==='hide'?'Story removed':'Story restored', act==='hide'?'Gone from the feed for every visitor.':'Back on the feed for every visitor.');
      admPaintNews();
    });
}


/* ---------- boot: render if a deep link landed here before this block loaded ---------- */
if(window.__page==='jobs'){ renderJobs(); jbSync(); }
if(window.__page==='admin') renderAdmin();

/* ---------- esc closes the new modals ---------- */
document.addEventListener('keydown', e=>{
  if(e.key!=='Escape') return;
  ['mSubmitEco','mPostJob','mJobView'].forEach(id=>{ const m=$('#'+id); if(m&&m.classList.contains('open')) closeModal(id); });
});
