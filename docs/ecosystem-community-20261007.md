# Community directory update — 7 October 2026

This staging update adds 47 profiles (46 current and RealityFi awaiting review), removes Novastro at the owner's request, and promotes the existing Real Finance profile after checking its official roadmap. The directory now contains 1,130 canonical profiles: 957 current, 139 historical and 34 awaiting review. The preceding batch is documented in `ecosystem-followup-20261007.md`.

## Organization and identity

- Collectibles groups Collector Crypt, Beezie, Phygitals, Courtyard, DualMint and GRT Wines.
- Data & analytics groups RWA.xyz, DefiLlama, Token Terminal, Refraction Research, Dune and Blockworks.
- Brokerage & exchanges groups the requested trading platforms. Pons is categorized as token-launch infrastructure, not a licensed stock broker.
- RWA Perps retains the preceding ten profiles and adds RISEx, Arcus and Hyperliquid. Arcus's description retains the official site's perpetuals-waitlist caveat.
- TX updates the existing Coreum identity and preserves its old search alias. Real Finance, GRT Wines, Jade City, VanEck, Quant, Lumia, USDD, StrikeX and IOTA are reused rather than duplicated. Pi Network is distinct from the existing Pi Protocol profile; its entry does not claim a verified RWA deployment.
- RealityFi uses the owner-confirmed `https://x.com/RealityFi_xyz` profile. Its website is reported unavailable, so current operations and artwork remain unverified. It is not classified as failed. Metric remains pending because its identity could not be confirmed.

Novastro's exclusion is explicit in `data/research/excluded-profiles.json`. The importer removes its profile, map placements and references while preserving the upstream vendor snapshot.

## Artwork

All 46 new current profiles have bundled logos. Ten existing profiles receive artwork or display fixes: Stellar, Sui, Intesa Sanpaolo, NatWest Group, Bank of England, World Bank, Orca, GRT Wines, Jade City and VanEck. Sui uses the current official brand kit; Stellar uses its official 2026 press kit; VanEck uses its official vector wordmark. GRT Wines retains existing artwork with its original colors instead of inversion.

Original white or pale artwork uses dark backgrounds. The repaired directory artwork takes precedence over older member icons. Company assets are kept locally, with source URLs and review dates in `logos-community-20261007.json` and `logos-community-fixes-20261007.json`. Where direct retrieval failed, cached domain favicons are explicitly identified; MultiBank's available favicon is low resolution and remains a quality limitation.

All 957 current profiles have logos. Fifteen historical or unverified records retain initials; see the updated `logo-audit-20261007.json`. An unavailable website does not, by itself, establish failure. The Failed Initiatives total remains one, for the previously documented Archblock shutdown and bankruptcy.

## Validation

- `npm ci`: successful; zero reported dependency vulnerabilities.
- `npm test`: 66 passing tests, including exclusions, canonical identity reuse, new categories, logo provenance, member ordering and relevance-ranked search.
- Re-running `node scripts/import-ecosystem.mjs` produces identical directory output.
- Chromium checks: desktop and mobile layouts, six Collectibles profiles, six Data profiles, thirteen RWA Perps profiles, member ordering/count refresh, exact search, removed Novastro, ten repaired rendered logos, and all 56 new/repaired logo assets decoding.
- No browser page errors in the completed checks. Public API reads use staging; the preview performs no API writes.

This update does not change production or upstream vendor files. Deployment is through the staging GitHub main branch.
