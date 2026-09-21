# Air quality for schools — frontend plan

A frontend-only app over the existing Air Pollution Prediction API. Nothing is computed locally: readings, categories, verdicts and recommendations all come from the server and are only rendered.

## The one rule that shapes everything

The outlook can come back as `no-data`. That must never look, read or feel like a "go". Every place a recommendation is shown goes through a single shared mapping over the four values (`go`, `caution`, `no-go`, `no-data`), and anything unrecognised is treated as "no usable recommendation". A station with a live reading but no outlook is normal — the outlook area says so in plain words rather than showing anything positive.

## What gets built, phase by phase

Phase 0 is built now. The rest is the agreed roadmap; each phase stops for your review.

### Phase 0 — Foundation (build now)

- Typed models and one API client module generated from `openapi.json`. Every network call goes through it; the base URL is read once from `VITE_API_BASE_URL`.
- Caching layer: regions and stations cached ~5 minutes, per-station data fetched only for the station being viewed, no polling faster than 5 minutes, refetch on window focus.
- Routing shell with the region in the URL (`/r/{regionId}/...`). With one region, `/` redirects straight in; the region stays in the data flow so a second region needs no code change.
- A region context that supplies time zone, the ordered category list and labels, the health-threshold category, the AQI standard name and the pollutant list to everything downstream.
- One strings module for all user-facing text; dates and numbers formatted through the browser's locale APIs, always in the region's time zone, with "as of" relative-age helpers.
- Shared pieces: the recommendation mapping, an attribution component, and reusable loading / empty / error states covering 404, 422 with field messages, network failure with retry, and empty lists.
- Plain accessible defaults, with all colour, spacing and type kept in isolated tokens so your design drops in before Phase 2 without restructuring.
- `BACKEND_REQUESTS.md` created, for anything the API doesn't provide.

### Phase 1 — Region and station selection

Station list for the region, searchable by name, sorted forecast-first then reading-first. Visible coverage counts ("N of M stations have a current reading; K have an outlook") with a short explanation of why outlooks are rare. Region switcher present but hidden while there is one region. Region, station and pollutant persist in the URL.

### Phase 2 — Station overview (primary screen)

Two clearly separated sections.

Section A, air quality right now: overall AQI, category, driver pollutant, the server's "not recommended right now" state, per-pollutant table of sub-indices with min/max spread (labelled as an index, never a concentration unit), the "as of" age, the standard name, and the attribution text shown exactly as returned. Handles a stale reading (no numbers shown, only how old the last one was), a missing overall value, and a station that never reported.

Section B, outlook: the overall recommendation prominently, plus per-day date, category label, probability and worst-case upper bound, with its own "as of" age. Handles all four recommendation values, including partial day lists that still count as no-data.

### Phase 3 — Forecast detail

Expected value with the low/high range across whatever horizons the API returns, plus actual-vs-forecast history over a selectable lookback (1–90 days), gaps drawn as gaps. Accessible tooltips and a table alternative to every chart. No threshold line is drawn — the concentration for the region's threshold category isn't in the API, so it goes into `BACKEND_REQUESTS.md`. Reachable only for stations with a current forecast.

### Phase 4 — Alert subscription

On hold at your instruction. Not built until you release the revised contract.

### Phase 5 — Operator model-health page

Separate operator-only page listing model-health rows, filterable by station and pollutant, null metrics shown as "n/a". Not linked from school-facing navigation.

## Technical notes

- Stack stays TanStack Start + TanStack Router + TanStack Query + TypeScript. No extra dependencies beyond a generator for the OpenAPI types and a charting library at Phase 3.
- Types are generated from the attached contract into `src/api/schema.gen.ts`; a thin hand-written client in `src/api/client.ts` wraps fetch, joins `VITE_API_BASE_URL` with `/api/v1`, URL-encodes station ids (they contain a colon), and maps non-2xx responses into typed 404 / 422 / network errors.
- Calls are made from the browser, so the API must allow the app's origin via CORS. If it doesn't, I'll flag it rather than proxying, since no backend work is in scope.
- Day boundaries and all timestamps are formatted with `Intl` in the region's IANA zone; the browser zone is never used as a fallback for forecast days.
- Category ids are looked up against the region's ordered list; an unknown id renders as a readable version of the id instead of failing.
