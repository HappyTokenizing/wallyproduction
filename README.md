# RWA Foundation website

Static HTML and Vercel Node functions. `npm ci` installs the server storage SDK; `npm test` runs logo persistence, concurrency, recovery and image-bound tests.

## Member logos

`/api/logos` stores the logo images, deletions and ordering together in the private Vercel Blob object `member-logos.json`. This data survives Git deployments. Each project must have a **separate** private Blob store connected with `BLOB_READ_WRITE_TOKEN`. Production and staging must never share this token. Existing built-in logos remain in `index.html`.

Configure `JOBS_ADMIN_PW` with the current console password, or `JOBS_ADMIN_PW_SHA256` with its SHA-256 hex digest. The client console uses its existing password digest. The API validates the password server-side before writing. Never commit environment files or tokens.

Reads bypass CDN/blob caches. Writes require the last read ETag, reject conflicts with HTTP 409, and reject invalid/oversized collections as a whole. The client serializes saves and retains unsaved drafts. A visible status confirms publication; **Retry** resends failed saves. **Load latest logos** resolves concurrent-session conflicts, keeping the browser draft available for explicit restoration.

Old browser-only uploads can be recovered using **Restore browser copy** in the original browser. They cannot be recovered from the server if the previous Supabase connection never saved them.

Uploads are decoded to PNG, cropped to visible artwork (transparent or plain white margins), and resized proportionally to at most 400 × 64 pixels. The wall displays images at up to 200 × 32 pixels; the marquee uses up to 175 × 28 pixels. Original proportions are preserved.

## Staging

Staging uses the same tracked source tree as production and a separate Blob store. `SITE_PUBLIC_API_ORIGIN=https://www.rwaf.xyz` mirrors production's public news/stat GET responses without copying hidden API credentials. It never proxies logo writes. Newsletter environment settings remain independently configured in each Vercel project. The older job/news moderation APIs still use their existing Supabase configuration; the member logo manager no longer depends on it.

## RWAF Members news

The news roster is derived directly from `logoAll()`, the same current collection used by the foundation logo wall and homepage banner. There is no separate member list to maintain. Use the organization's name as the logo name when uploading.

The feed matches current logo names against headline and summary words (case, punctuation and spacing are normalized), or exact upstream member hints. Upstream hints cannot mark organizations absent from the logo wall as members. Matching stories receive a gold **RWAF Member** badge, the matched organization names and a gold card accent. The **RWAF Members** filter is always available and shows the number of visible member stories; hidden stories remain excluded. This identifies member coverage, not a paid article or endorsement.

Logo loads, additions, removals and resets reclassify already-loaded news immediately. Returning to the news page refreshes the saved logo list. Stories using only an unlisted alias, with no matching headline/summary name or upstream member hint, remain untagged.

## Research and live X articles

`/research/` retains the existing report series and adds **WALLY articles** and **Zeus’ Corner** tabs. Legacy Reading Room links route here; sample article cards have been removed. `/api/articles?source=wally|zeus` reads genuine long-form Articles from the official X API, including titles, summaries, cover images when supplied, dates and individual article links. Ordinary posts and reposts are excluded. Each request scans up to 100 posts; **Load older articles** continues through the available timeline, including batches containing no Articles.

Production uses the existing `X_BEARER_TOKEN` and private `BLOB_READ_WRITE_TOKEN`. The X app must have working read access and credits. Staging mirrors production with `SITE_PUBLIC_API_ORIGIN`. Responses are stored privately for one hour and refreshed on demand; a short atomic lease prevents simultaneous visitors multiplying X requests. A failed refresh retains the last saved response and backs off for an hour. The website clearly identifies stale data or unavailable feeds rather than substituting sample articles.

Initial accounts are `@WALLY_DAO` and `@ZeusRWA`. On first connection, permanent X user IDs are saved under `x-articles/v1/accounts/`. Later lookups use these IDs, so renaming WALLY to `@HerdCollection` keeps the same feed. The displayed handle refreshes within about seven hours of a rename, on the next visit. Optional `X_WALLY_USERNAME` / `X_ZEUS_USERNAME` configure initial discovery only; changing a stored account identity requires a deliberate migration. Cached article data lives in the same private Blob store, under `x-articles/v1/`, independently of deployments.

## Editorial terminology

Use **onchain** without a dash throughout website copy (capitalized **Onchain** at the start of a sentence). The shared `assets/terminology.js` display rule also normalizes incoming text from news and X articles, including Unicode dash variants, without changing source URLs or stored originals. The news category **On-Chain & Protocol** is displayed and filtered as **Protocol**. Load this shared script on any new HTML page.

## Visitor analytics

Vercel Web Analytics is enabled separately on the production and staging projects. Every HTML page loads `assets/analytics.js`; it loads Vercel's same-origin collector only on the canonical live domains and each project's main alias. Local development and branch previews are excluded. No additional analytics service or Analytics Plus add-on is required.

Pageviews are explicit: the main router dispatches `rwaf:pageview` after navigation, and Research does the same after tab selection. This distinguishes `/news`, `/meet`, `/research/wally` and `/research/zeus` in the dashboard even though navigation uses hashes. Repeated selection of the same page and in-page anchors do not generate extra views. Research reports retain their actual paths. New routers must dispatch the event after updating their route state.

Admin views are excluded. Query strings and arbitrary hashes are removed from tracked page URLs, and the integration does not send form values, identify visitors, or enable cookies. Analytics begin at installation; this does not backfill past visits or create a permanent archive of analytics data. View traffic in the Vercel dashboard under Analytics for the relevant project.
