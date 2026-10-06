# Maintain the directory

Each company or initiative has one profile ID. Category placements point to that ID using `bindings` in `ecosystemProfiles.json`. A binding key is the JSON string `[section, category, placementName]`.

## Add or update a company

1. Add the profile to `src/lib/ecosystemProfiles.json`. Reuse a stable ID when updating an existing company.
2. Add its placement(s) to `MARKET_MAP` in `src/lib/marketMap.ts`.
3. Add a binding for every placement. Multiple placements may use the same ID.
4. Add its local logo under `public/ecosystem/`, or set `logo` to `null` to use initials.
5. Run `npm run validate:data`, `npm test` and `npm run build`.

Copy an existing profile's schema. Keep `description` concise and factual. `checkedOn` records the prior review date; it is not an ongoing uptime guarantee. Update relevant website and identity details when rechecking a company. `officialUpdates` is a static list of dated references.

## Logo conventions

Use a company symbol rather than a wordmark when available. Prefer a trusted brand asset, ideally SVG or a transparent image. All assets are loaded locally. No favicon service is queried.

- `src`: `/ecosystem/filename.svg` or another bundled image path.
- `shape`: `symbol` or `wordmark` controls fitting.
- `treatment`: `original`, `reverse` or `reverse-paper` preserves the approved dark-map presentation.
- `surface`: `muted` adds a muted surface for difficult marks.

The renderer always preserves aspect ratio. It does not rewrite the image or stretch a wordmark into a symbol.

## Historical initiatives

A historical record retains its description, logo and reviewed scope. `directoryStatus: "historical"` suppresses the Website button and puts the placement under `Historical`. A historical label alone does not establish that the entire company closed.

When archiving an initiative:

- Set its profile and placement `website` and `domain` to empty strings.
- Preserve `statusNote`, `lifecycle` and `archiveScope` to explain what was reviewed.
- Record former/replaced domains in `blockedWebsiteHosts` so news links cannot send readers to those hosts or their subdomains.
- Clear obsolete official-update links and remove current placements for that historical initiative.

Do not restore a former domain merely because it responds: a new owner may control it. Review identity and scope before changing a historical record back to current.
