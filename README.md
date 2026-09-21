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
