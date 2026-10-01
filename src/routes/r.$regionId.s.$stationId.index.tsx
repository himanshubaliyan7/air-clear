import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { lazy, Suspense, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  currentAqiQuery,
  exceedanceQuery,
  forecastHistoryQuery,
  overviewQuery,
  stationsQuery,
} from "@/api/queries";
import {
  CategoryLegend,
  HistoryTile,
  NearbyTile,
  NowTile,
  OutlookTile,
  PollutantTiles,
} from "@/components/dashboard/tiles";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { strings } from "@/i18n/strings";
import { control, dashboard, surface, typography } from "@/design/tokens";
import { useRegion } from "@/region/region-context";
import {
  browserStorage,
  forgetStation,
  nearbyStations,
  regionBounds,
  rememberStation,
  stationGlance,
} from "@/lib/dashboard";
import { formatPollutantId } from "@/lib/pollutants";
import { resolvePollutant } from "@/lib/stations";

/** The map and its library are fetched only when the visitor opens the map. */
const StationMap = lazy(() =>
  import("@/components/dashboard/StationMap").then((module) => ({ default: module.StationMap })),
);

/** How much history the chart tile shows. */
const HISTORY_DAYS = 2;

interface StationOverviewSearch {
  pollutant?: string | undefined;
}

