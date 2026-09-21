# Roadmap

Each phase stops for review. See `.lovable/plan/` for the approved plan.

## Phase 0 — Foundation (done)
- [x] Typed models generated from `docs/openapi.json` + single API client module
- [x] `VITE_API_BASE_URL` handling, no hardcoded host
- [x] Query/cache setup (5 min, no fast polling, refetch on focus)
- [x] Routing shell with region in the URL; `/` redirects into the single region
- [x] Region context (timezone, ordered categories, threshold category, pollutants, standard)
- [x] Translatable strings module
- [x] Time formatting + "as of" age helpers in the region's zone
- [x] Exhaustive recommendation mapping (go | caution | no-go | no-data + unknown)
- [x] Attribution component
- [x] Loading / empty / error states (404, 422 field errors, network, CORS, mixed content, not configured, empty list)
- [x] Design tokens isolated, plain accessible defaults
- [x] `BACKEND_REQUESTS.md`
- [x] Vitest tests: recommendation mapping, region-zone time formatting, unknown-category fallback
- [x] `npm run gen:api`

## Phase 1 — Region and station selection (done)
- [x] Region switcher (hidden with one region)
- [x] Station list with search, forecast-first ordering, coverage counts
- [x] Neutral text availability markers, both directions, never colour-only
- [x] Region / station / pollutant persisted in URL params (no pollutant control yet)
- [x] Phase 1 station placeholder page (identity only, no readings or outlook)

## Phase 2 — Station overview
- [x] Section A: current reading, per-pollutant sub-index table, attribution, all null/stale states
- [x] Section B: outlook recommendation + per-day breakdown, all four values

## Phase 3 — Forecast detail
- [ ] Forecast series chart with low/high range + table alternative
- [ ] History (actual vs forecast) with selectable lookback, gaps as gaps

## Phase 4 — Alert subscription
- [ ] ON HOLD — blocked on the revised backend contract from the user

## Phase 5 — Operator model-health page
- [ ] Filterable model-health table, nulls as "n/a", unlinked from school navigation
