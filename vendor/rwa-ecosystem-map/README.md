# RWA ecosystem snapshot

Source: https://github.com/Bucktony/rwa-ecosystem-map
Source revision: 8669aa303764fa0736284e20e58eb0766eb66063 (October 4, 2026).

Curated by Ray Buckton / RWA News Today from the existing company list, RWA World, RWA.io and company references. See HANDOFF.md for attribution and snapshot boundaries. Names and logo rights remain with their owners; this handoff does not carry an open-source license.

The original profiles and category map are retained here. `legacy.json` captures the previous RWAF directory. `scripts/import-ecosystem.mjs` merges that directory using an explicit identity crosswalk; short IDs and shared domains must not be fuzzy-matched. All 831 source profiles survive. The older directory contributes 35 additional profiles labeled review pending and merges 83 records into existing identities. The two former Franklin Templeton records are merged.

Run `node scripts/import-ecosystem.mjs` on Node 24 after an intentional source update, then `npm test`. Generated files are data/ecosystem-directory.json and data/ecosystem-import-report.json. Bundled logos are in /ecosystem. There are no additional hosting services or scheduled syncs.

The native RWAF renderer replaces the React wrapper to preserve the host site's design without adding a React/Tailwind build. It retains all category placements, logos, descriptions, lifecycle notes, related entities, reviewed dates and official references. Map placements can point to the same canonical profile in more than one category. Directory results and summary counts use unique profile IDs.

Membership is computed at render time from the saved logo-admin roster, never imported from source or old `member` flags. Current/historical labels are source classifications, not ongoing verification. Historical website links remain disabled. Retained unreviewed entries are separately filterable.
