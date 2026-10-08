// Which captured news items belong to a directory profile. Used by /api/company-news.
// A profile matches an item when the feed tagged the item with one of the profile's newsTags, or when one of
// its newsRules matches the headline + summary: an alias appears as a whole word (case-sensitive, so "Circle"
// is not "circle"), at least one context word appears if the rule lists any, and no exclude phrase appears.
const escapeRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const cache = new Map();
const wordRe = (term, flags = '') => {
  const key = term + '\u0000' + flags;
  if (!cache.has(key)) cache.set(key, new RegExp(`(?:^|[^\\p{L}\\p{N}])${escapeRe(term)}(?=$|[^\\p{L}\\p{N}])`, 'u' + flags));
  return cache.get(key);
};
const GENERIC_CONTEXT = ['token', 'tokens', 'tokenized', 'tokenization', 'tokenize', 'onchain', 'on-chain', 'blockchain', 'stablecoin', 'RWA', 'RWAs', 'real-world asset', 'real-world assets', 'crypto', 'digital asset', 'digital assets', 'DeFi'];

// Profiles without curated rules get a conservative one from their own names: short single words also need
// an RWA context word, so a company called "Linear" doesn't collect every article that says "linear".
export function rulesFor(profile) {
  if (profile.newsRules?.length) return profile.newsRules;
  const names = [...new Set([profile.name, ...(profile.aliases || [])])].map(n => String(n || '').trim()).filter(n => n.length >= 3);
  if (!names.length) return [];
  const ambiguous = names.every(n => /^[A-Za-z]+$/.test(n) && n.length < 9);
  return [{ aliases: names, ...(ambiguous ? { context: GENERIC_CONTEXT } : {}) }];
}

export function matchesProfile(item, profile) {
  const tags = item.universe_tags || [], members = (item.members || []).filter(m => typeof m === 'string');
  if ((profile.newsTags || []).some(t => tags.includes(t) || members.includes(t))) return true;
  const text = `${item.headline || ''} ${item.summary || ''}`;
  return rulesFor(profile).some(rule =>
    (rule.aliases || []).some(a => a && wordRe(a).test(text)) &&
    (!rule.context?.length || rule.context.some(c => wordRe(c, 'i').test(text))) &&
    !(rule.exclude || []).some(x => wordRe(x, 'i').test(text)));
}

const httpsURL = value => { try { const u = new URL(value); return u.protocol === 'https:' || u.protocol === 'http:' ? u.href : null; } catch { return null; } };
// Preserve feed content and matching metadata; exclude unexpected provider internals.
export function slimItem(x) {
  const url = httpsURL(x?.url);
  if (!x || !x.id || !x.headline || !url) return null;
  return {
    id: String(x.id), headline: String(x.headline), url,
    source: { name: String(x.source?.name || x.source?.domain || '').slice(0, 120), domain: String(x.source?.domain || '').slice(0, 200) },
    published_at: x.published_at || x.ingested_at || null, section: x.section || null,
    summary: x.summary ? String(x.summary) : null,
    universe_tags: Array.isArray(x.universe_tags) ? x.universe_tags.filter(t => typeof t === 'string').slice(0, 30) : [],
    members: Array.isArray(x.members) ? x.members.filter(m => typeof m === 'string').slice(0, 30) : [],
    cluster_id: x.cluster_id || null,
    ingested_at: x.ingested_at || null, asset_class: x.asset_class || null, region: x.region || null,
    tags: Array.isArray(x.tags) ? x.tags.filter(t => typeof t === 'string') : [],
    flags: { weak_link: x.flags?.weak_link === true, date_unconfirmed: x.flags?.date_unconfirmed === true },
  };
}

const time = x => Date.parse(x.published_at || '') || 0;
// Storage retention is unlimited. Limits belong only to paginated responses.
export function mergeArchive(archived, fresh) {
  const byId = new Map();
  for (const x of [...(fresh || []).map(slimItem), ...(archived || [])]) if (x && !byId.has(x.id)) byId.set(x.id, x);
  return [...byId.values()].sort((a, b) => time(b) - time(a) || String(a.id).localeCompare(String(b.id)));
}

// A profile's news: matching, not hidden by the console, one item per story cluster, newest first.
export function companyNews(items, profile, { hidden = [], limit = Infinity } = {}) {
  const hide = new Set(hidden), clusters = new Set(), out = [];
  for (const x of [...(items || [])].sort((a, b) => time(b) - time(a))) {
    if (!x || hide.has(x.id) || !matchesProfile(x, profile)) continue;
    const key = x.cluster_id || x.id; if (clusters.has(key)) continue;
    clusters.add(key); out.push(x); if (out.length >= limit) break;
  }
  return out;
}
