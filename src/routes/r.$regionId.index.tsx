import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Search } from "lucide-react";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { overviewHistoryQuery, overviewQuery } from "@/api/queries";
import type { ExceedanceSummary, OverviewHistoryStation } from "@/api/types";
import { useRegion } from "@/region/region-context";
import { CategoryBar, OverviewSkeleton, StatCell, VerdictBar } from "@/components/dashboard/overview";
import { CategoryLegend, NoDataSwatch } from "@/components/dashboard/tiles";
import { Lines, Section, Square, stagger } from "@/components/instrument/primitives";
import { StationMatrix } from "@/components/instrument/StationMatrix";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { strings } from "@/i18n/strings";
import { control, dashboard, surface, typography } from "@/design/tokens";
import { browserStorage, readRememberedStation, regionBounds } from "@/lib/dashboard";
import {
  NO_DATA_FILTER,
  SORT_MODES,
  categoryDistribution,
  filterSummaries,
  outlookFor,
  overviewCounts,
  parseSortMode,
  recommendationDistribution,
  sortSummaries,
  stationSummary,
  type SortMode,
} from "@/lib/overview";
import { formatPollutantId } from "@/lib/pollutants";
import { resolvePollutant } from "@/lib/stations";

/** The map and its library are fetched only when the visitor opens the map. */
const StationMap = lazy(() =>
  import("@/components/dashboard/StationMap").then((module) => ({ default: module.StationMap })),
);

/**
 * Search parameters. Anything unparseable degrades to the default rather than
 * erroring, and each one is dropped from the URL when it holds the default.
 */
interface StationSearch {
  q?: string | undefined;
  pollutant?: string | undefined;
  category?: string | undefined;
  sort?: SortMode | undefined;
}

