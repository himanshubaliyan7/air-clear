# Phase 3: Forecast detail

## 0. Contract re-sync
- Replace `docs/openapi.json` with the new upload, run `npm run gen:api`.
- Diff found: `ForecastSeriesOut.timezone` and `HistoryOut.timezone` on the responses; `PollutantInfoOut` (`unit`, `health_threshold_concentration`, `threshold_averaging`); plus one change you did not mention: a new `GET /api/v1/attributions` endpoint (`AttributionOut`: id, text, url, required, applies_to), described as data credits to show on every screen, with required ones being a licence condition.
- `BACKEND_REQUESTS.md`: mark #3 resolved (timezone on the responses). #4 (station with `region_id: null`) is also cleared for this phase's screens, since the forecast/history responses now carry their own zone and the unit/threshold come from the region only when present. After this the file lists no open items; it keeps a short "resolved" record.
- Attributions: add an app-wide footer that lists `/attributions` (one cached call, 5 min, text exactly as returned, linked when `url` is present). Per-reading attribution on the current-aqi section stays as it is. If you would rather this wait for a later phase, say so and I will leave it out.

## 1. Where the page lives
- New route `/r/$regionId/s/$stationId/forecast?pollutant=&lookback=` — a child of the station overview, which becomes a layout (`r.$regionId.s.$stationId.tsx` renders `<Outlet />`; overview body moves to `...s.$stationId.index.tsx`, unchanged).
- The overview's outlook section gets a "Forecast detail" link only when the station's `has_current_forecast` is true.
- Opened directly for a station without a current forecast (or when the response says `is_current: false`): the Phase 2 wording — "No current outlook." plus "The last one was made …" / "No outlook has ever been made" — with a link back. No charts are drawn then.

## 2. Forecast chart (`GET /forecast/{id}`)
- Expected value line (`point_forecast`) with a shaded low/high band (`quantile_low`/`quantile_high`) across the returned horizons.
- Threshold reference line only when the selected pollutant's `health_threshold_concentration` is non-null; labelled with the value, unit and `threshold_averaging`. No line otherwise, and a one-line note that the service has not supplied one.
- "Forecast made …" as-of line in the response's own `timezone`, relative age included.

## 3. History chart (`GET /forecast/{id}/history`)
- Actual vs forecast lines, lookback chooser (7 / 14 / 30 / 90 days, default 14 as the API does; stored in the URL, clamped to 1–90).
- Times in the history response's own `timezone`.

## 4. Shared rules for both charts
- Nulls break the line: a gap, never zero, never interpolated. A band segment is only drawn where both low and high exist.
- Every value and axis labelled with the pollutant's `unit` from `pollutant_details`; if the unit is missing, values are shown unlabelled with a note — never a guessed unit.
- No verdict words on this page; go/no-go stays only on the outlook recommendation.
- Accessible tooltips: each point is focusable (arrow keys move between points, Home/End jump), the tooltip shows on hover and focus, and its content is announced once per move. The SVG has a title and summary description.
- Table alternative under each chart ("Show as table" toggle, a real `<table>` with caption, units in headers, "—" with screen-reader text "no value" for gaps).
- Phone width: chart fills width with fewer axis ticks; tables scroll sideways.
- Each chart has its own loading, empty ("no points returned"), and error states (404/422/network with retry).
- Only the viewed station's endpoints are called; 5-minute caching as elsewhere.

## Technical details
- Charts are hand-built SVG components in `src/components/charts/` (no new dependency; the preinstalled chart library is avoided because it does not give keyboard-operable points or true gaps without workarounds).
- Pure helpers in `src/lib/forecast-detail.ts`: split series into non-null segments, compute scales/ticks, find pollutant details, clamp lookback. Covered by Vitest (gaps never become 0, band only where both bounds exist, threshold absent when null, lookback clamp, formatting in the response's zone not the region's).
- New `forecastQuery`/`historyQuery`/`attributionsQuery` in `src/api/queries.ts`, `listAttributions` in `endpoints.ts`, types in `types.ts`.
- All new text in `src/i18n/strings.ts`; chart colours and strokes in `src/design/tokens.ts`.
- Done when: type-check clean, tests pass, keyboard and screen-reader checks pass, verified in the browser at 1280px and 390px with mocked responses; `roadmap.md` marks Phase 3 done. Phases 4 and 5 untouched.
