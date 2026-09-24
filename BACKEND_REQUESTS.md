# Backend requests

Things the frontend needs that `docs/openapi.json` does not currently provide.
Nothing here is faked or worked around in the app.

**There are no open requests.** Resolved items are kept below for the record.

---

## Resolved

1. **Concentration unit** — supplied by `pollutant_details[].unit` on the region. Used
   on the forecast-detail charts, axes, tooltips and tables.
2. **Health-threshold concentration** — supplied by
   `pollutant_details[].health_threshold_concentration` and `threshold_averaging` on
   the region. The reference line is drawn only when the value is non-null.
3. **Timezone on forecast and history** — `ForecastSeriesOut.timezone` and
   `HistoryOut.timezone` are now on the responses and are used directly. The region's
   zone is used only if a response ever omits it.
4. **Station with `region_id: null`** — no longer blocks any screen: stations are
   always reached through a region URL, and forecast/history carry their own zone.
