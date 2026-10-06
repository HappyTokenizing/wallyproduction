export const key = value => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const memberAliases = {maplefinance:'maple',solanafoundation:'solana',stellardevelopmentfoundation:'stellar',avalabs:'avalanche',ixswap:'ixs',drvnlabo:'drvnlab',landinvestio:'landinvestcorp'};
const memberKey = value => memberAliases[key(value)] || key(value);
export function memberFor(profile, members) {
  const names = new Set([profile.name,...(profile.aliases || [])].map(memberKey));
  return members.find(member=>names.has(memberKey(member.name)));
}
export function filterProfiles(profiles, state, members) {
  const q=String(state.q||'').trim().toLowerCase();
  return profiles.filter(p => (state.status==='all'||p.directoryStatus===state.status)
    && (state.section==='all'||p.categories.some(c=>c.section===state.section))
    && (!state.members||memberFor(p,members))
    && (!q||[p.name,...p.aliases,p.description,p.kind,...p.categories.flatMap(c=>[c.section,c.name])].join(' ').toLowerCase().includes(q)))
    .sort((a,b)=>Number(!!memberFor(b,members))-Number(!!memberFor(a,members))||a.name.localeCompare(b.name));
}
export function safeURL(value, profile) {
  try { const u=new URL(value);if(!['https:','http:'].includes(u.protocol)||u.username||u.password)return '';
    if((profile.blockedWebsiteHosts||[]).some(h=>u.hostname===h||u.hostname.endsWith('.'+h)))return '';
    return u.href;
  } catch {return '';}
}
export function websiteFor(profile) {return profile.directoryStatus==='historical'?'':safeURL(profile.website,profile);}
