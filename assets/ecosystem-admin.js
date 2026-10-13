import {applyEcosystemUpdates, ecosystemTaxonomy, requiresIndustryStart} from './ecosystem-updates-model.js';
import {startEvent, dateBounds} from './ecosystem-stats-model.js';
import {safeURL, relevance} from './ecosystem-model.js';

export const escapeAdmin = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clone = value => structuredClone(value);
const text = value => String(value ?? '').trim();
const canonicalProfiles = state => state.data.profiles.filter(profile => state.baseIds.has(profile.id));
const dateTypes = {industry_entry:'First tokenization / RWA activity',founding:'Company founding',launch:'Project launch'};
const statuses = {pending:'Pending',approved:'Approved',rejected:'Rejected'};
const categoryKey = category => JSON.stringify([category.section,category.name]);
const emptyReview = () => ({profileId:null,name:'',description:'',website:'',region:'',categories:[],directoryStatus:'current',start:null});

export function profileReview(profile, data) {
  const event = startEvent(profile, data.statsEvents || []);
  const source = event?.sources?.find(s => safeURL(s.url, profile));
  return {...emptyReview(),profileId:profile.id,name:profile.name,description:profile.description || '',website:profile.website || '',region:profile.region || '',categories:clone(profile.categories || []),directoryStatus:profile.directoryStatus || 'current',start:event?{date:event.date,type:event.type,sourceUrl:source?.url || '',sourceTitle:source?.title || ''}:null};
}
export function submissionReview(record) {
  if (record.review) return clone(record.review);
  const submitted = record.submission || {};
  return {...emptyReview(),name:submitted.name || '',description:submitted.description || '',website:submitted.website || '',region:submitted.region || ''};
}
export function matchingProfiles(profiles, query, limit = 30) {
  return profiles.map(profile => ({profile,rank:relevance(profile,query)})).filter(row => Number.isFinite(row.rank)).sort((a,b) => a.rank-b.rank || a.profile.name.localeCompare(b.profile.name)).slice(0,limit).map(row => row.profile);
}
export function reviewFromValues(values, categories) {
  const date = text(values.date);
  return {profileId:text(values.profileId) || null,name:text(values.name),description:text(values.description),website:text(values.website),region:text(values.region),directoryStatus:values.directoryStatus,categories:clone(categories),start:date?{date,type:values.dateType,sourceUrl:text(values.sourceUrl),sourceTitle:text(values.sourceTitle)}:null};
}
export function reviewProblems(review, {publish = false, profile} = {}) {
  const errors = [];
  if (publish && !review.name) errors.push('Enter a company or project name.');
  if (publish && !review.description) errors.push('Enter a company description before publishing.');
  if (review.website && !safeURL(review.website, {})) errors.push('Enter a full http:// or https:// website address.');
  if (!['current','review','historical'].includes(review.directoryStatus)) errors.push('Choose a directory status.');
  if (publish && !review.categories.length) errors.push('Choose at least one category before publishing.');
  if (review.start) {
    if (!dateBounds(review.start.date)) errors.push('Use a real date in YYYY, YYYY-MM, YYYY-MM-DD or YYYY-Q1 format.');
    if (!Object.hasOwn(dateTypes,review.start.type)) errors.push('Choose what the date represents.');
    if ((publish || review.start.sourceUrl) && !safeURL(review.start.sourceUrl, {})) errors.push('Add an http:// or https:// evidence link for the date.');
    if (publish && !review.start.sourceTitle) errors.push('Add a title for the date source.');
    const requiresIndustry = profile?.industryStartRequired || review.categories.some(c => c.section === 'Institutions' || c.name === 'TradFi') || Number(review.start.date.slice(0,4)) < 2011;
    if (requiresIndustry && review.start.type !== 'industry_entry') errors.push('Institutions and pre-2011 firms must use the date of their first tokenization / RWA activity.');
  }
  return errors;
}
// Editable values and the optimistic-lock revision must come from one response.
// A separate public request could be older than the revision and permit stale edits.
export function adminSnapshot(base, inbox) {
  if (!Array.isArray(inbox?.submissions) || !Object.hasOwn(inbox,'revision')) throw Error('The server returned an incomplete submission list.');
  const submissions=clone(inbox.submissions);
  const records=submissions.filter(record=>record.status==='approved'&&record.review).map(({id,review,updatedAt})=>({id,review:clone(review),updatedAt}));
  const payload={records,updatedAt:records.reduce((latest,record)=>!latest||record.updatedAt>latest?record.updatedAt:latest,null)};
  return {submissions,revision:inbox.revision,payload,data:applyEcosystemUpdates(base,payload)};
}
const displayDate = value => value ? new Date(value).toLocaleString() : 'Not recorded';
const safeAnchor = (url,label) => {const safe = safeURL(url,{});return safe?`<a href="${escapeAdmin(safe)}" target="_blank" rel="noopener noreferrer">${escapeAdmin(label || url)} ↗</a>`:escapeAdmin(label || url);};

