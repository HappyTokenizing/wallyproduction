export const key = value => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const memberAliases = {maplefinance:'maple',solanafoundation:'solana',stellardevelopmentfoundation:'stellar',avalabs:'avalanche',ixswap:'ixs',drvnlabo:'drvnlab',landinvestio:'landinvestcorp'};
const memberKey = value => memberAliases[key(value)] || key(value);
export function memberFor(profile, members) {
  const names = new Set([profile.name,...(profile.aliases || [])].map(memberKey));
  return members.find(member=>names.has(memberKey(member.name)));
}
const words = value => String(value||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
export function relevance(profile, query) {
  const q=words(query), compact=q.replace(/ /g,''), terms=q.split(' ');
  if(!q)return 0;
  const names=[profile.name,...(profile.aliases||[])].map(words);
  if(names.some(n=>n.replace(/ /g,'')===compact))return 0;
  if(names.some(n=>n.startsWith(q+' ')))return 1;
  if(names.some(n=>terms.every(t=>n.split(' ').includes(t))))return 2;
  if(names.some(n=>terms.every(t=>n.split(' ').some(w=>w.startsWith(t)))))return 3;
  if(names.some(n=>n.replace(/ /g,'').includes(compact)))return 4;
  const text=words([profile.description,profile.kind,...profile.categories.flatMap(c=>[c.section,c.name])].join(' '));
  if(terms.every(t=>text.split(' ').includes(t)))return 5;
  if(text.includes(q)||terms.every(t=>text.includes(t)))return 6;
  return Infinity;
}
export const memberCount = members => new Set(members.filter(m=>m.name).map(m=>memberKey(m.name))).size;
export function filterProfiles(profiles, state, members) {
  const matched=profiles.filter(p => (state.status==='all'||p.directoryStatus===state.status)
    && (state.section==='all'||p.categories.some(c=>c.section===state.section))
    && (!state.members||memberFor(p,members)))
    .map(p=>({p,rank:relevance(p,state.q),member:!!memberFor(p,members)}))
    .filter(x=>Number.isFinite(x.rank));
  return matched.sort((a,b)=>a.rank-b.rank||Number(b.member)-Number(a.member)||a.p.name.localeCompare(b.p.name)).map(x=>x.p);
}
export function safeURL(value, profile) {
  try { const u=new URL(value);if(!['https:','http:'].includes(u.protocol)||u.username||u.password)return '';
    if((profile.blockedWebsiteHosts||[]).some(h=>u.hostname===h||u.hostname.endsWith('.'+h)))return '';
    return u.href;
  } catch {return '';}
}
export function websiteFor(profile) {return profile.directoryStatus==='historical'?'':safeURL(profile.website,profile);}
