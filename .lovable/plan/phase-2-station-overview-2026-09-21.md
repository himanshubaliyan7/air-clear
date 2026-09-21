# Phase 2 — Station overview

Build the reviewed station screen only. Phase 3 charts, subscriptions, and operator tools remain untouched.

## Station overview

- Replace the Phase 1 station placeholder with the station name and city followed by two independent sections. Keep the existing region-scoped station list as the source of station identity, so no station-detail endpoint is added.
- Preserve the back link and the existing not-found, loading, and retry behavior.

### Air quality right now

- Load only `GET /stations/{station_id}/current-aqi` for current conditions.
- For a current response, show the server-provided overall AQI, category, driver pollutant, AQI standard, and observation age in the region’s time zone.
- Render each pollutant as an AQI sub-index with average and min–max spread. Never attach a concentration unit such as µg/m³.
- Use only `at_or_above_health_threshold` for the current-condition warning. Current-condition copy will say “outdoor practice is not recommended right now” or that conditions are below that level; it will never use “go” or “no-go.”
- If `overall` is null, explain that the overall value is unavailable and still show any pollutant sub-indices returned.
- If `is_current` is false, show no AQI numbers. Say there is no current reading and, when `as_of` exists, how old the last reading is; otherwise say the station has never reported.
- Show the mandatory attribution exactly as returned anywhere the current-reading response is displayed, including stale and otherwise-empty states.

### Outlook

- Load only `GET /forecast/{station_id}/exceedance`, using the validated `pollutant` URL parameter when it belongs to the region and otherwise the first pollutant supplied by the region.
- Add a pollutant selector because it now controls the outlook request; keep the selection in the URL.
- Render the server’s `overall_recommendation` through the existing exhaustive mapping. Only this outlook block may use “Go” or “Not recommended”; `no-data`, missing, and unknown values remain neutral and never look positive.
- Render returned days with the API date, region category label, exceedance probability, and worst-case upper bound. Treat a partial days list exactly as returned and never upgrade the server’s recommendation.
- If no outlook days are returned, explain plainly that no outlook is available; never substitute a positive state.
- The exceedance response has no forecast timestamp or current/stale flag. Do not invent an “as of” time; record the missing capability in `BACKEND_REQUESTS.md` while continuing to render the available recommendation and days.

## Phase 1 accessibility follow-ups

- Make “Showing N of M” less chatty by removing live announcements on every keystroke; keep the visible count as ordinary text, while the no-match state remains clear.
- Give each availability-marker group a semantic `group` role and associate its accessible name with the existing availability label.

## Validation

- Add focused tests for current-reading presentation decisions and outlook mapping, especially: stale readings suppress values, no overall still permits pollutant rows, threshold wording contains no go/no-go language, unknown recommendations become no-data, and empty/partial outlooks never become positive.
- Verify the station overview at desktop and phone widths, including keyboard operation, labelled groups, independent loading/error states, exact attribution text, URL-backed pollutant selection, and no concentration units.
- Run the existing test suite and confirm the preview build remains clean.

## Scope boundary

No backend work, new endpoint, forecast-series call, chart, history, subscription, or model-health work is included. Update the roadmap only to mark Phase 2 complete after validation, then stop for review.
