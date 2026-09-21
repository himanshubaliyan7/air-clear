# Phase 1 — Region and station selection

Build only Phase 1, then stop for review. Phase 2 (station overview) is not started.

## Starting point

The working copy already matches the merged main: the committed contract at `docs/openapi.json` and the generated types both carry the new `pollutant_details` on a region (`id`, `unit`, `health_threshold_concentration`, `threshold_averaging`). Nothing in Phase 1 renders those fields — they are noted for Phase 3 and the matching entries in `BACKEND_REQUESTS.md` (missing concentration unit and missing threshold concentration) are closed out as now supplied.

## What Phase 1 delivers

**Station list for the region.** One call to the stations endpoint filtered by the region, cached five minutes, no per-station calls at all. Each station shows its name, its city, and two plain markers read straight from the list response: whether it has a current reading and whether it has an outlook. A station with neither is still browsable, and is never described with any safe/positive wording.

**Coverage counts.** Above the list: how many of the region's stations have a current reading and how many have an outlook, plus the short explanation that an outlook needs hourly history most stations do not have.

**Search.** A labelled search box filtering by station name and city, case-insensitive, done in the browser over the already-loaded list. No extra request. When a search matches nothing, an explicit "no stations match" state with a way to clear the search — never a blank area.

**Ordering.** Stations with an outlook first, then those with a current reading, then the rest; ties broken by name using the browser's locale-aware comparison.

**State kept in the URL.** The region is already in the path. The search text and the selected pollutant become URL search parameters, so a filtered list can be shared or reloaded. The pollutant chooser is built from the region's own pollutant list, defaults to the region's first pollutant, and is hidden when the region lists only one. It carries forward for Phase 2 and 3; nothing in Phase 1 changes because of it.

**Region switcher.** Already present in the region layout and hidden while the service covers one region — kept as is, with a check that switching regions resets the station search sensibly.

**Station links.** Each row links to the station's own URL under the region. That page is created as a Phase 1 placeholder showing only the station identity already present in the list (name, city, and the two coverage markers) and a line saying the detail view is coming. No readings, no outlook, no recommendation wording — that is Phase 2.

**Every state handled.** Loading, service-unreachable / insecure-address / not-configured / server error with retry, unknown region, empty station list, empty search result. No blank screen and no raw error payload anywhere.

**Accessibility and width.** The search box and pollutant chooser are properly labelled, the list is a real list with keyboard-reachable links, the coverage counts are announced when they change, and the whole screen works at phone width.

## Technical notes

- New route file for the station page under the region, using the region-scoped path so the region stays in the data flow; station ids contain a colon and go through the existing path-encoding helper.
- Search parameters are validated by the route (unknown pollutant values fall back to the region default rather than erroring).
- Sorting, filtering and the coverage counts live in a small pure module with unit tests: ordering puts outlook-first and reading-first in the right order, the counts match the list, and a station with neither marker is never grouped with the ones that have data.
- All new text goes into the existing strings module; the station-list strings already there are reused and extended (no-match state, pollutant chooser label, placeholder detail line).
- Presentation stays in the design tokens module; no new colours inline.
- Definition of done, as agreed: clean type-check, tests pass, no hardcoded host/region/place/time-zone/category, no recommendation or threshold logic in the frontend, all text in the strings module.