export const Route = createFileRoute("/r/$regionId/")({
  validateSearch: (search: Record<string, unknown>): StationSearch => {
    const result: StationSearch = {};
    for (const key of ["q", "pollutant", "category"] as const) {
      const value = search[key];
      if (typeof value === "string" && value !== "") result[key] = value;
    }
    if (search["sort"] !== undefined && parseSortMode(search["sort"]) !== "highest") {
      result.sort = parseSortMode(search["sort"]);
    }
    return result;
  },
  head: () => ({
    meta: [
      { title: `Stations — ${strings.app.name}` },
      {
        name: "description",
        content:
          "Every monitoring station in the region at a glance: the official reading right now and the outdoor-practice outlook for the next days.",
      },
      { property: "og:title", content: `Stations — ${strings.app.name}` },
      {
        property: "og:description",
        content: "Current air-quality readings and multi-day outlooks for every station.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RegionOverview,
});

function RegionOverview() {
  const { regionId } = Route.useParams();
  const { q = "", pollutant: requestedPollutant, category, sort = "highest" } = Route.useSearch();
  const navigate = Route.useNavigate();
  const regionContext = useRegion();
  const { region, categories, pollutants } = regionContext;
  const [mapOpen, setMapOpen] = useState(false);
  const { data, isPending, error, refetch } = useQuery(overviewQuery(regionId));

  const pollutant = resolvePollutant(requestedPollutant, pollutants) ?? pollutants[0];
  // The hour stripes: they decorate the rows, so a failure leaves the rows as they are.
  const hours = useQuery({ ...overviewHistoryQuery(regionId, pollutant), enabled: !!pollutant });

  const summaries = useMemo(
    () => (data?.stations ?? []).map((station) => stationSummary(station, categories, pollutant)),
    [data, categories, pollutant],
  );
  const counts = useMemo(() => overviewCounts(summaries), [summaries]);
  const distribution = useMemo(
    () => categoryDistribution(summaries, categories),
    [summaries, categories],
  );
  const verdicts = useMemo(() => recommendationDistribution(summaries), [summaries]);
  const visible = useMemo(
    () => sortSummaries(filterSummaries(summaries, { query: q, category }), sort),
    [summaries, q, category, sort],
  );
  const outlooks = useMemo(() => {
    const map = new Map<string, ExceedanceSummary>();
    for (const station of data?.stations ?? []) {
      const outlook = outlookFor(station, pollutant);
      if (outlook) map.set(station.station_id, outlook);
    }
    return map;
  }, [data, pollutant]);
  const history = useMemo(() => {
    const map = new Map<string, OverviewHistoryStation>();
    for (const station of hours.data?.stations ?? []) map.set(station.station_id, station);
    return map;
  }, [hours.data]);
  const bounds = useMemo(() => regionBounds(region.bbox), [region]);

  // The station this visitor opened last, read after mount: the server cannot know it.
  const [lastStationId, setLastStationId] = useState<string | null>(null);
  useEffect(() => {
    const remembered = readRememberedStation(browserStorage());
    setLastStationId(remembered?.regionId === regionId ? remembered.stationId : null);
  }, [regionId]);
  const lastStation = summaries.find((station) => station.stationId === lastStationId) ?? null;

  const setSearch = (patch: Partial<StationSearch>) =>
    void navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true });
  const openStation = (stationId: string) =>
    void navigate({ to: "/r/$regionId/s/$stationId", params: { regionId, stationId }, search: {} });

  const pollutantLabel = pollutant ? formatPollutantId(pollutant) : "";
  const verdictCount = (value: string) =>
    verdicts.find((item) => item.view.value === value) ?? verdicts[verdicts.length - 1]!;
  const go = verdictCount("go");
  const noGo = verdictCount("no-go");
  const filtered = q !== "" || category !== undefined;

  return (
    <section className={surface.section}>
      <header className="grid items-end gap-x-12 gap-y-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div>
          <p className={`rise-in ${typography.eyebrow}`}>
            {strings.instrument.kicker(counts.total, regionContext.aqiStandard)}
          </p>
          <h1 className={`mt-3 ${typography.mega}`}>
            <Lines lines={[region.name, strings.instrument.headlineTail]} />
          </h1>
        </div>
        <div className="rise-in space-y-4" style={stagger(3)}>
          <p className={typography.lead}>
            {data && counts.total > 0
              ? strings.instrument.lead(counts.withReading, counts.total, counts.atOrAboveThreshold)
              : strings.overview.subtitle}
          </p>
          {lastStation && (
            <Link
              to="/r/$regionId/s/$stationId"
              params={{ regionId, stationId: lastStation.stationId }}
              search={{}}
              className={control.button}
            >
              {strings.overview.lastViewed(lastStation.name)}
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          )}
        </div>
      </header>

      {isPending && <OverviewSkeleton />}
      {error && <ErrorState error={error} onRetry={() => void refetch()} />}

      {data && counts.total === 0 && (
        <EmptyState title={strings.stations.noneTitle} body={strings.stations.noneBody} />
      )}

      {data && counts.total > 0 && (
        <>
          <ul className={dashboard.statGrid} style={stagger(4)}>
            <StatCell
              label={strings.overview.statReporting}
              value={String(counts.withReading)}
              note={strings.overview.statReportingNote(counts.total)}
            />
            <StatCell
              label={strings.overview.statAbove}
              value={String(counts.atOrAboveThreshold)}
              note={strings.overview.statAboveNote}
            />
            <StatCell
              label={`${strings.overview.nextDays}: ${go.view.label}`}
              value={String(go.count)}
              note={strings.overview.statVerdictNote(counts.withOutlook, pollutantLabel)}
            />
            <StatCell
              label={`${strings.overview.nextDays}: ${noGo.view.label}`}
              value={String(noGo.count)}
              note={strings.overview.statVerdictNote(counts.withOutlook, pollutantLabel)}
            />
          </ul>

          <div className={dashboard.grid}>
            <Section
              title={strings.overview.nowBarTitle}
              note={strings.overview.statReportingNote(counts.total)}
              className={dashboard.half}
            >
              <CategoryBar distribution={distribution} />
              <p className={`mt-3 ${typography.small} ${surface.muted}`}>{data.attribution}</p>
            </Section>
            <Section
              title={strings.overview.outlookBarTitle(pollutantLabel)}
              className={dashboard.half}
              action={
                pollutants.length > 1 && (
                  <label className="flex items-center gap-2">
                    <span className="sr-only">{strings.outlook.pollutantLabel}</span>
                    <select
                      className={`${control.input} w-auto py-1 ${typography.micro}`}
                      value={pollutant}
                      onChange={(event) => setSearch({ pollutant: event.target.value })}
                    >
                      {pollutants.map((item) => (
                        <option key={item} value={item}>
                          {formatPollutantId(item)}
                        </option>
                      ))}
                    </select>
                  </label>
                )
              }
            >
              <VerdictBar counts={verdicts} />
              <p className={`mt-3 ${typography.small} ${surface.muted}`}>
                {strings.outlook.estimateNote}
              </p>
            </Section>
          </div>

          <Section
            title={strings.instrument.matrixTitle(pollutantLabel)}
            note={strings.stations.resultCount(visible.length, counts.total)}
          >
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <label className="relative min-w-[14rem] flex-1">
                <span className="sr-only">{strings.stations.searchLabel}</span>
                <Search
                  className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${surface.muted}`}
                  aria-hidden="true"
                />
                <input
                  type="search"
                  className={`${control.input} pl-9`}
                  value={q}
                  placeholder={strings.stations.searchPlaceholder}
                  title={strings.stations.searchHint}
                  onChange={(event) => setSearch({ q: event.target.value || undefined })}
                />
              </label>
              <label>
                <span className="sr-only">{strings.overview.sortLabel}</span>
                <select
                  className={`${control.input} w-auto`}
                  value={sort}
                  onChange={(event) => {
                    const mode = parseSortMode(event.target.value);
                    setSearch({ sort: mode === "highest" ? undefined : mode });
                  }}
                >
                  {SORT_MODES.map((mode) => (
                    <option key={mode} value={mode}>
                      {strings.overview.sort[mode]}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div
              className="mb-5 flex flex-wrap gap-1.5"
              role="group"
              aria-label={strings.overview.filterLabel}
            >
              <button
                type="button"
                className={category === undefined ? control.chipActive : control.chip}
                aria-pressed={category === undefined}
                onClick={() => setSearch({ category: undefined })}
              >
                {strings.overview.filterAll}
                <span className={typography.number}>{counts.total}</span>
              </button>
              {distribution.categories
                .filter((item) => item.count > 0)
                .map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={category === item.id ? control.chipActive : control.chip}
                    aria-pressed={category === item.id}
                    onClick={() =>
                      setSearch({ category: category === item.id ? undefined : item.id })
                    }
                  >
                    <Square color={item.color} />
                    {item.label}
                    <span className={typography.number}>{item.count}</span>
                  </button>
                ))}
              {distribution.noData > 0 && (
                <button
                  type="button"
                  className={category === NO_DATA_FILTER ? control.chipActive : control.chip}
                  aria-pressed={category === NO_DATA_FILTER}
                  onClick={() =>
                    setSearch({
                      category: category === NO_DATA_FILTER ? undefined : NO_DATA_FILTER,
                    })
                  }
                >
                  <NoDataSwatch />
                  {strings.dashboard.noData}
                  <span className={typography.number}>{distribution.noData}</span>
                </button>
              )}
            </div>

            {visible.length === 0 ? (
              <EmptyState title={strings.stations.noMatchTitle} body={strings.stations.noMatchBody}>
                {filtered && (
                  <button
                    type="button"
                    className={`${control.button} mt-3`}
                    onClick={() => setSearch({ q: undefined, category: undefined })}
                  >
                    {strings.stations.clearSearch}
                  </button>
                )}
              </EmptyState>
            ) : (
              <StationMatrix
                stations={visible}
                regionId={regionId}
                categories={categories}
                outlooks={outlooks}
                history={history}
              />
            )}
          </Section>

          <Section
            title={strings.dashboard.mapTitle}
            action={
              <button
                type="button"
                className={control.button}
                aria-expanded={mapOpen}
                onClick={() => setMapOpen((open) => !open)}
              >
                {mapOpen ? strings.dashboard.hideMap : strings.dashboard.showMap}
              </button>
            }
          >
            <p className={`mb-3 ${typography.small} ${surface.muted}`}>{strings.dashboard.mapHint}</p>
            <CategoryLegend categories={categories} />
            {mapOpen && (
              <div className="mt-4">
                <Suspense fallback={<LoadingState />}>
                  <StationMap
                    stations={summaries}
                    selectedId={null}
                    bounds={bounds}
                    onSelect={openStation}
                  />
                </Suspense>
              </div>
            )}
          </Section>
        </>
      )}
    </section>
  );
}
