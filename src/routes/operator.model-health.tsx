import { createFileRoute } from "@tanstack/react-router";
import { useQueries, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { modelHealthQuery, regionsQuery, stationsQuery } from "@/api/queries";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { strings } from "@/i18n/strings";
import { control, surface, typography } from "@/design/tokens";
import { formatAsOf } from "@/lib/format-time";
import { formatPollutantId } from "@/lib/pollutants";
import {
  filterModelHealth,
  filterOptions,
  formatMetric,
  METRIC_KEYS,
  METRIC_LABELS,
  type ModelHealthFilter,
} from "@/lib/model-health";

/** Operator-only page. Reachable by direct URL only; nothing links here. */
export const Route = createFileRoute("/operator/model-health")({
  validateSearch: (search: Record<string, unknown>): ModelHealthFilter => {
    const out: ModelHealthFilter = {};
    if (typeof search["station"] === "string" && search["station"]) {
      out.station = search["station"];
    }
    if (typeof search["pollutant"] === "string" && search["pollutant"]) {
      out.pollutant = search["pollutant"];
    }
    const h = Number(search["horizon"]);
    if (search["horizon"] !== undefined && search["horizon"] !== "" && Number.isInteger(h)) {
      out.horizon = h;
    }
    return out;
  },
  head: () => ({
    meta: [
      { title: `Model health (operator) — ${strings.app.name}` },
      { name: "description", content: "Operator diagnostics: forecast-model evaluation metrics per station." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: `Model health (operator) — ${strings.app.name}` },
      { property: "og:description", content: "Operator diagnostics for forecast models." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ModelHealthPage,
});

const t = strings.modelHealth;

function ModelHealthPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const health = useQuery(modelHealthQuery({}));
  const regions = useQuery(regionsQuery());
  const stationQueries = useQueries({
    queries: (regions.data ?? []).map((r) => stationsQuery(r.id)),
  });

  // station id -> { name, timeZone }, built from cached per-region lists.
  const stationInfo = useMemo(() => {
    const map = new Map<string, { name: string; timeZone: string }>();
    (regions.data ?? []).forEach((region, i) => {
      for (const s of stationQueries[i]?.data ?? []) {
        map.set(s.station_id, { name: s.name, timeZone: region.timezone });
      }
    });
    return map;
  }, [regions.data, stationQueries]);

  const setFilter = (patch: Partial<ModelHealthFilter>) =>
    navigate({
      search: (prev: ModelHealthFilter) => {
        const next: ModelHealthFilter = { ...prev, ...patch };
        (Object.keys(next) as (keyof ModelHealthFilter)[]).forEach((k) => {
          if (next[k] === undefined) delete next[k];
        });
        return next;
      },
      replace: true,
    });

  const windowEnd = (stationId: string, iso: string) => {
    const info = stationInfo.get(stationId);
    return info ? formatAsOf(iso, info.timeZone) : t.utcLabel(formatAsOf(iso, "UTC"));
  };
  const stationLabel = (id: string) => {
    const name = stationInfo.get(id)?.name;
    return name ? `${name} (${id})` : id;
  };

  let body;
  if (health.isPending) body = <LoadingState />;
  else if (health.error)
    body = <ErrorState error={health.error} onRetry={() => void health.refetch()} />;
  else if (health.data.length === 0)
    body = <EmptyState title={t.emptyTitle} body={t.emptyBody} />;
  else {
    const all = health.data;
    const opts = filterOptions(all);
    const filter: ModelHealthFilter = {
      station: search.station && opts.stations.includes(search.station) ? search.station : undefined,
      pollutant: search.pollutant && opts.pollutants.includes(search.pollutant) ? search.pollutant : undefined,
      horizon: search.horizon !== undefined && opts.horizons.includes(search.horizon) ? search.horizon : undefined,
    };
    const rows = filterModelHealth(all, filter);
    const anyFilter = filter.station !== undefined || filter.pollutant !== undefined || filter.horizon !== undefined;

    body = (
      <>
        <fieldset className={`${surface.card} grid gap-3 sm:grid-cols-3`}>
          <legend className={`${typography.sectionTitle} px-1`}>{t.filtersLabel}</legend>
          <label className={`${typography.body} grid gap-1`}>
            {t.stationFilter}
            <select className={control.input} value={filter.station ?? ""}
              onChange={(e) => setFilter({ station: e.target.value || undefined })}>
              <option value="">{t.all}</option>
              {opts.stations.map((s) => <option key={s} value={s}>{stationLabel(s)}</option>)}
            </select>
          </label>
          <label className={`${typography.body} grid gap-1`}>
            {t.pollutantFilter}
            <select className={control.input} value={filter.pollutant ?? ""}
              onChange={(e) => setFilter({ pollutant: e.target.value || undefined })}>
              <option value="">{t.all}</option>
              {opts.pollutants.map((p) => <option key={p} value={p}>{formatPollutantId(p)}</option>)}
            </select>
          </label>
          <label className={`${typography.body} grid gap-1`}>
            {t.horizonFilter}
            <select className={control.input} value={filter.horizon ?? ""}
              onChange={(e) => setFilter({ horizon: e.target.value === "" ? undefined : Number(e.target.value) })}>
              <option value="">{t.all}</option>
              {opts.horizons.map((h) => <option key={h} value={h}>{t.horizonValue(h)}</option>)}
            </select>
          </label>
        </fieldset>

        <div className="flex flex-wrap items-center gap-3">
          <p className={`${typography.body} ${surface.muted}`}>{t.showing(rows.length, all.length)}</p>
          {anyFilter && (
            <button type="button" className={control.button}
              onClick={() => setFilter({ station: undefined, pollutant: undefined, horizon: undefined })}>
              {t.clearFilters}
            </button>
          )}
        </div>

        {rows.length === 0 ? (
          <EmptyState title={t.noMatchTitle} body={t.noMatchBody} />
        ) : (
          <>
            {/* Phone: stacked labelled rows */}
            <ul className="grid gap-3 sm:hidden">
              {rows.map((r, i) => (
                <li key={`${r.station_id}-${r.pollutant}-${r.horizon_hours}-${i}`} className={surface.card}>
                  <dl className={`${typography.body} grid grid-cols-2 gap-x-3 gap-y-1`}>
                    <dt className={surface.muted}>{t.colStation}</dt><dd className="break-all">{stationLabel(r.station_id)}</dd>
                    <dt className={surface.muted}>{t.colPollutant}</dt><dd>{formatPollutantId(r.pollutant)}</dd>
                    <dt className={surface.muted}>{t.colHorizon}</dt><dd>{r.horizon_hours}</dd>
                    {METRIC_KEYS.map((k) => (
                      <div key={k} className="contents">
                        <dt className={surface.muted}>{METRIC_LABELS[k]}</dt><dd>{formatMetric(r[k])}</dd>
                      </div>
                    ))}
                    <dt className={surface.muted}>{t.colWindowEnd}</dt><dd>{windowEnd(r.station_id, r.evaluation_window_end)}</dd>
                  </dl>
                </li>
              ))}
            </ul>
            {/* Wider screens: table */}
            <div role="region" aria-label={t.tableRegionLabel} tabIndex={0}
              className="hidden overflow-x-auto sm:block focus-visible:outline-2 focus-visible:outline-ring">
              <table className={`${typography.body} w-full border-collapse text-left`}>
                <caption className="sr-only">{t.tableCaption}</caption>
                <thead>
                  <tr className="border-b border-border">
                    {[t.colStation, t.colPollutant, t.colHorizon, ...METRIC_KEYS.map((k) => METRIC_LABELS[k]), t.colWindowEnd].map((h) => (
                      <th key={h} scope="col" className="px-2 py-2 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={`${r.station_id}-${r.pollutant}-${r.horizon_hours}-${i}`} className="border-b border-border">
                      <th scope="row" className="px-2 py-2 font-normal">{stationLabel(r.station_id)}</th>
                      <td className="px-2 py-2">{formatPollutantId(r.pollutant)}</td>
                      <td className="px-2 py-2 tabular-nums">{r.horizon_hours}</td>
                      {METRIC_KEYS.map((k) => (
                        <td key={k} className="px-2 py-2 tabular-nums">{formatMetric(r[k])}</td>
                      ))}
                      <td className="px-2 py-2">{windowEnd(r.station_id, r.evaluation_window_end)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </>
    );
  }

  return (
    <main className={`${surface.page} mx-auto max-w-6xl space-y-4 p-4`}>
      <h1 className={typography.pageTitle}>{t.title}</h1>
      <p role="note" className={`${surface.card} ${typography.body} font-medium`}>{t.operatorOnly}</p>
      <p className={`${typography.body} ${surface.muted}`}>{t.intro}</p>
      {body}
    </main>
  );
}
