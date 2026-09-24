# Phase 5: Operator model-health page

## What you'll get
- A separate page at `/operator/model-health`, reachable only by typing the address. It has no menu entry and no link from any region or station screen, and search engines are told not to index it.
- A clear "Operator view. Not for school users." notice at the top.
- A table with one row per result, showing station, pollutant, horizon (hours), precision, recall, F1, MAE, RMSE and evaluation window end. On a phone it becomes a stacked list of labelled rows.
- Three filters, each with a label: Station, Pollutant and Horizon. Every filter defaults to "All" and is kept in the page address, so a filtered view can be shared. Each filter only offers values that appear in the fetched results.
- A line such as "Showing 5 of 14 results", plus a "no results match" message with a button to clear the filters.
- Each empty metric shows "n/a" on its own; the rest of the row still shows. Values are plain numbers in your browser's locale: no colours, no good/bad hints, no go/no-go wording and no units.
- Evaluation window end is shown in the station's region time zone, as a "time + relative age" line like elsewhere in the app. If the station can't be matched to a region, the time is shown in UTC and labelled "UTC", so it never silently uses the viewer's own time zone.
- Loading, network/timeout (with retry), 422 (field messages), 404 and empty-list states, reusing the existing ones.

## Technical details
- New route `src/routes/operator.model-health.tsx` with its own head() (title, description, `robots: noindex`, og tags). It sits outside `/r/$regionId`, so it doesn't use the region layout. Nothing in `src/routes/r.*` or the root navigation links to it.
- Data: one unfiltered `modelHealthQuery({})` call (the existing endpoint and query, 5-minute cache, no faster polling). Station, pollutant and horizon filtering all happen in the browser. The endpoint's optional `station_id`/`pollutant` parameters stay available in `endpoints.ts` but aren't needed at today's scale.
- Time zones: use the cached `regionsQuery` plus the cached `stationsQuery` for each region, which is one call per region (not per station), to build a station → region zone map. Station names are shown alongside ids when known.
- New pure module `src/lib/model-health.ts`: `filterModelHealth`, `filterOptions` (distinct sorted stations, pollutants and horizons), and `formatMetric` (null → "n/a", otherwise `formatNumber`). It makes no judgement and uses no thresholds.
- Search params `station`, `pollutant` and `horizon` are all optional and validated. Unknown values are dropped.
- Strings go in the existing `modelHealth` block in `src/i18n/strings.ts`: labels, column headers, filter labels, "All", n/a, counts, no-match text, UTC label and notice. Metric labels are exactly "Precision", "Recall", "F1", "MAE", "RMSE".
- Accessibility: native `<select>`s with `<label>`, a real `<table>` with `<caption>` and `scope` headers, visible focus, and the table scrolls sideways inside a labelled region at narrow widths.
- Tests in `src/lib/__tests__/model-health.test.ts`: each null metric turns into "n/a" on its own, filters combine correctly, options are distinct and sorted, and the output contains no verdict or tone fields.
- `roadmap.md`: Phase 5 marked done. Phase 4 stays on hold.
- Checks: tsgo clean, vitest passes, and a Playwright check with sample responses at 1280px and 390px, including keyboard tabbing through the filters.
