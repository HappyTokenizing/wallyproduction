import {createStats} from './ecosystem-stats.js';
import {filterProfiles,memberFor,safeURL,websiteFor,memberCount,exitsFor,exitCount} from './ecosystem-model.js';
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const label={current:'Current',historical:'Historical',review:'Review pending'};
let pending;
export async function mountEcosystem(mount, options) {
  pending ||= fetch('/data/ecosystem-directory.json').then(r=>{if(!r.ok)throw Error('Directory unavailable');return r.json();}).catch(e=>{pending=null;throw e;});
  const data=await pending;
  document.querySelectorAll('[data-ecosystem-count]').forEach(el=>{el.textContent=data.profiles.length.toLocaleString('en-US');});
  if(mount.__ecosystem){mount.__ecosystem.refresh();return;}
  const byId=new Map(data.profiles.map(p=>[p.id,p]));
  const state={q:'',status:'current',section:'all',members:false,view:'directory',limit:50};
  let selected=null,priorFocus=null;
  const members=()=>options.getMembers?.()||[];
  const counts=Object.fromEntries(['current','historical','review'].map(s=>[s,data.profiles.filter(p=>p.directoryStatus===s).length]));
  mount.innerHTML=`<div class="ec-directory">
    <div class="ec-summary"><div><strong>${data.profiles.length}</strong><span>Total Companies</span></div><div><strong>${counts.current}</strong><span>Active Companies</span></div><div title="Completed mergers and acquisitions only, counted once per documented transaction. Closures, bankruptcies and unconfirmed deals are excluded."><strong>${exitCount(data.profiles)}</strong><span>Exits</span></div><div><strong data-member-count>${memberCount(members())}</strong><span>RWAF Members</span></div></div>
    <div class="ec-toolbar"><div class="ec-views" role="group" aria-label="Ecosystem view"><button data-view="directory" aria-pressed="true">Directory</button><button data-view="map" aria-pressed="false">Ecosystem map</button><button type="button" data-view="stats" aria-pressed="false" aria-controls="ec-stats-view">Stats</button></div><label class="ec-search">Search<input type="search" placeholder="Search all companies and initiatives" aria-label="Search ecosystem"></label></div>
    <div class="ec-filters"><label>Status<select aria-label="Profile status"><option value="current">Current (${counts.current})</option><option value="all">All profiles (${data.profiles.length})</option><option value="exits">Exits — M&amp;A (${exitCount(data.profiles)})</option><option value="historical">Historical (${counts.historical})</option><option value="review">Review pending (${counts.review})</option></select></label><label>Sector<select aria-label="Ecosystem sector"><option value="all">All sectors</option>${data.sections.filter(s=>s.name!=='Historical').map(s=>`<option value="${escape(s.name)}">${escape(s.name)}</option>`).join('')}</select></label><label class="ec-members"><input type="checkbox">RWAF Members</label><button class="ec-clear" data-clear>Clear filters</button></div>
    <p class="ec-result" role="status" aria-live="polite"></p><div class="ec-results"></div>
    <footer class="ec-attribution">Expanded: ${escape(data.snapshotDate)}. Current status reflects the dated source review, not continuous monitoring. Exits counts documented completed M&amp;A transactions once each. Closures, bankruptcies, rebrands and unconfirmed deals are excluded. An acquired company may still be active. Historical records also include retired or unverified initiatives and do not necessarily indicate company closure. Institutional profiles include documented pilots and past issuances; inclusion does not imply a currently available product.<br>Original directory curated by Ray Buckton / RWA News Today, drawing on RWA World, RWA.io and company references (snapshot ${escape(data.upstreamSnapshotDate)}). Expanded by RWA Foundation with official references linked in each new profile. Company names and logos belong to their respective owners. <a href="${escape(data.source)}" target="_blank" rel="noopener noreferrer">Source repository ↗</a></footer>
    <dialog class="ec-dialog" aria-labelledby="ec-profile-title"><div class="ec-dialog-bar"><span>Company profile</span><button data-close aria-label="Close company profile">×</button></div><div class="ec-profile"></div></dialog>
  </div>`;
  const root=mount.querySelector('.ec-directory'), results=root.querySelector('.ec-results'), dialog=root.querySelector('dialog');
  const stats=createStats(root,data,members);
  function logo(p){
    const member=memberFor(p,members());
    const custom=p.logo?.useForMembers?'':member?.icon||member?.src;
    const bundled=p.logo?.src?.startsWith('/ecosystem/')&&!p.logo.src.includes('..')?p.logo.src:'';
    const src=custom||bundled;
    const treatment=!custom?p.logo?.treatment:'';
    return `<span class="ec-logo ${!custom&&p.logo?.shape==='wordmark'?'ec-wordmark':''} ${!custom&&(p.logo?.background==='dark'||treatment==='reverse'||treatment==='reverse-paper')?'ec-logo-dark':''}">${src?`<img src="${escape(src)}" alt="" loading="lazy" class="${escape(treatment||'')}"/>`:''}<span ${src?'hidden':''}>${escape(p.name.replace(/[^a-z0-9]/gi,'').slice(0,2).toUpperCase())}</span></span>`;
  }
  function badges(p){return `${exitsFor(p).length?'<span class="ec-status-badge">M&amp;A exit</span>':''}${memberFor(p,members())?'<span class="ec-member-badge">★ RWAF Member</span>':''}${p.directoryStatus!=='current'?`<span class="ec-status-badge">${label[p.directoryStatus]}</span>`:''}`;}
  function paint(){
    const roster=members(), hits=filterProfiles(data.profiles,state,roster), ids=new Set(hits.map(p=>p.id));
    const order=new Map(hits.map((p,i)=>[p.id,i]));
    root.querySelector('[data-member-count]').textContent=memberCount(roster);
    root.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===state.view)));
    const isStats=state.view==='stats';
    for(const selector of ['.ec-search','.ec-filters','.ec-result','.ec-results','.ec-attribution'])root.querySelector(selector).hidden=isStats;
    stats.setVisible(isStats);
    if(isStats)return;
    root.querySelector('.ec-result').textContent=`${hits.length} unique ${hits.length===1?'profile':'profiles'}${state.view==='directory'?` · Showing ${Math.min(state.limit,hits.length)}`:' · Category placements link to the same company profile'}`;
    if(!hits.length){results.innerHTML='<div class="ec-empty">No matching profiles. Try All profiles or clear your filters.</div>';return;}
    if(state.view==='directory'){
      results.innerHTML=`<div class="ec-list">${hits.slice(0,state.limit).map(p=>`<button class="ec-row ${memberFor(p,roster)?'is-member':''}" data-profile="${escape(p.id)}">${logo(p)}<span class="ec-row-main"><span class="ec-row-name">${escape(p.name)} ${badges(p)}</span><span class="ec-description">${escape(p.description)}</span><span class="ec-category">${escape(p.categories.map(c=>c.name).join(' · '))}</span></span><span class="ec-arrow" aria-hidden="true">↗</span></button>`).join('')}</div>${hits.length>state.limit?`<button class="ec-more" data-more>Show ${Math.min(50,hits.length-state.limit)} more profiles</button>`:''}`;
    }else{
      results.innerHTML=`<div class="ec-map">${data.sections.filter(s=>state.section==='all'||s.name===state.section).map(s=>{
        const cats=s.categories.map(c=>({...c,ids:[...new Set(c.ids)].filter(id=>ids.has(id)).sort((a,b)=>order.get(a)-order.get(b))})).filter(c=>c.ids.length);
        if(!cats.length)return '';
        return `<section class="ec-map-section ${s.name==='Tokenization'?'ec-map-wide':''}"><h2>${escape(s.name)}</h2>${cats.map(c=>`<div class="ec-map-category"><h3>${escape(c.name)} <span>${c.ids.length}</span></h3><div class="ec-map-tiles">${c.ids.map(id=>{const p=byId.get(id);return `<button class="ec-tile ${memberFor(p,roster)?'is-member':''}" data-profile="${escape(id)}" aria-label="${escape(p.name)}"><span>${logo(p)}${memberFor(p,roster)?'<span class="ec-map-star" title="RWAF Member">★</span>':''}</span><span>${escape(p.name)}</span></button>`;}).join('')}</div></div>`).join('')}</section>`;
      }).join('')}</div>`;
    }
  }
  function profileHTML(p){
    const website=websiteFor(p), fav=options.isFavorite?.(p.id,p.legacyIds);
    const related=p.relatedEntities.filter(r=>byId.has(r.id));
    const updates=p.directoryStatus==='historical'?[]:p.officialUpdates.filter(u=>safeURL(u.url,p));
    const sources=(p.sources||[]).filter(s=>safeURL(s.url,p));
    const exits=exitsFor(p);
    return `<header>${logo(p)}<div><h2 id="ec-profile-title">${escape(p.name)}</h2><div class="ec-profile-badges">${badges(p)}<span class="ec-status-badge">${escape(p.kind)}</span></div></div></header><p class="ec-profile-categories">${escape(p.categories.map(c=>c.section+' / '+c.name).join(' · '))}</p><p>${escape(p.description)}</p>${p.statusNote||p.lifecycle?`<div class="ec-lifecycle"><b>${escape(p.lifecycle||label[p.directoryStatus])}</b><p>${escape(p.statusNote||'')}</p>${p.archiveScope?`<p>${escape(p.archiveScope)}</p>`:''}</div>`:''}${exits.length?`<section class="ec-lifecycle ec-exits"><h3>Exits · M&amp;A</h3>${exits.map(e=>`<p><b>${escape(e.target)} → ${escape(e.counterparty)}</b><br>${e.type==='merger'?'Completed merger':'Completed acquisition'}</p><p>${escape(e.summary)}</p><ul class="ec-updates">${e.sources.filter(s=>safeURL(s.url,p)).map(s=>`<li><a href="${escape(safeURL(s.url,p))}" target="_blank" rel="noopener noreferrer">${escape(s.title)} ↗</a></li>`).join('')}</ul><p class="ec-reviewed">Source reviewed: ${escape(e.checkedOn)}</p>`).join('')}</section>`:''}<div class="ec-profile-actions">${website?`<a href="${escape(website)}" target="_blank" rel="noopener noreferrer">Visit website ↗</a>`:''}<button data-favorite="${escape(p.id)}">${fav?'★ Favorited':'☆ Favorite'}</button></div>${related.length?`<h3>Related initiatives</h3><div class="ec-related">${related.map(r=>`<button data-profile="${escape(r.id)}">${escape(byId.get(r.id).name)} →</button>`).join('')}</div>`:''}${updates.length?`<h3>Official reference updates</h3><ul class="ec-updates">${updates.map(u=>`<li><a href="${escape(safeURL(u.url,p))}" target="_blank" rel="noopener noreferrer">${escape(u.title)} ↗</a><time>${escape(u.publishedOn)}</time></li>`).join('')}</ul>`:''}${sources.length?`<h3>Research sources</h3>${p.evidenceNote?`<p class="ec-evidence">${escape(p.evidenceNote)}</p>`:''}<ul class="ec-updates">${sources.map(s=>`<li><a href="${escape(safeURL(s.url,p))}" target="_blank" rel="noopener noreferrer">${escape(s.title)} ↗</a></li>`).join('')}</ul>`:''}<p class="ec-reviewed">${p.checkedOn?`Source reviewed: ${escape(p.checkedOn)}`:'Review date not recorded in the earlier RWAF directory.'}<br>${escape(p.provenance)}</p>`;
  }
  function open(id){const p=byId.get(id);if(!p)return;selected=id;if(!dialog.open)priorFocus=root.contains(document.activeElement)?document.activeElement:null;root.querySelector('.ec-profile').innerHTML=profileHTML(p);if(!dialog.open)dialog.showModal();dialog.scrollTop=0;root.querySelector('[data-close]').focus();}
  function close(){dialog.close();selected=null;priorFocus?.focus();}
  root.addEventListener('error',event=>{const img=event.target;if(img.tagName==='IMG'){img.hidden=true;if(img.nextElementSibling)img.nextElementSibling.hidden=false;}},true);
  root.addEventListener('click',event=>{
    const b=event.target.closest('button');if(!b)return;
    if(b.dataset.profile)return open(b.dataset.profile);
    if(b.hasAttribute('data-close'))return close();
    if(b.dataset.favorite){const p=byId.get(b.dataset.favorite);options.onFavorite?.(p.id,p.legacyIds);if(dialog.open)root.querySelector('.ec-profile').innerHTML=profileHTML(p);return;}
    if(b.dataset.view){state.view=b.dataset.view;state.limit=50;paint();}
    if(b.hasAttribute('data-more')){state.limit+=50;paint();}
    if(b.hasAttribute('data-clear')){Object.assign(state,{q:'',status:'current',section:'all',members:false,limit:50});root.querySelector('input[type=search]').value='';root.querySelector('select[aria-label="Profile status"]').value='current';root.querySelector('select[aria-label="Ecosystem sector"]').value='all';root.querySelector('input[type=checkbox]').checked=false;paint();}
  });
  root.querySelector('.ec-views').addEventListener('keydown',e=>{
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
    const buttons=[...root.querySelectorAll('[data-view]')],index=buttons.indexOf(e.target);if(index<0)return;
    e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?buttons.length-1:(index+(e.key==='ArrowRight'?1:-1)+buttons.length)%buttons.length;
    buttons[next].click();buttons[next].focus();
  });
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();}});
  dialog.addEventListener('close',()=>{selected=null;priorFocus?.focus();});
  window.addEventListener('hashchange',()=>{if(dialog.open)close();});
  root.querySelector('input[type=search]').addEventListener('input',e=>{state.q=e.target.value;state.limit=50;paint();});
  root.querySelector('select[aria-label="Profile status"]').addEventListener('change',e=>{state.status=e.target.value;state.limit=50;paint();});
  root.querySelector('select[aria-label="Ecosystem sector"]').addEventListener('change',e=>{state.section=e.target.value;state.limit=50;paint();});
  root.querySelector('input[type=checkbox]').addEventListener('change',e=>{state.members=e.target.checked;state.limit=50;paint();});
  mount.__ecosystem={refresh(){paint();if(selected)root.querySelector('.ec-profile').innerHTML=profileHTML(byId.get(selected));}};
  paint();
}
