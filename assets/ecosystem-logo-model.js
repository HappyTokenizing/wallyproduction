import {safeURL} from './ecosystem-model.js';

const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const imagePath=/^\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-][a-zA-Z0-9_.-]*\.(?:svg|png|jpe?g|webp|avif|gif|ico)$/i;

// Stored versions must be bundled assets, never arbitrary image or tracking URLs.
export function safeLogoPath(value) {
  return typeof value==='string'&&value.startsWith('/ecosystem/')&&imagePath.test(value)&&!value.includes('..')?value:'';
}
function safeMemberImage(value) {
  if(typeof value!=='string')return '';
  if(safeLogoPath(value))return value;
  if(value.startsWith('/assets/member-icons/')&&imagePath.test(value)&&!value.includes('..'))return value;
  return value.length<=500000&&/^data:image\/(?:png|jpeg|webp|svg\+xml);base64,[A-Za-z0-9+/]+={0,2}$/.test(value)?value:'';
}
function bundled(logo) {
  const src=safeLogoPath(logo?.src);
  return src?{...logo,src}:null;
}
export function currentLogo(profile,member) {
  const stored=bundled(profile.logo);
  const memberIcon=safeMemberImage(member?.icon),memberSrc=memberIcon||safeMemberImage(member?.src);
  if(memberSrc&&!stored?.useForMembers)return {src:memberSrc,shape:memberIcon?'symbol':'wordmark',origin:'member'};
  return stored;
}
const recordedDate=logo=>[logo.checkedOn,logo.recordedOn,logo.archivedOn].find(d=>/^\d{4}-\d{2}-\d{2}$/.test(d||''))||'';

export function logoVersions(profile,member) {
  const current=currentLogo(profile,member),seen=new Set(current?[current.src]:[]),history=[];
  for(const candidate of Array.isArray(profile.logoHistory)?profile.logoHistory:[]) {
    if(candidate?.displayInHistory===false)continue;
    const logo=bundled(candidate);
    if(!logo||seen.has(logo.src))continue;
    seen.add(logo.src);history.push({...logo,status:'archived'});
  }
  history.sort((a,b)=>recordedDate(b).localeCompare(recordedDate(a)));
  const versions=current?[{...current,status:'current'}]:[];
  const stored=bundled(profile.logo);
  // The member admin can select a current symbol distinct from the directory asset.
  if(current?.origin==='member'&&stored&&stored.src!==current.src) {
    versions.push({...stored,status:'directory'});
    return versions.concat(history.filter(v=>v.src!==stored.src));
  }
  return versions.concat(history);
}

export function logoHTML(profile,logo,{label=''}={}) {
  const initials=String(profile.name||'').replace(/[^a-z0-9]/gi,'').slice(0,2).toUpperCase();
  const classes=['ec-logo',logo?.shape==='wordmark'?'ec-wordmark':'',logo?.background==='dark'?'ec-logo-dark':''].filter(Boolean).join(' ');
  const src=logo?.origin==='member'?safeMemberImage(logo.src):safeLogoPath(logo?.src);
  return `<span class="${classes}">${src?`<img src="${escape(src)}" alt="${escape(label)}" loading="lazy" decoding="async"/>`:''}<span ${src?'hidden':''}>${escape(initials)}</span></span>`;
}

function provenanceHTML(logo,profile) {
  const dates=[];
  for(const [field,label] of [['checkedOn','Reviewed'],['recordedOn','Recorded'],['archivedOn','Archived']]) {
    if(/^\d{4}-\d{2}-\d{2}$/.test(logo[field]||''))dates.push(`${label} <time datetime="${escape(logo[field])}">${escape(logo[field])}</time>`);
  }
  const url=safeURL(logo.sourceUrl,profile);
  return `<p class="ec-logo-dates">${dates.length?dates.join(' · '):'Record date unavailable'}</p>${url?`<a href="${escape(url)}" target="_blank" rel="noopener noreferrer">${escape(logo.sourceTitle||'Logo source')} ↗</a>`:`<span class="ec-logo-source">${logo.origin==='member'?'RWAF member roster':'Original source not recorded'}</span>`}`;
}

export function logoHistoryHTML(profile,member) {
  const versions=logoVersions(profile,member),earlier=versions.filter(v=>v.status==='archived');
  if(!earlier.length)return '';
  return `<details class="ec-logo-history"><summary>Logo history <span>${earlier.length} saved ${earlier.length===1?'version':'versions'}</span></summary><p class="ec-logo-history-note">The current logo is used throughout the directory. Earlier saved artwork is kept below. Dates record when an asset was reviewed, saved or archived; they do not establish when the brand changed.</p><ul class="ec-logo-versions">${versions.map(v=>{
    const status=v.status==='current'?'Current logo':v.status==='directory'?'Directory artwork':'Archived artwork';
    return `<li>${logoHTML(profile,v,{label:`${profile.name} — ${status.toLowerCase()}`})}<div><strong>${status}</strong>${v.versionLabel?`<span class="ec-logo-version-label">${escape(v.versionLabel)}</span>`:''}${provenanceHTML(v,profile)}</div></li>`;
  }).join('')}</ul></details>`;
}