export async function mountEcosystemAdmin(mount, {getPassword,onPublished} = {}) {
  mount.__ecosystemAdminCleanup?.();
  const token = {}, controller = new AbortController();
  mount.__ecosystemAdminToken = token;
  const active = () => !controller.signal.aborted && mount.__ecosystemAdminToken === token && mount.isConnected;
  const state = {mode:'submissions',filter:'pending',query:'',selected:null,draft:null,dirty:false,busy:false,conflict:false,revision:null,submissions:[],data:null,base:null,payload:null,taxonomy:[]};
  mount.classList.add('ecosystem-admin');
  mount.innerHTML = `<div class="ea-heading"><div><h3>Ecosystem directory</h3><p>Review project submissions and maintain company details and sourced dates. Approved changes update the directory, map and charts.</p></div><button type="button" data-ea-action="refresh">Refresh</button></div><div class="ea-message" role="status" aria-live="polite">Loading submissions…</div><div class="ea-modes" role="group" aria-label="Directory administration"><button type="button" data-ea-mode="submissions" aria-pressed="true">Submissions</button><button type="button" data-ea-mode="profiles" aria-pressed="false">Company profiles &amp; dates</button></div><div class="ea-workspace"><aside class="ea-sidebar"><label class="ea-label">Search<input type="search" data-ea-search placeholder="Company or project name"></label><label class="ea-label ea-filter">Submission status<select data-ea-filter><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="all">All submissions</option></select></label><p class="ea-count"></p><div class="ea-list"></div></aside><section class="ea-editor"><p class="ea-empty">Select a submission to review.</p></section></div>`;
  const message = (value,error = false) => {if(!active())return;const el=mount.querySelector('.ea-message');el.textContent=value;el.classList.toggle('ea-error',error);};
  async function boundedFetch(path, options={}) {
    const timeout = new AbortController(), abort=()=>timeout.abort();
    controller.signal.addEventListener('abort',abort,{once:true});
    const timer=setTimeout(abort,45000);
    try{return await fetch(path,{...options,signal:timeout.signal});}
    catch(error){if(timeout.signal.aborted&&!controller.signal.aborted)throw Error('The request timed out. Your edits are still here; refresh to confirm whether the server saved them before retrying.');throw error;}
    finally{clearTimeout(timer);controller.signal.removeEventListener('abort',abort);}
  }
  async function request(body) {
    const response = await boundedFetch('/api/ecosystem',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',signal:controller.signal,body:JSON.stringify({...body,pw:getPassword?.() || ''})});
    let result;try {result=await response.json();}catch {throw Error('The server did not confirm this request. Your edits are still in the form.');}
    if(!response.ok) {const error=Error(result.error || 'Could not save the directory changes.');error.status=response.status;throw error;}
    if(body.action!=='list_all'&&result.ok!==true)throw Error('The server did not confirm the save. Your edits remain here; refresh to check the saved version.');
    return result;
  }
  async function publicData(path) {const response=await boundedFetch(path,{cache:'no-store',credentials:'same-origin',signal:controller.signal});if(!response.ok)throw Error('Could not load directory data.');return response.json();}
  async function load() {
    const [base,inbox]=await Promise.all([state.base || publicData('/data/ecosystem-directory.json'),request({action:'list_all'})]);
    if(!active())return false;
    const snapshot=adminSnapshot(base,inbox);
    state.base=base;state.baseIds=new Set(base.profiles.map(profile=>profile.id));Object.assign(state,snapshot);state.taxonomy=ecosystemTaxonomy(base);state.conflict=false;return true;
  }
  function unsavedOkay() {return !state.dirty || window.confirm('Discard the unsaved edits in this form?');}
  function selectedRecord() {return state.submissions.find(record=>record.id===state.selected);}
  function selectedProfile() {return state.data?.profiles.find(profile=>profile.id===state.selected);}
  function paintList() {
    if(!active()||!state.data)return;
    mount.querySelectorAll('[data-ea-mode]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.eaMode===state.mode)));
    mount.querySelector('.ea-filter').hidden=state.mode!=='submissions';
    const needle=state.query.toLocaleLowerCase();
    let items,total;const profiles=canonicalProfiles(state);
    if(state.mode==='submissions'){
      items=state.submissions.filter(record=>(state.filter==='all'||record.status===state.filter)&&[record.review?.name,record.submission?.name,record.submission?.email].some(value=>String(value||'').toLocaleLowerCase().includes(needle))).sort((a,b)=>String(b.submittedAt).localeCompare(String(a.submittedAt)));
      total=items.length;
    }else{items=matchingProfiles(profiles,state.query,100);total=state.query?profiles.filter(profile=>Number.isFinite(relevance(profile,state.query))).length:profiles.length;}
    mount.querySelector('.ea-count').textContent=`${total} ${state.mode==='submissions'?(total===1?'submission':'submissions'):(total===1?'company':'companies')}${items.length<total?` · first ${items.length} shown`:''}`;
    mount.querySelector('.ea-list').innerHTML=items.length?items.map(item=>`<button type="button" class="ea-list-item" data-ea-select="${escapeAdmin(item.id)}" aria-pressed="${item.id===state.selected}"><strong>${escapeAdmin(state.mode==='submissions'?(item.review?.name||item.submission?.name||'Unnamed submission'):item.name)}</strong><span>${escapeAdmin(state.mode==='submissions'?(statuses[item.status]||item.status):item.directoryStatus)}${state.mode==='submissions'?` · ${escapeAdmin(displayDate(item.submittedAt))}`:''}</span></button>`).join(''):'<p class="ea-empty">No matching entries.</p>';
  }
  function categoryOptions() {
    // Accept the shared taxonomy's section objects and preserve an older existing category for review.
    const known = state.taxonomy.flatMap(section=>section.categories.map(category=>({section:section.name,name:typeof category==='string'?category:category.name})));
    for(const category of state.draft.categories)if(!known.some(item=>categoryKey(item)===categoryKey(category)))known.push(category);
    return known;
  }
  function matchOptions(query='') {
    const select=mount.querySelector('[name="profileId"]');if(!select)return;
    const selected=select.options.length?select.value:(state.draft.profileId||''),matches=matchingProfiles(canonicalProfiles(state),query || state.draft.name,25);
    const current=state.data.profiles.find(profile=>profile.id===selected);if(current&&!matches.some(profile=>profile.id===selected))matches.unshift(current);
    select.innerHTML=`<option value="">Create a separate new profile</option>${matches.map(profile=>`<option value="${escapeAdmin(profile.id)}"${profile.id===selected?' selected':''}>${escapeAdmin(profile.name)} · ${escapeAdmin(profile.id)}</option>`).join('')}`;
  }
  function paintEditor() {
    if(!active())return;
    const editor=mount.querySelector('.ea-editor');
    if(!state.draft){editor.innerHTML=`<p class="ea-empty">Select ${state.mode==='submissions'?'a submission to review':'a company to update its details or sourced date'}.</p>`;return;}
    const review=state.draft,record=state.mode==='submissions'?selectedRecord():null,submitted=record?.submission,profile=state.data.profiles.find(item=>item.id===(review.profileId||`submitted-${state.selected}`)),start=review.start || {};
    const options=categoryOptions(),sections=[...new Set(options.map(category=>category.section))];
    editor.innerHTML=`<header class="ea-editor-heading"><div><h4>${escapeAdmin(review.name||'Review submission')}</h4><p>${record?escapeAdmin(statuses[record.status]||record.status)+' submission':'Company profile · new approved submissions are edited in the Submissions tab'}</p></div></header>${submitted?`<details class="ea-original"><summary>Original submission &amp; private contact</summary><p>Reference: ${escapeAdmin(record.reference)}</p><dl><dt>Name</dt><dd>${escapeAdmin(submitted.name)}</dd><dt>Submitted</dt><dd>${escapeAdmin(displayDate(record.submittedAt))}</dd><dt>Contact email (admin only)</dt><dd>${escapeAdmin(submitted.email||'Not supplied')}</dd><dt>Description</dt><dd>${escapeAdmin(submitted.description)}</dd><dt>Suggested type / region</dt><dd>${escapeAdmin([submitted.type,submitted.region].filter(Boolean).join(' · '))}</dd><dt>Website</dt><dd>${safeAnchor(submitted.website)}</dd></dl><p>The original submission is retained. Contact details are never published.</p><p>Emails: ${escapeAdmin(Object.entries(record.notifications||{}).map(([name,email])=>name+': '+(email.status==='sent'?'sent':email.status==='review'?'delivery needs review':email.error?'queued — '+email.error:'queued')).join(' · ')||'No confirmation email recorded')}</p></details>`:''}<form class="ea-form" novalidate>${state.mode==='submissions'?`<fieldset class="ea-match"><legend>Match to an existing company</legend><p>Check for an existing profile before approving. Linking a match updates that profile instead of creating a duplicate.</p><label class="ea-label">Find a company<input type="search" data-ea-match-search placeholder="Search existing names"></label><label class="ea-label">Canonical profile<select name="profileId"></select></label><button type="button" data-ea-action="use-profile">Use selected company details</button></fieldset>`:`<input type="hidden" name="profileId" value="${escapeAdmin(review.profileId)}">`}<div class="ea-fields"><label class="ea-label">Company / project name<input name="name" value="${escapeAdmin(review.name)}" maxlength="120" required></label><label class="ea-label">Website<input name="website" type="url" value="${escapeAdmin(review.website)}" placeholder="https://example.com" maxlength="2000"></label><label class="ea-label ea-wide">Description<textarea name="description" rows="4" maxlength="3000">${escapeAdmin(review.description)}</textarea></label><label class="ea-label">Region<input name="region" value="${escapeAdmin(review.region)}" maxlength="100"></label><label class="ea-label">Directory status<select name="directoryStatus">${[['current','Active company'],['review','Needs research'],['historical','Historical / inactive']].map(([value,label])=>`<option value="${value}"${review.directoryStatus===value?' selected':''}>${label}</option>`).join('')}</select></label></div><details class="ea-categories"${review.categories.length?'':' open'}><summary>Directory categories · ${review.categories.length} selected</summary><p>Choose the categories where this company belongs. RWAF membership is managed in Member logos.</p><div class="ea-category-grid">${sections.map(section=>`<div><strong>${escapeAdmin(section==='RWAF directory'?'Additional ecosystem':section)}</strong>${options.filter(category=>category.section===section).map(category=>`<label><input type="checkbox" name="categories" value="${escapeAdmin(categoryKey(category))}"${review.categories.some(item=>categoryKey(item)===categoryKey(category))?' checked':''}> ${escapeAdmin(category.name)}</label>`).join('')}</div>`).join('')}</div></details><fieldset class="ea-date"><legend>Sourced start date</legend><p>Charts use this date after saving. Banks, institutions and pre-2011 firms use their first tokenization / RWA activity. A year-only source appears in the annual chart; it is not assigned an invented quarter.</p><div class="ea-fields"><label class="ea-label">Date<input name="date" value="${escapeAdmin(start.date)}" placeholder="YYYY, YYYY-MM, YYYY-MM-DD or YYYY-Q1" maxlength="10"></label><label class="ea-label">Date represents<select name="dateType">${Object.entries(dateTypes).map(([value,label])=>`<option value="${value}"${(start.type||(requiresIndustryStart(profile,state.data.statsEvents)?'industry_entry':'founding'))===value?' selected':''}>${label}</option>`).join('')}</select></label><label class="ea-label">Evidence URL<input name="sourceUrl" type="url" value="${escapeAdmin(start.sourceUrl)}" placeholder="https://…" maxlength="2000"></label><label class="ea-label">Source title<input name="sourceTitle" value="${escapeAdmin(start.sourceTitle)}" maxlength="300"></label></div><p class="ea-date-help">Leave Date empty to mark the start date unknown and remove this profile from dated start charts. This does not change exit or failure events.</p></fieldset><div class="ea-form-status" role="status" aria-live="polite">No unsaved changes.</div><div class="ea-actions">${state.mode==='profiles'?'<button type="button" class="ea-primary" data-ea-action="publish-profile">Save profile &amp; update charts</button>':`<button type="button" data-ea-action="save-draft">Save draft${record?.status==='approved'?' & unpublish':''}</button><button type="button" class="ea-primary" data-ea-action="approve">${record?.status==='approved'?'Save approved changes':'Approve & publish'}</button><button type="button" data-ea-action="reject">${record?.status==='rejected'?'Keep rejected':'Reject'}${record?.status==='approved'?' & unpublish':''}</button>`}<button type="button" data-ea-action="discard">Discard edits</button><button type="button" data-ea-action="reload-conflict" hidden>Reload saved version</button></div></form>`;
    const form=editor.querySelector('.ea-form'),toolbar=document.createElement('div');toolbar.className='ea-save-toolbar';toolbar.innerHTML=form.querySelector('.ea-form-status').outerHTML+form.querySelector('.ea-actions').outerHTML;form.prepend(toolbar);
    if(state.mode==='submissions')matchOptions();
    updateControls();
  }
  function formReview() {
    const form=mount.querySelector('.ea-form');if(!form)return null;
    const values=Object.fromEntries(new FormData(form));
    return reviewFromValues(values,[...form.querySelectorAll('[name="categories"]:checked')].map(input=>{const [section,name]=JSON.parse(input.value);return {section,name};}));
  }
  function updateControls() {
    if(!active())return;
    mount.querySelectorAll('[data-ea-mode],[data-ea-select],[data-ea-action="refresh"]').forEach(button=>button.disabled=state.busy);
    const form=mount.querySelector('.ea-form');if(!form)return;
    form.querySelectorAll('input,select,textarea,button').forEach(input=>input.disabled=state.busy);
    if(state.conflict)form.querySelectorAll('[data-ea-action="publish-profile"],[data-ea-action="approve"],[data-ea-action="save-draft"],[data-ea-action="reject"]').forEach(button=>button.disabled=true);
    form.querySelectorAll('[data-ea-action="reload-conflict"]').forEach(button=>button.hidden=!state.conflict);
  }
  function formStatus(value,error=false) {mount.querySelectorAll('.ea-form-status').forEach(el=>{el.textContent=value;el.classList.toggle('ea-error',error);});}
  function select(id) {state.selected=id;state.draft=state.mode==='submissions'?submissionReview(selectedRecord()):profileReview(selectedProfile(),state.data);state.dirty=false;paintList();paintEditor();}
  async function refresh({reselect=false}={}) {
    if(state.busy||!unsavedOkay())return;
    state.busy=true;updateControls();message('Loading latest saved directory data…');
    try{if(!await load())return;state.dirty=false;if(reselect&&state.selected&&(state.mode==='submissions'?selectedRecord():selectedProfile()))select(state.selected);else{state.selected=null;state.draft=null;paintList();paintEditor();}message('Loaded the latest saved changes.');}
    catch(error){if(active())message(error.message,true);}
    finally{state.busy=false;updateControls();}
  }
  async function save(action) {
    if(state.busy||state.conflict||!state.draft)return;
    const review=action==='reject'?submissionReview(selectedRecord()):formReview(),publishing=action==='approve'||action==='publish-profile',profile=state.data.profiles.find(item=>item.id===(review.profileId||`submitted-${state.selected}`));
    const validationProfile=profile?{...profile,industryStartRequired:requiresIndustryStart(profile,state.data.statsEvents)}:null;
    const problems=action==='reject'?[]:reviewProblems(review,{publish:publishing,profile:validationProfile});
    if(problems.length){formStatus(problems.join(' '),true);return;}
    state.draft=review;state.busy=true;updateControls();formStatus('Saving to the server…');
    const previousApproved=selectedRecord()?.status==='approved';
    let saved=false;
    try{
      const result=await request(action==='publish-profile'?{action:'save_profile',profileId:state.selected,review,revision:state.revision}:{action:'save_review',id:state.selected,status:action==='approve'?'approved':action==='reject'?'rejected':'pending',review,revision:state.revision});
      if(!active())return;
      saved=true;state.dirty=false;state.revision=result.revision;
      if(publishing||previousApproved){try{await onPublished?.();}catch{message('Saved successfully. The public view could not refresh automatically; reload the page to see the update.',true);}}
      if(!active())return;
      await load();if(!active())return;
      select(state.selected);formStatus(publishing?'Saved and published. The directory and charts now use these details.':action==='reject'?'Rejected. The original submission and last saved review are retained and can be approved later. Unsaved form edits were not published.':'Draft saved. It is not published in the directory.');
    }catch(error){if(!active())return;state.conflict=error.status===409;formStatus(saved?'The change was saved, but the latest list could not reload. Refresh to confirm its published state.':state.conflict?'Another admin saved changes first. Your edits remain here. Copy any edits you want to keep, then reload the saved version before editing again.':error.message,true);}
    finally{state.busy=false;updateControls();}
  }
  function handleInput(event) {
    if(event.target.matches('[data-ea-search]')){state.query=event.target.value;paintList();return;}
    if(event.target.matches('[data-ea-match-search]')){matchOptions(event.target.value);return;}
    if(event.target.closest('.ea-form')){state.dirty=true;formStatus('Unsaved changes — use a save button below.');}
  }
  function handleChange(event) {if(event.target.matches('[data-ea-filter]')){state.filter=event.target.value;paintList();}else handleInput(event);}
  async function handleClick(event) {
    const button=event.target.closest('button');if(!button||!mount.contains(button)||state.busy)return;
    if(button.dataset.eaMode){if(!unsavedOkay())return;state.mode=button.dataset.eaMode;state.selected=null;state.draft=null;state.dirty=false;paintList();paintEditor();return;}
    if(button.dataset.eaSelect){if(!unsavedOkay())return;select(button.dataset.eaSelect);return;}
    const action=button.dataset.eaAction;
    if(action==='refresh'||action==='reload-conflict'){await refresh({reselect:action==='reload-conflict'});return;}
    if(action==='discard'){if(unsavedOkay())select(state.selected);return;}
    if(action==='use-profile'){
      const profile=state.data.profiles.find(item=>item.id===mount.querySelector('[name="profileId"]').value);
      if(!profile){formStatus('Select an existing company first.',true);return;}
      if(!unsavedOkay())return;state.draft=profileReview(profile,state.data);state.dirty=true;paintEditor();formStatus('Existing company details loaded. Review and save to publish.');return;
    }
    if(['save-draft','approve','reject','publish-profile'].includes(action))await save(action);
  }
  function preventSubmit(event) {if(event.target.matches('.ea-form'))event.preventDefault();}
  mount.addEventListener('click',handleClick);mount.addEventListener('input',handleInput);mount.addEventListener('change',handleChange);mount.addEventListener('submit',preventSubmit);
  const cleanup=()=>{controller.abort();mount.removeEventListener('click',handleClick);mount.removeEventListener('input',handleInput);mount.removeEventListener('change',handleChange);mount.removeEventListener('submit',preventSubmit);if(mount.__ecosystemAdminToken===token){delete mount.__ecosystemAdminToken;delete mount.__ecosystemAdminCleanup;}};
  mount.__ecosystemAdminCleanup=cleanup;
  await refresh();
  return cleanup;
}
