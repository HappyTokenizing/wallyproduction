# Permanent news archive

News is retained without count- or age-based eviction. Collection stores the feed's
headlines, publisher links, summaries, publication dates and matching metadata;
it does not copy publishers' full articles. Moderation hides stories without
removing their archive records.

The previous implementation proxied a 50-story upstream window, capped its private
archive at 5,000 stories, and only attempted collection on a visitor request.
The production `/api/company-news` endpoint returned 404 when checked on
2026-10-08. Do not describe production archival as verified until deployment
and the checks below succeed.

## Storage and access

- Private Vercel Blob partitions: `news-archive/v2/months/YYYY-MM.json`.
- Concurrent writes re-read and merge using ETag conditional writes. Exhausted
  retries fail the collection rather than report success.
- The legacy `news-archive/v1/items.json` is always included, never deleted.
- `/api/news?cursor=…` pages through saved history. `q` searches the full archive.
- `/api/company-news?id=…&cursor=…` matches a canonical profile against archived
  headlines, summaries and entity tags, including stories no longer in the feed.
- Fifty is the default response page size, never a storage limit. Both news and
  company dialogs expose older-story controls.
- `news-archive/v2/status.json` records the last successful capture. A failed
  upstream refresh can serve existing history with an explicit warning. Missing
  storage returns an error, not a falsely empty successful archive.

## Deployment requirements

Production must have `RWANEWS_KEY`, a connected **private** Blob store supplying
`BLOB_READ_WRITE_TOKEN`, and `CRON_SECRET`. Keep `SUPABASE_JOBS_SECRET` for existing
moderation. No secrets belong in git. `SITE_PUBLIC_API_ORIGIN` must be unset on
production; staging may retain its production mirror.

`vercel.json` schedules `/api/collect-news` every five minutes. This cadence
requires a Vercel plan supporting sub-daily cron (Pro); Vercel sends the configured
CRON_SECRET as a Bearer authorization header. The collector skips mirrored
projects. Deploy through GitHub, then check the Vercel Cron Jobs run log.

Official references:
- https://vercel.com/docs/cron-jobs/manage-cron-jobs
- https://vercel.com/docs/vercel-blob/using-blob-sdk

## Required live verification

Dashboard inspection on 2026-10-08 confirmed the production project is on Pro,
has Production-scoped `RWANEWS_KEY`, `BLOB_READ_WRITE_TOKEN` and `CRON_SECRET`,
and is connected to a private Blob store. No credential values were revealed or
changed. The Cron Jobs screen showed the feature enabled but no deployed jobs.
Production was still on `97e0677`; configuration alone does not activate the new
collector. The Git deployment and the following runtime checks remain required.

1. Confirm the scheduler is enabled and succeeds without site visitors.
2. Confirm `/api/news` returns `archive.retention: indefinite` and a recent
   `lastSuccessfulCollection`, with no warning.
3. After the upstream window rotates, confirm `archive.stored` exceeds 50,
   an older-story cursor still reaches old IDs, and a matching company retains
   an old story.
4. Hide then unhide a story through normal admin controls; its data must remain
   in Blob and disappear/reappear in the public results.

## Coverage limitations and recovery

The upstream endpoint only supplies its latest 50 items. Frequent scheduled
capture reduces missed windows, but cannot prove that every publisher story has
been captured during an outage or a burst of more than 50 between captures.
A provider archive/export or webhook is required for a guaranteed historical
backfill. Never invent missing news. Feed-provider archive access has not been
established. Existing v1 history is preserved automatically.

Storage has no expiry rule in this application. Keep the Blob store and billing
active. Monthly partitions bound write size; reads currently scan the monthly
partitions with bounded concurrency. As volume grows, a separate search index
can accelerate retrieval without changing or deleting the retained records.
