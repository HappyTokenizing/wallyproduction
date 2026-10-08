# Ecosystem quarterly statistics

The ecosystem directory now has a Stats button opening four charts: new firms,
M&A exits, cumulative project starts, and failures. Filters cover directory
sector, current RWAF membership, founding versus first launch, and quarter range.
Hover, keyboard focus, or tap reveals each quarter's companies and source links.

Each chart can be copied as a PNG, downloaded as a 2400 × 1400 PNG, or exported
as tab-separated data. Images retain the selected criteria, reporting cutoff,
date coverage, and methodology so screenshots cannot silently lose those limits.

## Definitions and coverage

The reporting cutoff is the directory snapshot date, currently 2026-10-07.
Quarter assignment uses verified founding or launch dates, never directory
import dates, review dates, or an assumed January date for a year-only source.

- Starts: one canonical profile per founding/launch event. Founding takes
  precedence when both are recorded. The initial dataset has 15 quarter-dated
  starts, three founding-year-only records, and 1,113 profiles without a verified
  start date, out of 1,131 profiles.
- Exits: completed acquisitions or mergers, deduplicated by transaction ID.
  Seven of the eight documented transactions have verified completion quarters.
  The Coreum/Sologenic transaction remains undated and is excluded from quarterly
  bars while remaining in the directory's Exits count.
- Growth: cumulative verified starts, including the baseline before the selected
  range. This measures an incomplete dated sample, not net active companies or a
  complete industry census. Exits and failures are not subtracted.
- Failures: sourced closure/bankruptcy milestones for profiles explicitly marked
  as failed initiatives. Neufund is dated to its announced closure on 2022-01-17;
  Archblock is dated to its Chapter 11 petition on 2026-02-06, not an assumed
  operational shutdown. Historical directory status alone is not a failure.

Year-only, unknown, and future dates are excluded and reported separately.
Empty quarters mean no verified events in this dataset, not proof of no industry
activity. The current quarter is marked incomplete. Sector and membership
criteria use the current directory and member roster, not historical membership.
General-purpose blockchain launches do not imply the beginning of RWA activity.
Substantial date research is still required for industry-wide statistics.

## Maintaining the data

Add reviewed start/failure facts to `data/research/statistics-events.json` using
an existing canonical profile ID, unique event ID, event type (`founding`,
`launch`, or `failure`), date, explanatory note, review date, and source links.
Supported precision is YYYY, YYYY-MM, YYYY-MM-DD, or YYYY-Q1 through YYYY-Q4.
Preserve the precision established by the evidence. The importer rejects invalid
dates, missing sources, unknown profile IDs, duplicate event types per profile,
and failure events for profiles not marked as failed initiatives.

Add sourced M&A completion dates as `completedDate` in
`data/research/exits.json`; announcement dates must not substitute for completion.
Run `node scripts/import-ecosystem.mjs` to regenerate the directory, followed by
`npm test`.

## Validation

- 75 unit tests pass, including quarter boundaries, leap dates, year-only and
  future exclusions, canonical identity deduplication, cumulative baselines,
  membership/sector filters, real-data coverage, escaping, and TSV formula safety.
- Chromium desktop/mobile checks pass with no page errors: dialog controls,
  company/source hover details, keyboard access, date ranges, criteria changes,
  actual PNG clipboard writes, 2400 × 1400 PNG download, text clipboard export,
  mobile overflow containment, Escape dismissal, and restored focus.
- Exported PNG and desktop/mobile layouts were visually inspected.

This change targets staging. Production is unchanged.
