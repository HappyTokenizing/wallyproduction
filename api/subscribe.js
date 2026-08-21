// Newsletter signup — invisible beehiiv handoff (Vercel serverless function).
// The page POSTs {email} here and never sees the credentials; they live in two
// env vars already set in the Vercel project:
//   BEEHIIV_API_KEY        — beehiiv API key (server-side only)
//   BEEHIIV_PUBLICATION_ID — the publication new subscribers join
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.status(405).json({ success: false, message: 'POST only' }); return; }
  const key = process.env.BEEHIIV_API_KEY;
  const pub = process.env.BEEHIIV_PUBLICATION_ID;
  if (!key || !pub) { res.status(500).json({ success: false, message: 'server not configured' }); return; }
  const email = String((req.body || {}).email || '').trim().toLowerCase().slice(0, 254);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ success: false, message: 'Please enter a valid email.' });
    return;
  }
  try {
    const r = await fetch(`https://api.beehiiv.com/v2/publications/${pub}/subscriptions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        reactivate_existing: true,
        send_welcome_email: true,
        utm_source: 'wally',
        utm_medium: 'website',
        utm_campaign: 'heard_from_the_herd',
        referring_site: 'https://rwaf.xyz'
      })
    });
    if (!r.ok) {
      console.error('beehiiv error:', r.status, await r.text());
      res.status(502).json({ success: false, message: 'Unable to subscribe. Please try again.' });
      return;
    }
    res.status(200).json({ success: true, message: 'Welcome to the Herd.' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
}