export const Route = createFileRoute("/r/$regionId/s/$stationId/")({
  validateSearch: (search: Record<string, unknown>): StationOverviewSearch => {
    const result: StationOverviewSearch = {};
    if (typeof search["pollutant"] === "string" && search["pollutant"] !== "") {
      result.pollutant = search["pollutant"];
    }
    return result;
  },
  head: () => ({
    meta: [
      { title: `Station — ${strings.app.name}` },
      {
        name: "description",
        content:
          "Current air-quality readings and the multi-day outlook for one monitoring station.",
      },
      { property: "og:title", content: `Station — ${strings.app.name}` },
      {
        property: "og:description",
        content:
          "Current air-quality readings and the multi-day outlook for one monitoring station.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StationDashboard,
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

function StationDashboard() {
  const { regionId, stationId } = Route.useParams();
  const { pollutant: requestedPollutant } = Route.useSearch();
  const navigate = Route.useNavigate();
  const regionContext = useRegion();
  const { region, pollutants, categories } = regionContext;
  const [mapOpen, setMapOpen] = useState(false);

  const stations = useQuery(stationsQuery(regionId));
  const station = stations.data?.find((item) => item.station_id === stationId) ?? null;
  const stationMissing = stations.data !== undefined && station === null;
  const pollutant = resolvePollutant(requestedPollutant, pollutants) ?? pollutants[0];

  const current = useQuery({ ...currentAqiQuery(stationId), enabled: station !== null });
  const outlook = useQuery({
    ...exceedanceQuery(stationId, pollutant ? { pollutant } : {}),
    enabled: station !== null && pollutant !== undefined,
  });
  const history = useQuery({
    ...forecastHistoryQuery(stationId, {
      ...(pollutant ? { pollutant } : {}),
      lookback_days: HISTORY_DAYS,
    }),
    enabled: station !== null && pollutant !== undefined,
  });
  const overview = useQuery({ ...overviewQuery(regionId), enabled: station !== null });

  // The home page brings a returning visitor back to this station.
  useEffect(() => {
    if (station) rememberStation(browserStorage(), { regionId, stationId });
    else if (stationMissing) forgetStation(browserStorage());
  }, [station, stationMissing, regionId, stationId]);

  const nearby = useMemo(
    () => nearbyStations(overview.data?.stations ?? [], stationId, categories),
    [overview.data, stationId, categories],
  );
  const mapStations = useMemo(
    () => (overview.data?.stations ?? []).map((item) => stationGlance(item, categories)),
    [overview.data, categories],
  );
  const bounds = useMemo(() => regionBounds(region.bbox), [region]);

  const setPollutant = (value: string) =>
    void navigate({ search: { pollutant: value }, replace: true });
  const openStation = (id: string) =>
    void navigate({
      to: "/r/$regionId/s/$stationId",
      params: { regionId, stationId: id },
      search: (prev) => prev,
    });

  return (
    <section className={surface.section}>
      {stations.isPending && <LoadingState />}
      {stations.error && (
        <ErrorState error={stations.error} onRetry={() => void stations.refetch()} />
      )}

      {stationMissing && (
        <>
          <EmptyState title={strings.stations.unknownTitle} body={strings.stations.unknownBody} />
          <Link to="/r/$regionId" params={{ regionId }} search={{}} className={control.button}>
            {strings.stations.backToList}
          </Link>
        </>
      )}

      {station && (
        <>
          <header className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className={typography.pageTitle}>{station.name}</h1>
              <p className={`${typography.body} ${surface.muted}`}>{station.city}</p>
            </div>
            <Link to="/r/$regionId" params={{ regionId }} search={{}} className={control.button}>
              {strings.dashboard.changeStation}
            </Link>
          </header>

          <div className={dashboard.grid}>
            <Tile title={strings.dashboard.nowTitle} className={dashboard.hero}>
              {current.isPending && <LoadingState />}
              {current.error && (
                <ErrorState error={current.error} onRetry={() => void current.refetch()} />
              )}
              {current.data && <NowTile reading={current.data} regionContext={regionContext} />}
            </Tile>

            <Tile
              title={strings.dashboard.outlookTitle}
              className={dashboard.outlook}
              action={
                pollutants.length > 1 && (
                  <label className="flex items-center gap-2">
                    <span className="sr-only">{strings.outlook.pollutantLabel}</span>
                    <select
                      className={`${control.input} w-auto py-1`}
                      value={pollutant}
                      onChange={(event) => setPollutant(event.target.value)}
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
              {pollutants.length === 0 && <EmptyState body={strings.outlook.noPollutants} />}
              {pollutant && outlook.isPending && <LoadingState />}
              {pollutant && outlook.error && (
                <ErrorState error={outlook.error} onRetry={() => void outlook.refetch()} />
              )}
              {outlook.data && <OutlookTile data={outlook.data} regionContext={regionContext} />}
              {station.has_current_forecast === true && (
                <Link
                  to="/r/$regionId/s/$stationId/forecast"
                  params={{ regionId, stationId }}
                  search={pollutant ? { pollutant } : {}}
                  className={`${dashboard.link} mt-3 inline-block`}
                >
                  {strings.forecastDetail.linkLabel}
                </Link>
              )}
            </Tile>

            <Tile title={strings.dashboard.pollutantsTitle} className={dashboard.pollutants}>
              {current.isPending && <LoadingState />}
              {current.data && (
                <PollutantTiles reading={current.data} regionContext={regionContext} />
              )}
            </Tile>

            {pollutant && (
              <Tile
                title={strings.dashboard.historyTitle(formatPollutantId(pollutant))}
                className={dashboard.history}
              >
                {history.isPending && <LoadingState />}
                {history.error && (
                  <ErrorState error={history.error} onRetry={() => void history.refetch()} />
                )}
                {history.data && (
                  <HistoryTile data={history.data} region={region} pollutant={pollutant} />
                )}
              </Tile>
            )}

            <Tile title={strings.dashboard.nearbyTitle} className={dashboard.nearby}>
              {overview.isPending && <LoadingState />}
              {overview.error && (
                <ErrorState error={overview.error} onRetry={() => void overview.refetch()} />
              )}
              {overview.data && <NearbyTile stations={nearby} regionId={regionId} />}
            </Tile>

            <Tile
              title={strings.dashboard.mapTitle}
              className={dashboard.map}
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
                      stations={mapStations}
                      selectedId={stationId}
                      bounds={bounds}
                      onSelect={openStation}
                    />
                  </Suspense>
                </div>
              )}
            </Tile>
          </div>
        </>
      )}
    </section>
  );
}
