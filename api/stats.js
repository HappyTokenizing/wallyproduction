// Live homepage stat cards — Vercel serverless function.
// GET /api/stats → { stable, rwaMcap, rwaTvl, herd } — each {value,...} or null.
// The response is edge-cached for an hour (s-maxage), so the sources are
// scraped at most hourly no matter how much traffic the site gets.
// Every scraper fails soft: a null just means the page keeps its baked number.
// Env (optional): X_BEARER_TOKEN — enables the live follower count via the X API.
const UA = { 'User-Agent': 'Mozilla/5.0 (compatible; RWAFoundationSite/1.0; +https://rwaf.xyz)' };

// Token Terminal: stablecoin market cap. Their explorer page embeds one JSON
// cohort total per asset class; stablecoins dwarf the rest, so the largest
// total (sanity-bounded) is the stablecoin figure.
async function statStableTT() {
  const html = await (await fetch('https://www.tokenterminal.com/explorer/tokenized-assets', { headers: UA })).text();
  let best = 0;
  for (const m of html.matchAll(/"cohort_count":\d+,"total":\{"value":([0-9.]+)\}/g)) {
    const v = parseFloat(m[1]);
    if (v > best) best = v;
  }
  return (best > 100e9 && best < 2000e9) ? { value: best } : null;
}

// RWA.xyz: "Distributed Asset Value" — their headline for RWA value onchain
// excluding stablecoins (which card 1 already covers). Parsed from the
// server-rendered stat tile, with its 30-day change.
async function statRwaXyz() {
  const html = await (await fetch('https://app.rwa.xyz/', { headers: UA })).text();
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  const m = text.match(/Distributed Asset Value \$([0-9.]+)([BTM])\s*[▲▼]?\s*([+-])\s*([0-9.]+)\s*%\s*from\s*30d/);
  if (!m) return null;
  const mult = m[2] === 'T' ? 1e12 : m[2] === 'B' ? 1e9 : 1e6;
  const value = parseFloat(m[1]) * mult;
  if (!(value > 1e9 && value < 5e12)) return null;
  return { value, pct30d: parseFloat(m[3] + m[4]) };
}

// DefiLlama: TVL of the RWA protocol category, plus 7d/30d change, from the
// same lite endpoint their own site uses. No scraping — a real API.
async function statRwaTvl() {
  const d = await (await fetch('https://api.llama.fi/lite/protocols2', { headers: UA })).json();
  let tvl = 0, prevW = 0, prevM = 0;
  for (const p of d.protocols || []) {
    if (p.category !== 'RWA') continue;
    tvl += p.tvl || 0; prevW += p.tvlPrevWeek || 0; prevM += p.tvlPrevMonth || 0;
  }
  if (!(tvl > 1e9 && tvl < 1e12)) return null;
  return {
    value: tvl,
    pct7d: prevW ? +(((tvl - prevW) / prevW) * 100).toFixed(1) : null,
    pct30d: prevM ? +(((tvl - prevM) / prevM) * 100).toFixed(1) : null
  };
}

// X followers for @RWAFoundation_. X blocks anonymous scraping, so this only
// works when an API bearer token is configured; without it the card keeps its
// baked count. X rate limits are tight even on paid tiers, so the count is
// cached in the wally_site table and X itself is called at most twice a day.
const SB = 'https://qrmbiestcjbedavsorrj.supabase.co/rest/v1/wally_site';
const sbHeaders = k => ({ apikey: k, Authorization: 'Bearer ' + k, 'Content-Type': 'application/json' });
async function statHerd() {
  const tok = process.env.X_BEARER_TOKEN;
  if (!tok) return null;
  const sk = process.env.SUPABASE_JOBS_SECRET;
  let cached = null;
  if (sk) {
    try {
      const r = await fetch(SB + '?k=eq.herd_cache&select=v', { headers: sbHeaders(sk) });
      cached = r.ok ? (((await r.json())[0] || {}).v || null) : null;
      if (cached && cached.value && Date.now() - (cached.at || 0) < 12 * 3600 * 1000) return { value: cached.value };
    } catch (e) {}
  }
  const r = await fetch('https://api.x.com/2/users/by/username/RWAFoundation_?user.fields=public_metrics',
    { headers: { Authorization: 'Bearer ' + tok } });
  if (!r.ok) return (cached && cached.value) ? { value: cached.value } : null; // stale beats nothing
  const d = await r.json();
  const n = d && d.data && d.data.public_metrics && d.data.public_metrics.followers_count;
  if (!n) return (cached && cached.value) ? { value: cached.value } : null;
  if (sk) {
    try {
      await fetch(SB + '?on_conflict=k', {
        method: 'POST',
        headers: { ...sbHeaders(sk), Prefer: 'resolution=merge-duplicates' },
        body: JSON.stringify({ k: 'herd_cache', v: { value: n, at: Date.now() }, updated_at: new Date().toISOString() })
      });
    } catch (e) {}
  }
  return { value: n };
}

const soft = p => p.then(v => v).catch(() => null);

export default async function handler(req, res) {
  if (req.method !== 'GET') { res.status(405).json({ error: 'GET only' }); return; }
  const [stable, rwaMcap, rwaTvl, herd] = await Promise.all([
    soft(statStableTT()), soft(statRwaXyz()), soft(statRwaTvl()), soft(statHerd())
  ]);
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=1800');
  res.status(200).json({ stable, rwaMcap, rwaTvl, herd, at: new Date().toISOString() });
}
