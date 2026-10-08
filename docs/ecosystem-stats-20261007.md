# Ecosystem quarterly statistics

The ecosystem directory has three adjacent view buttons: Directory, Ecosystem
map, and Stats. Stats appears directly to the right of Ecosystem map and displays
its charts inline, with all three view buttons always available. Each view keeps
its filter selections when switching away and back. Stats contains four charts: new firms,
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
`launch`, `industry_entry`, or `failure`), date, explanatory note, review date, and source links.
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
- Chromium desktop/mobile checks pass with no page errors: view switching controls,
  company/source hover details, keyboard access, date ranges, criteria changes,
  actual PNG clipboard writes, 2400 × 1400 PNG download, text clipboard export,
  mobile overflow containment, and keyboard view navigation.
- Exported PNG and desktop/mobile layouts were visually inspected.

This change targets staging. Production is unchanged.

## 2026-10-08 correction: industry entry, not corporate age

Banks, institutions and every pre-2011 firm now require a sourced
`industry_entry` event for their first tokenization/RWA project. Corporate
founding facts remain in the research inputs for provenance but are excluded
from generated starts and cannot leak through the founding/launch filters.
These profiles display **RWA entry**, never a relabelled corporate birth date.
Unknown entry dates remain explicitly under review. Exact days are used only
where evidence establishes them; month/year sources keep their precision.

The definition includes announced pilots and concrete supporting infrastructure
for tokenized assets, deposits or stablecoins. Ordinary card credential tokens,
generic crypto trading and broad blockchain commentary do not establish entry.
Dates describe the earliest corroborated activity found in reviewed sources,
not a guarantee that an earlier private experiment never existed. The policy
is in `data/research/industry-entry-policy.json`; dated replacements are in
`statistics-events-industry-entry.json`. The importer automatically applies the
rule to newly added institutions and any future pre-2011 start records.


Research review on 2026-10-08: the policy covers 127 profiles. 105 have
sourced replacement milestones; 22 remain unverified and are excluded from the
start charts. See `data/research/industry-entry-review-20261008.json` for every
affected profile, superseded corporate date, evidence and pending-review reason.
Including the subsequent founding/launch research passes, the annual chart has
834 sourced starts among 1,154 profiles; 320 remain undated under the corrected rule.
This coverage reduction is intentional: corporate age is not industry growth.

The preceding source pass added 22 institution/infrastructure milestones, including
Deutsche Bank's H2 2015 corporate-bond prototype, BNP Paribas' April 2016 share
register agreement, the 2016 Fundchain work of CACEIS and PwC, and the April 2023
Spruce pilots of Wellington and T. Rowe Price. Pilot, infrastructure and project
agreement notes explicitly distinguish these events from commercial launches.
Season/half-year evidence remains year-only; a publication day is not substituted
for an earlier transaction or pilot date. Remaining profiles stay under review.

A further source pass resolves 26 profiles using primary announcements, project
partners and a founder interview. These include the 2017 Commerzbank/KfW
securities pilot, the 2016 BNY settlement-coin partnership and KPMG FundsDLT
project, SteelWave Digital in August 2021, and CSOP's June 2026 tokenized fund.
Amundi uses the actual November 4, 2025 first transaction, not the later release.
Completed pilots without an execution month/day retain year precision; the
Bankhaus Scheich release only establishes its pilot as an early-2020 event, so
it retains Q1 precision. Ant's international-team predecessor and subsidiary
versus parent identities are documented explicitly. The ABN AMRO collateral
lead stays in the review log because DLT messaging alone does not establish
asset tokenization. No companies, membership status or logos changed.

This pass also covers Hitachi's 2016 electronic-check experiment, Invesco's
2023 ERC3643 resource-development project, PostFinance's deposit-token project,
and 2024 digital-securities trials involving BayernLB, L-Bank and Spuerkeess.
The Bundesbank's transaction chronology establishes exact trial dates where
individual banks' press releases alone would only support broader precision.

The next pass sources another 34 previously undated profiles: 23 company
foundings and 11 explicitly labeled product/project launches. Sources include
company histories, founder interviews, company-issued announcements, official
company profiles and Security Token Market's SEC-filed financial statements.
Examples include Euler, KAST, BAXUS, Rabby, Kamino, Relay, HIFI and VerifyVASP.
Twenty additions have year precision, eight have month precision and six have
day precision. Quarterly coverage is now 154 dated starts; 457 year-only starts
remain in annual charts without being assigned an invented quarter.

