# Employer source verification

Reviewed September 26, 2026. These employers are non-members; none are added to the member/logo roster. Membership and featured placement continue to come exclusively from that roster. A board being empty means no specific public vacancy was returned during this check, not that the company is not hiring.

| Requested company | Official careers source / recruitment board | Integration |
| --- | --- | --- |
| Robinhood | https://careers.robinhood.com/ links the `robinhood` Greenhouse feed | Greenhouse; original `first_published` |
| AAVE | https://aave.com/careers and https://jobs.eu.lever.co/aavelabs | EU Lever; individual `JobPosting.datePosted` |
| Morpho | https://morpho.org/jobs/ and https://jobs.ashbyhq.com/morpho | Ashby; `publishedAt` |
| Coinbase | https://www.coinbase.com/careers/positions; `coinbase` Greenhouse feed returns official Coinbase application URLs | Greenhouse; original `first_published` |
| RedStone | https://www.redstone.finance/careers embeds https://redstone.traffit.com/public/job_posts/published | Public Traffit; explicit `valid_start`; empty at review |
| Chainlink | https://chainlinklabs.com/open-roles embeds https://jobs.ashbyhq.com/chainlink-labs | Public embedded Ashby JSON + individual `JobPosting.datePosted`; standard posting API unavailable |
| Pyth | https://jobs.ashbyhq.com/pythnetwork (Pyth Data Association) | Ashby; empty at review |
| BnB | https://jobs.bnbchain.org/companies/bnb-chain; https://jobs.lever.co/pioneer-services listings identify BNB Chain | Lever; individual `JobPosting.datePosted`. This is BNB Chain, not the wider Binance exchange or every ecosystem company. |
| Ripple | https://ripple.com/careers/all-jobs/ | `ripple` Greenhouse feed; original `first_published` |
| Ethena | https://careers.ethena.fi/ links https://careers.ethena.fi/jobs.rss | Official Teamtailor RSS; `pubDate` |
| Superstate | https://superstate.com links https://jobs.lever.co/superstate | Existing Lever feed refreshed, not duplicated |
| Arbitrum | https://arbitrum.foundation/careers links https://jobs.lever.co/arbitrumfoundation | Lever; individual `JobPosting.datePosted` |
| Sky protocol | https://jobs.ashbyhq.com/skyecosystem (Sky Frontier Foundation) | Ashby; empty at review |
| RWAxyz | https://app.rwa.xyz/ links https://jobs.ashbyhq.com/RWA.xyz | Ashby; `publishedAt` |

Feeds refresh on demand with the existing 30-minute response cache. Successful empty responses remove old roles; failures preserve only the existing seven-day fallback. Role-page date lookups have bounded concurrency and a per-source time budget. No public website scripts are executed by the feed parser.

All recency rules are unchanged: default 30 days, choices 7/60/90, original employer posting dates only, undated roles excluded. At review, BNB Chain had roles within 90 days but none within 30; Superstate and RWA.xyz had active postings older than 90 days. Their careers links remain available in company coverage. General applications, dream-job submissions and talent pools are excluded.
