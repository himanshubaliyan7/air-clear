# Backend requests

Things the frontend needs that `docs/openapi.json` does not currently provide.
Nothing here is faked or worked around in the app.

---

## 1. Concentration unit for forecast and history values — RESOLVED

Supplied by `pollutant_details[].unit` on the region (added to the contract after
Phase 0). To be wired in at Phase 3, where the values are first rendered.


- **What we need:** the unit for `point_forecast`, `quantile_low`, `quantile_high`,
  `worst_case_value` and `actual` / `forecast_value` — ideally per pollutant, on the
  forecast/history/exceedance responses or on the region's pollutant list.
- **Which screen:** Phase 2 outlook (worst-case value) and Phase 3 forecast chart and
  history chart, plus their table alternatives.
- **Why:** the responses are documented as concentrations but carry no unit, and the
  unit differs by pollutant and standard. We will not guess one. Until it exists,
  values are rendered unlabelled (`src/lib/pollutants.ts`).

## 2. Threshold concentration for the health-threshold category — RESOLVED

Supplied by `pollutant_details[].health_threshold_concentration` (with
`threshold_averaging`) on the region. The Phase 3 chart can draw the line from it.


- **What we need:** the concentration value, per pollutant, at which the region's
  `health_threshold_category` begins.
- **Which screen:** Phase 3 forecast chart.
- **Why:** to draw a threshold reference line. We will not hardcode a number or derive
  one in the frontend, so no line is drawn until the API supplies it.

## 3. Forecast timezone on the forecast and history responses

- **What we need:** a `timezone` field on `/forecast/{station_id}` and
  `/forecast/{station_id}/history`, as `/exceedance` and `current-aqi` already have.
- **Which screen:** Phase 3 charts and tables.
- **Why:** timestamps must be displayed in the region's zone. Today we resolve it via
  the station's `region_id` and `GET /regions`, which is an extra hop and breaks for a
  station whose `region_id` is `null`.

## 4. Region for a station with `region_id: null`

- **What we need:** either a guaranteed `region_id`, or a `timezone` / `aqi_standard`
  on the station itself.
- **Which screen:** any station screen reached directly by URL.
- **Why:** with a null `region_id` there is no time zone, category list or standard to
  render the station's data against.

## 5. Forecast age/currentness on the exceedance response

- **What we need:** `forecast_made_at` and `is_current` on
  `/forecast/{station_id}/exceedance`, matching the forecast-series response.
- **Which screen:** Phase 2 station outlook.
- **Why:** the station overview intentionally uses only the exceedance summary, which
  currently provides recommendation days but no timestamp or current/stale signal.
  The frontend will not invent an age or infer currentness from the returned dates.
