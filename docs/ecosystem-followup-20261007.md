# Ecosystem directory follow-up — 7 October 2026

27 new profiles bring the directory to 1,084 unique identities (911 current, 139 historical initiatives and 34 awaiting review). All 831 upstream identities and 844 source map placements are retained.

The 26 requested names and ten requested perpetuals platforms are represented. Existing profiles are reused for Orca, JPMorgan/Kinexys, ether.fi, USD.AI, Reserve, lend.xyz, Chainlink/CCIP, XRP Ledger, Cap and Ondo. Orca is now verified as current. Base Chain is separate from Base App; bStocks is a distinct Binance product linked explicitly to its parent company. Neither distinction creates a second company profile for the same entity.

RWA Perps has ten profiles, including Ondo’s existing profile. General-purpose DEXs are categorized under Trading and liquidity rather than described as asset issuers. Perpetuals descriptions distinguish derivative exposure from underlying ownership. Source links and review dates appear in profile dialogs. Lend.xyz retains its earlier pre-launch caveat because its current site could not be reverified in this review.

The six requested logo repairs use artwork from the official company sites, with original colors and appropriate light/dark backgrounds. 235 missing or unusable logos are replaced, including SEDA Protocol. All 911 current profiles have a logo; 14 historical or unverified records still use initials. The unresolved records and reasons are recorded in `data/research/logo-audit-20261007.json`. Twenty existing logos also receive a contrasting background without recoloring the artwork. Most new assets come from official sites; cached favicons and secondary artwork repositories are explicitly identified in provenance metadata. All assets are bundled locally. No runtime third-party logo service is needed.

Search ranks exact names and aliases first, then leading phrases, whole words, word prefixes, name substrings and finally descriptive text. Membership breaks equal-relevance ties; alphabetical order makes the final tie deterministic. Category maps preserve this order. With no query, RWAF members lead every category.

Summary labels are Total Companies, Active Companies, Failed Initiatives and RWAF Members. The member count reads the live admin roster and refreshes after deletion. The Failed Initiatives card counts only explicitly documented failures (currently Archblock), not all 139 historical records; the distinction is stated in the footer and tooltip.

## Reproduce

Run `node scripts/import-ecosystem.mjs`, then `npm ci` and `npm test`.

- `data/research/requested-additions.json`: new profiles and official evidence.
- `data/research/profile-updates.json`: explicit corrections and added placements for existing IDs.
- `data/research/logos-followup.json` and `logos-missing.json`: artwork provenance and display settings.
- `data/research/logo-display.json`: background contrast corrections.
- `data/research/logo-audit-20261007.json`: remaining unresolved artwork.

The original vendor snapshot remains unchanged. All profile updates are applied during import, preserving legacy IDs and existing favorites. This change targets staging only.