Conflicting official dates for Blocksquare and Spydra remain unresolved. The
batch audit in `data/research/founding-review-followup-20261008.json` records all
34 additions, the conflicting sources and the before/after coverage. This pass
changes no company profiles, logos or membership data, and does not claim the
remaining 543 unknown dates have been exhaustively resolved.

A subsequent pass adds 29 more previously undated profiles: 20 foundings and
nine explicitly labeled launches. These include Aerodrome, Spark, XDC, Fluid,
Backpack, Bitget Wallet, StraitsX, Artory and Libre. Neufund's original lightpaper
establishes its September 2016 founding without changing its separate closure
record. Matter Labs' founding dates the developer company, not the separately
listed ZKsync network; parent histories and later rebrands are not substituted
for the relevant project start.

This batch adds three day-precision dates, six month-precision dates and 20
year-only dates. Annual coverage is 640; quarterly coverage is 163, with another
477 year-only starts available in the annual chart. The 514 remaining profiles
stay undated. The audit in
`data/research/founding-review-continuation2-20261008.json` records the additions
and seven unresolved leads, including conflicting Etherfuse histories and
FalconX's still-missing institutional tokenization milestone. Profiles, logos,
membership and all previously sourced events remain unchanged.

The next continuation adds 22 previously undated profiles: 16 foundings and
six explicitly labeled launches. These include RealT, Moss, Atlendis, Aurus,
Anotherblock, Angle, TrueFi, MultiversX, Gluwa and Creditcoin. Etherfuse uses
2019 at the owner's explicit request; both its official company profile and
the conflicting May 2021 founder case study remain attached to the event.
This records the selection without claiming the source conflict was resolved.

Three additions have exact days, two have months, one has a sourced quarter,
and 16 retain year precision. Landshare's description of beginning in early
2021 stays year-only. Kava's sources agree on November 2019 but differ on the
day, so the month is retained. Company incorporation, developer history,
mainnet launch and rebranding remain distinguished in the event notes.

Annual coverage is now 662 of 1,154 profiles, with 492 still undated. Quarterly
coverage is 169, with another 493 year-only starts available in annual charts.
The audit in `data/research/founding-review-continuation3-20261008.json` records
all additions and unresolved leads. This pass changes no company profiles,
logos, membership, lifecycle records or previously sourced events.

A further continuation resolves 22 previously undated profiles: 13 foundings
and nine explicitly labeled launches. These include Ctrl Alt, SEDA, RealX,
Kula, QFEX, GAIB, Anemoy, Grove, ZKsync, Stable and Quadrata. Company profiles,
project announcements, team governance histories and a founder interview
provide the supporting evidence. Similarly named businesses are distinguished
explicitly, including Kula, RealX, EstateX and Pharos.

This batch adds four day-precision dates, five month-precision dates and 13
year-only dates. Zivoe uses the team's retrospective September 2024 launch,
not the July target in its earlier announcement. Quadrata's March introduction
is distinguished from its later Ethereum mainnet release. ZKsync uses its
original 2020 network launch, separately from Era and Matter Labs' formation.
GrtWines retains year precision while its January/April rollout is reconciled.

Annual coverage is now 684 of 1,154 profiles; 470 remain undated. Quarterly
coverage is 178, with 506 additional year-only dates.
`data/research/founding-review-continuation4-20261008.json` records the batch,
coverage and unresolved identity/history conflicts. Etherfuse remains 2019
as previously requested; profiles, logos, memberships, lifecycle status and
all prior events remain unchanged.


## Publication batch: 150 additional sourced starts

At the owner's request, this batch publishes 150 additions on top of the
textbook update c298eaf. It adds 145 company founding years and five explicitly
labeled launches (SegMint, Beanstalk, Gold DAO, Nostra and edgeX). Source notes
distinguish original company histories from rebrands and separate products.
Company-reported LinkedIn dates and secondary CB Insights, Dealroom and Digital
Asset Research records are attributed rather than presented as incorporation
certificates. Some source pages were reviewed through their indexed text.

Annual coverage rises from 684 to 834 of 1,154 profiles; 320 remain undated.
Quarterly coverage rises from 178 to 183, with 651 additional year-only dates.
Year-only records are not assigned an invented quarter. The audit in
`data/research/founding-review-batch150-20261008.json` lists every addition and
rejected candidates. Unrelated Joltify, Evolve Pro and Blubird search results
were discarded. Institutional founding dates without a tokenization milestone
remain pending, as do sources blocked by the existing directory policy.

The 150-record publication follows the owner's revised scope; it does not
claim that the original 200-record research target or the remaining profiles
are complete. No company profiles, logos, membership, lifecycle status or prior
events change. Etherfuse remains 2019 as previously requested.
