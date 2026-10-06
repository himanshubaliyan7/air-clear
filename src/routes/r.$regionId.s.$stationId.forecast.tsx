import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { forecastHistoryQuery, forecastQuery, stationsQuery } from "@/api/queries";
import type { ForecastSeries, History } from "@/api/types";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { TimeChart } from "@/components/charts/TimeChart";
import { strings } from "@/i18n/strings";
import { control, surface, typography } from "@/design/tokens";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { useRegion } from "@/region/region-context";
import {
  calendarDayInZone,
  formatAsOf,
  formatCalendarDate,
  formatDateTimeInZone,
  formatDayTickInZone,
  formatNumber,
  formatTickInZone,
} from "@/lib/format-time";
import { isDailyMean } from "@/lib/station-overview";
import { formatPollutantId, withUnit } from "@/lib/pollutants";
import { resolvePollutant } from "@/lib/stations";
import {
  clampLookback,
  DEFAULT_LOOKBACK,
  isValue,
  LOOKBACK_OPTIONS,
  pollutantDetail,
  responseZone,
  type PollutantDetail,
} from "@/lib/forecast-detail";

interface ForecastSearch {
  pollutant?: string | undefined;
  lookback?: number | undefined;
}

const description =
  "Forecast range and past forecasts compared with measurements for one monitoring station.";

