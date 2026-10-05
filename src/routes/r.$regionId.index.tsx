import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Activity, CalendarCheck, CalendarX, Search, TriangleAlert } from "lucide-react";
import { lazy, Suspense, useMemo, useState, type ReactNode } from "react";
import { overviewQuery } from "@/api/queries";
import { useRegion } from "@/region/region-context";
import {
  CategoryBar,
  OverviewSkeleton,
  RankList,
  StatTile,
  StationCard,
  VerdictBar,
} from "@/components/dashboard/overview";
import { CategoryLegend, NoDataSwatch } from "@/components/dashboard/tiles";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { strings } from "@/i18n/strings";
import { control, dashboard, surface, typography } from "@/design/tokens";
import { swatchStyle } from "@/lib/category-color";
import { regionBounds } from "@/lib/dashboard";
import {
  NO_DATA_FILTER,
  SORT_MODES,
  categoryDistribution,
  filterSummaries,
  overviewCounts,
  parseSortMode,
  rankByIndex,
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

function Tile({
  title,
  className,
  action,
  children,
}: {
  title: string;
  className: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className={`${dashboard.tile} ${className}`} aria-label={title}>
      <div className={dashboard.tileHeader}>
        <h2 className={dashboard.tileTitle}>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function RegionOverview() {
  const { regionId } = Route.useParams();
  const { q = "", pollutant: requestedPollutant, category, sort = "highest" } = Route.useSearch();
  const navigate = Route.useNavigate();
  const regionContext = useRegion();
  const { region, categories, pollutants } = regionContext;
  const [mapOpen, setMapOpen] = useState(false);
  const { data, isPending, error, refetch } = useQuery(overviewQuery(regionId));

  const pollutant = resolvePollutant(requestedPollutant, pollutants) ?? pollutants[0];
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
  const bounds = useMemo(() => regionBounds(region.bbox), [region]);

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
      <header className="space-y-2">
        <p className={typography.eyebrow}>{strings.overview.eyebrow}</p>
        <h1 className={typography.pageTitle}>{region.name}</h1>
        <p className={`${typography.body} ${surface.muted} max-w-2xl`}>
          {strings.overview.subtitle}
          {data && <> {strings.overview.updated(regionContext.formatAsOf(data.generated_at))}.</>}
        </p>
      </header>

      {isPending && <OverviewSkeleton />}
      {error && <ErrorState error={error} onRetry={() => void refetch()} />}

      {data && counts.total === 0 && (
        <EmptyState title={strings.stations.noneTitle} body={strings.stations.noneBody} />
      )}

      {data && counts.total > 0 && (
        <>
          <div className={dashboard.statGrid}>
            <StatTile
              icon={<Activity className="h-4 w-4" />}
              label={strings.overview.statReporting}
              value={String(counts.withReading)}
              note={strings.overview.statReportingNote(counts.total)}
            />
            <StatTile
              icon={<TriangleAlert className="h-4 w-4" />}
              label={strings.overview.statAbove}
              value={String(counts.atOrAboveThreshold)}
              note={strings.overview.statAboveNote}
            />
            <StatTile
              icon={<CalendarCheck className="h-4 w-4" />}
              label={`${strings.overview.nextDays}: ${go.view.label}`}
              value={String(go.count)}
              note={strings.overview.statVerdictNote(counts.withOutlook, pollutantLabel)}
            />
            <StatTile
              icon={<CalendarX className="h-4 w-4" />}
              label={`${strings.overview.nextDays}: ${noGo.view.label}`}
              value={String(noGo.count)}
              note={strings.overview.statVerdictNote(counts.withOutlook, pollutantLabel)}
            />
          </div>

          <div className={dashboard.grid}>
            <Tile title={strings.overview.nowBarTitle} className={dashboard.half}>
              <CategoryBar distribution={distribution} />
              <p className={`${typography.small} ${surface.muted} mt-3`}>
                {data.attribution} · {regionContext.aqiStandard}
              </p>
            </Tile>
            <Tile
              title={strings.overview.outlookBarTitle(pollutantLabel)}
              className={dashboard.half}
              action={
                pollutants.length > 1 && (
                  <label className="flex items-center gap-2">
                    <span className="sr-only">{strings.outlook.pollutantLabel}</span>
                    <select
                      className={`${control.input} w-auto py-1`}
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
              <p className={`${typography.small} ${surface.muted} mt-3`}>
                {strings.outlook.estimateNote}
              </p>
            </Tile>

            <Tile title={strings.overview.highestTitle} className={dashboard.half}>
              <RankList stations={rankByIndex(summaries, "highest")} regionId={regionId} />
            </Tile>
            <Tile title={strings.overview.lowestTitle} className={dashboard.half}>
              <RankList stations={rankByIndex(summaries, "lowest")} regionId={regionId} />
            </Tile>

            <Tile
              title={strings.dashboard.mapTitle}
              className={dashboard.full}
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
              <p className={`${typography.small} ${surface.muted} mb-2`}>
                {strings.dashboard.mapHint}
              </p>
              <CategoryLegend categories={categories} />
              {mapOpen && (
                <div className="mt-3">
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
            </Tile>
          </div>

          <section className="space-y-3" aria-labelledby="stations-heading">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 id="stations-heading" className={typography.sectionTitle}>
                {strings.overview.stationsTitle}
              </h2>
              <p className={`${typography.small} ${surface.muted}`}>
                {strings.stations.resultCount(visible.length, counts.total)}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
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
              className="flex flex-wrap gap-1.5"
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
                    <span
                      className={dashboard.swatch}
                      style={swatchStyle(item.color)}
                      aria-hidden="true"
                    />
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
              <EmptyState
                title={strings.stations.noMatchTitle}
                body={strings.stations.noMatchBody}
              >
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
              <ul className={dashboard.stationGrid}>
                {visible.map((station) => (
                  <li key={station.stationId}>
                    <StationCard station={station} regionId={regionId} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </section>
  );
}
