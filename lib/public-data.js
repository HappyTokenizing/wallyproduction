// Staging can mirror production's public feeds without copying private API keys.
export async function mirrorPublicData(req, res, path) {
  const origin = process.env.SITE_PUBLIC_API_ORIGIN;
  if (!origin || req.method !== 'GET') return false;
  try {
    const url = new URL(path, origin);
    if (path === '/api/news' && req.query?.hidden) url.searchParams.set('hidden', '1');
    const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
    res.setHeader('Cache-Control', path === '/api/news' && req.query?.hidden ? 'no-store' : 's-maxage=60');
    res.status(response.status).json(await response.json());
  } catch {
    res.status(502).json({ error: 'Public feed temporarily unavailable.' });
  }
  return true;
}