export const Route = createFileRoute("/r/$regionId/s/$stationId/forecast")({
  validateSearch: (search: Record<string, unknown>): ForecastSearch => {
    const result: ForecastSearch = {};
    if (typeof search["pollutant"] === "string" && search["pollutant"] !== "") {
      result.pollutant = search["pollutant"];
    }
    if (search["lookback"] !== undefined && search["lookback"] !== "") {
      result.lookback = clampLookback(search["lookback"]);
    }
    return result;
  },
  head: () => ({
    meta: [
      { title: `${strings.forecastDetail.pageTitle} — ${strings.app.name}` },
      { name: "description", content: description },
      { property: "og:title", content: `${strings.forecastDetail.pageTitle} — ${strings.app.name}` },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ForecastDetail,
});

function ForecastDetail() {
  const { regionId, stationId } = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const { region, pollutants, timeZone } = useRegion();
  const stations = useQuery(stationsQuery(regionId));
  const station = stations.data?.find((s) => s.station_id === stationId) ?? null;
  useDocumentTitle(station?.name, strings.forecastDetail.pageTitle);
  const pollutant = resolvePollutant(search.pollutant, pollutants) ?? pollutants[0];
  const lookback = search.lookback ?? DEFAULT_LOOKBACK;
  const ready = station?.has_current_forecast === true && pollutant !== undefined;
  const params = pollutant ? { pollutant } : {};
  const forecast = useQuery({ ...forecastQuery(stationId, params), enabled: ready });
  const history = useQuery({
    ...forecastHistoryQuery(stationId, { ...params, lookback_days: lookback }),
    enabled: ready && forecast.data?.is_current === true,
  });
  const detail = pollutantDetail(region, pollutant);

  const setSearch = (next: ForecastSearch) =>
    void navigate({ search: (prev) => ({ ...prev, ...next }), replace: true });

  return (
    <section className={surface.section}>
      <Link
        to="/r/$regionId/s/$stationId"
        params={{ regionId, stationId }}
        search={pollutant ? { pollutant } : {}}
        className={typography.body}
      >
        {strings.forecastDetail.backToOverview}
      </Link>

      {stations.isPending && <LoadingState />}
      {stations.error && (
        <ErrorState error={stations.error} onRetry={() => void stations.refetch()} />
      )}
      {stations.data && !station && (
        <EmptyState title={strings.stations.unknownTitle} body={strings.stations.unknownBody} />
      )}

      {station && (
        <>
          <header>
            <h1 className={typography.pageTitle}>{strings.forecastDetail.pageTitle}</h1>
            <p className={`${typography.body} ${surface.muted}`}>
              {station.name} · {station.city}
            </p>
          </header>

          {station.has_current_forecast !== true ? (
            <EmptyState
              title={strings.outlook.noCurrentForecast}
              body={strings.forecastDetail.unavailableBody}
            />
          ) : pollutants.length === 0 ? (
            <EmptyState body={strings.outlook.noPollutants} />
          ) : (
            <>
              <div className="flex flex-wrap gap-3">
                <label className="block w-full max-w-xs">
                  <span className={`${typography.body} mb-1 block`}>
                    {strings.forecastDetail.pollutantLabel}
                  </span>
                  <select
                    className={control.input}
                    value={pollutant}
                    onChange={(e) => setSearch({ pollutant: e.target.value })}
                  >
                    {pollutants.map((p) => (
                      <option key={p} value={p}>
                        {formatPollutantId(p)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {!detail.unit && (
                <p className={`${typography.small} ${surface.muted}`}>
                  {strings.forecastDetail.noUnit}
                </p>
              )}

              {forecast.isPending && <LoadingState />}
              {forecast.error && (
                <ErrorState error={forecast.error} onRetry={() => void forecast.refetch()} />
              )}
              {forecast.data && !forecast.data.is_current && (
                <div className={surface.card}>
                  <p className={typography.body}>{strings.outlook.noCurrentForecast}</p>
                  <p className={`${typography.body} ${surface.muted}`}>
                    {forecast.data.forecast_made_at
                      ? strings.outlook.lastForecastWas(
                          formatAsOf(
                            forecast.data.forecast_made_at,
                            responseZone(forecast.data.timezone, timeZone),
                          ),
                        )
                      : strings.outlook.neverForecast}
                  </p>
                </div>
              )}
              {forecast.data?.is_current && (
                <>
                  <ForecastSection
                    data={forecast.data}
                    detail={detail}
                    zone={responseZone(forecast.data.timezone, timeZone)}
                  />
                  <section aria-labelledby="history-heading" className={surface.section}>
                    <h2 id="history-heading" className={typography.sectionTitle}>
                      {strings.forecastDetail.historyTitle}
                    </h2>
                    <label className="block max-w-xs">
                      <span className={`${typography.body} mb-1 block`}>
                        {strings.forecastDetail.lookbackLabel}
                      </span>
                      <select
                        className={control.input}
                        value={lookback}
                        onChange={(e) => setSearch({ lookback: clampLookback(e.target.value) })}
                      >
                        {(LOOKBACK_OPTIONS as readonly number[]).includes(lookback) ? null : (
                          <option value={lookback}>
                            {strings.forecastDetail.lookbackOption(lookback)}
                          </option>
                        )}
                        {LOOKBACK_OPTIONS.map((d) => (
                          <option key={d} value={d}>
                            {strings.forecastDetail.lookbackOption(d)}
                          </option>
                        ))}
                      </select>
                    </label>
                    {history.isPending && <LoadingState />}
                    {history.error && (
                      <ErrorState error={history.error} onRetry={() => void history.refetch()} />
                    )}
                    {history.data && (
                      <HistoryContent
                        data={history.data}
                        detail={detail}
                        days={lookback}
                        zone={responseZone(history.data.timezone, timeZone)}
                      />
                    )}
                  </section>
                </>
              )}
            </>
          )}
        </>
      )}
    </section>
  );
}

function useFormatters(detail: PollutantDetail) {
  const unitText = detail.unit ?? strings.forecastDetail.unitUnknown;
  const value = (v: number | null | undefined) =>
    isValue(v) ? withUnit(formatNumber(v, { maximumFractionDigits: 1 }), detail.unit) : strings.chart.noValue;
  const axisLabel = detail.unit
    ? strings.forecastDetail.unitLabel(detail.unit)
    : strings.forecastDetail.unlabelledAxis;
  const threshold =
    detail.thresholdConcentration !== null
      ? {
          value: detail.thresholdConcentration,
          label: strings.forecastDetail.thresholdLabel(
            withUnit(formatNumber(detail.thresholdConcentration), detail.unit),
            detail.thresholdAveraging,
          ),
        }
      : null;
  return { unitText, value, axisLabel, threshold };
}

function ValueCell({ v, unit }: { v: number | null | undefined; unit: string | null }) {
  if (!isValue(v)) {
    return (
      <>
        <span aria-hidden="true">{strings.chart.noValueShort}</span>
        <span className="sr-only">{strings.chart.noValue}</span>
      </>
    );
  }
  return <>{withUnit(formatNumber(v, { maximumFractionDigits: 1 }), unit)}</>;
}

function TableToggle({ open, onToggle, id }: { open: boolean; onToggle: () => void; id: string }) {
  return (
    <button type="button" className={control.button} aria-expanded={open} aria-controls={id} onClick={onToggle}>
      {open ? strings.chart.hideTable : strings.chart.showTable}
    </button>
  );
}

function ForecastSection({
  data,
  detail,
  zone,
}: {
  data: ForecastSeries;
  detail: PollutantDetail;
  zone: string;
}) {
  const [showTable, setShowTable] = useState(false);
  const f = useFormatters(detail);
  // A daily-mean point stands for the whole local day that starts at its target time.
  const daily = isDailyMean(data.target);
  const expectedLabel = daily
    ? strings.forecastDetail.expectedDayMean
    : strings.forecastDetail.expected;
  const when = (iso: string) =>
    (daily ? formatCalendarDate(calendarDayInZone(iso, zone)) : formatDateTimeInZone(iso, zone)) ??
    iso;
  const points = data.forecasts
    .map((p) => ({ ...p, x: new Date(p.target_time).getTime() }))
    .filter((p) => Number.isFinite(p.x))
    .sort((a, b) => a.x - b.x);

  return (
    <section aria-labelledby="forecast-heading" className={surface.section}>
      <h2 id="forecast-heading" className={typography.sectionTitle}>
        {strings.forecastDetail.forecastTitle}
      </h2>
      <p className={`${typography.small} ${surface.muted}`}>
        {strings.outlook.madeAt(formatAsOf(data.forecast_made_at, zone))}{" "}
        {strings.forecastDetail.timesIn(zone)}
      </p>
      {daily && (
        <p className={`${typography.small} ${surface.muted}`}>{strings.forecastDetail.dailyNote}</p>
      )}
      {!f.threshold && (
        <p className={`${typography.small} ${surface.muted}`}>{strings.forecastDetail.noThreshold}</p>
      )}
      {points.length === 0 ? (
        <EmptyState body={strings.forecastDetail.noForecastPoints} />
      ) : (
        <>
          <TimeChart
            title={strings.forecastDetail.forecastTitle}
            summary={
              daily
                ? strings.forecastDetail.dailyForecastSummary(points.length, f.unitText)
                : strings.forecastDetail.forecastSummary(points.length, f.unitText)
            }
            xs={points.map((p) => p.x)}
            lines={[
              {
                id: "expected",
                label: expectedLabel,
                tone: "primary",
                points: points.map((p) => ({ x: p.x, y: p.point_forecast ?? null })),
              },
            ]}
            band={{
              label: strings.forecastDetail.range,
              points: points.map((p) => ({ x: p.x, low: p.quantile_low ?? null, high: p.quantile_high ?? null })),
            }}
            threshold={f.threshold}
            axisLabel={f.axisLabel}
            formatTick={(x) => (daily ? formatDayTickInZone(x, zone) : formatTickInZone(x, zone))}
            formatValue={(v) => formatNumber(v)}
            tooltip={(i) => {
              const p = points[i]!;
              return {
                heading: when(p.target_time),
                rows: [
                  { label: expectedLabel, value: f.value(p.point_forecast) },
                  { label: strings.forecastDetail.low, value: f.value(p.quantile_low) },
                  { label: strings.forecastDetail.high, value: f.value(p.quantile_high) },
                ],
              };
            }}
          />
          <TableToggle open={showTable} onToggle={() => setShowTable((v) => !v)} id="forecast-table" />
          {showTable && (
            <div id="forecast-table" className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <caption className={`${typography.body} mb-2 text-left`}>
                  {strings.forecastDetail.tableCaptionForecast}
                </caption>
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-2 pr-3">
                      {daily ? strings.forecastDetail.day : strings.forecastDetail.time}
                    </th>
                    <th className="py-2 pr-3">
                      {daily ? strings.forecastDetail.daysAhead : strings.forecastDetail.horizon}
                    </th>
                    <th className="py-2 pr-3">{expectedLabel}</th>
                    <th className="py-2 pr-3">{strings.forecastDetail.low}</th>
                    <th className="py-2">{strings.forecastDetail.high}</th>
                  </tr>
                </thead>
                <tbody>
                  {points.map((p) => (
                    <tr key={p.target_time} className="border-b border-border">
                      <th scope="row" className="py-2 pr-3 font-medium">
                        {when(p.target_time)}
                      </th>
                      <td className="py-2 pr-3">
                        {formatNumber(daily ? p.horizon_hours / 24 : p.horizon_hours)}
                      </td>
                      <td className="py-2 pr-3"><ValueCell v={p.point_forecast} unit={detail.unit} /></td>
                      <td className="py-2 pr-3"><ValueCell v={p.quantile_low} unit={detail.unit} /></td>
                      <td className="py-2"><ValueCell v={p.quantile_high} unit={detail.unit} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function HistoryContent({
  data,
  detail,
  days,
  zone,
}: {
  data: History;
  detail: PollutantDetail;
  days: number;
  zone: string;
}) {
  const [showTable, setShowTable] = useState(false);
  const f = useFormatters(detail);
  const points = data.points
    .map((p) => ({ ...p, x: new Date(p.time).getTime() }))
    .filter((p) => Number.isFinite(p.x))
    .sort((a, b) => a.x - b.x);

  if (points.length === 0) return <EmptyState body={strings.forecastDetail.noHistoryPoints} />;

  const daily = isDailyMean(data.target);
  const forecastLabel = daily
    ? strings.forecastDetail.forecastDayMean
    : strings.forecastDetail.forecastValue;
  return (
    <>
      <p className={`${typography.small} ${surface.muted}`}>{strings.forecastDetail.timesIn(zone)}</p>
      {daily && (
        <p className={`${typography.small} ${surface.muted}`}>
          {strings.forecastDetail.dailyHistoryNote}
        </p>
      )}
      <TimeChart
        title={strings.forecastDetail.historyTitle}
        summary={
          daily
            ? strings.forecastDetail.dailyHistorySummary(days, f.unitText)
            : strings.forecastDetail.historySummary(days, f.unitText)
        }
        xs={points.map((p) => p.x)}
        lines={[
          {
            id: "actual",
            label: strings.forecastDetail.actual,
            tone: "primary",
            points: points.map((p) => ({ x: p.x, y: p.actual ?? null })),
          },
          {
            id: "forecast",
            label: forecastLabel,
            tone: "secondary",
            points: points.map((p) => ({ x: p.x, y: p.forecast_value ?? null })),
          },
        ]}
        threshold={f.threshold}
        axisLabel={f.axisLabel}
        formatTick={(x) => formatTickInZone(x, zone)}
        formatValue={(v) => formatNumber(v)}
        tooltip={(i) => {
          const p = points[i]!;
          return {
            heading: formatDateTimeInZone(p.time, zone) ?? p.time,
            rows: [
              { label: strings.forecastDetail.actual, value: f.value(p.actual) },
              { label: forecastLabel, value: f.value(p.forecast_value) },
            ],
          };
        }}
      />
      <TableToggle open={showTable} onToggle={() => setShowTable((v) => !v)} id="history-table" />
      {showTable && (
        <div id="history-table" className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <caption className={`${typography.body} mb-2 text-left`}>
              {strings.forecastDetail.tableCaptionHistory}
            </caption>
            <thead>
              <tr className="border-b border-border">
                <th className="py-2 pr-3">{strings.forecastDetail.time}</th>
                <th className="py-2 pr-3">{strings.forecastDetail.actual}</th>
                <th className="py-2">{forecastLabel}</th>
              </tr>
            </thead>
            <tbody>
              {points.map((p) => (
                <tr key={p.time} className="border-b border-border">
                  <th scope="row" className="py-2 pr-3 font-medium">
                    {formatDateTimeInZone(p.time, zone) ?? p.time}
                  </th>
                  <td className="py-2 pr-3"><ValueCell v={p.actual} unit={detail.unit} /></td>
                  <td className="py-2"><ValueCell v={p.forecast_value} unit={detail.unit} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
