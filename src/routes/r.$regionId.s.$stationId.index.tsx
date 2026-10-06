import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import {
  currentAqiQuery,
  exceedanceQuery,
  forecastHistoryQuery,
  overviewQuery,
  stationsQuery,
} from "@/api/queries";
import { CategoryLegend, NowPlot, PollutantLanes } from "@/components/dashboard/tiles";
import { ForecastPlot } from "@/components/instrument/ForecastPlot";
import { HourBars } from "@/components/instrument/HourBars";
import { Lines, Section } from "@/components/instrument/primitives";
import { StationIndex } from "@/components/instrument/StationIndex";
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
import { pollutantDetail, responseZone } from "@/lib/forecast-detail";
import { formatNumber } from "@/lib/format-time";
import { formatPollutantId, withUnit } from "@/lib/pollutants";
import { resolvePollutant } from "@/lib/stations";
import { headlineLines, hourSlots, latestValue } from "@/lib/timeline";

/** The map and its library are fetched only when the visitor opens the map. */
const StationMap = lazy(() =>
  import("@/components/dashboard/StationMap").then((module) => ({ default: module.StationMap })),
);

/** How much history the hour bars show. */
const HISTORY_DAYS = 2;
const HISTORY_HOURS = HISTORY_DAYS * 24;

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

  // The overview offers a returning visitor this station as a shortcut.
  useEffect(() => {
    if (station) rememberStation(browserStorage(), { regionId, stationId });
    else if (stationMissing) forgetStation(browserStorage());
  }, [station, stationMissing, regionId, stationId]);

  const others = useMemo(
    () => nearbyStations(overview.data?.stations ?? [], stationId, categories, Infinity),
    [overview.data, stationId, categories],
  );
  const mapStations = useMemo(
    () => (overview.data?.stations ?? []).map((item) => stationGlance(item, categories)),
    [overview.data, categories],
  );
  const bounds = useMemo(() => regionBounds(region.bbox), [region]);
  const slots = useMemo(
    () => hourSlots(history.data?.points ?? [], HISTORY_HOURS),
    [history.data],
  );

  const setPollutant = (value: string) =>
    void navigate({ search: { pollutant: value }, replace: true });
  const openStation = (id: string) =>
    void navigate({
      to: "/r/$regionId/s/$stationId",
      params: { regionId, stationId: id },
      search: (prev) => prev,
    });

  const detail = pollutantDetail(region, pollutant);
  const pollutantLabel = pollutant ? formatPollutantId(pollutant) : "";
  const newest = latestValue(slots);
  const particles =
    newest === null
      ? null
      : {
          concentration: newest,
          note: strings.instrument.dotsNote(
            pollutantLabel,
            withUnit(formatNumber(newest, { maximumFractionDigits: 0 }), detail.unit),
          ),
        };
  const aboveThreshold = current.data?.is_current
    ? (current.data.at_or_above_health_threshold ?? null)
    : null;
  const accuracy = strings.about.accuracyStats[0];

  return (
    <section>
      {stations.isPending && <LoadingState />}
      {stations.error && (
        <ErrorState error={stations.error} onRetry={() => void stations.refetch()} />
      )}

      {stationMissing && (
        <div className="space-y-4">
          <EmptyState title={strings.stations.unknownTitle} body={strings.stations.unknownBody} />
          <Link to="/r/$regionId" params={{ regionId }} search={{}} className={control.button}>
            {strings.stations.backToList}
          </Link>
        </div>
      )}

      {station && (
        <div className="grid gap-x-12 gap-y-8 xl:grid-cols-[clamp(13rem,15vw,17rem)_minmax(0,1fr)]">
          <StationIndex stations={others} regionId={regionId} />

          {/* Keyed by station, so every drawing animates in again for a new station. */}
          <div key={stationId} className={`min-w-0 ${surface.section}`}>
            <header className="space-y-3">
              <p className={`rise-in flex flex-wrap items-center gap-x-4 ${typography.eyebrow}`}>
                <Link
                  to="/r/$regionId"
                  params={{ regionId }}
                  search={{}}
                  className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
                >
                  <ArrowLeft className="h-3 w-3" aria-hidden="true" />
                  {strings.dashboard.allStations}
                </Link>
                <span aria-hidden="true">/</span>
                {station.city}
              </p>
              <h1 className={typography.mega}>
                <Lines lines={headlineLines(station.name)} />
              </h1>
            </header>

            <div className="grid gap-x-12 gap-y-10 2xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
              <section aria-label={strings.dashboard.nowTitle} className="min-w-0">
                {current.isPending && <LoadingState />}
                {current.error && (
                  <ErrorState error={current.error} onRetry={() => void current.refetch()} />
                )}
                {current.data && (
                  <NowPlot reading={current.data} regionContext={regionContext} particles={particles} />
                )}
              </section>

              <Section
                title={strings.instrument.forecastTitle(pollutantLabel)}
                note={detail.unit ? strings.instrument.forecastUnit(detail.unit) : undefined}
                action={
                  pollutants.length > 1 && (
                    <label className="flex items-center gap-2">
                      <span className="sr-only">{strings.outlook.pollutantLabel}</span>
                      <select
                        className={`${control.input} w-auto py-1 ${typography.micro}`}
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
                {outlook.data && <ForecastPlot data={outlook.data} regionContext={regionContext} />}
                {station.has_current_forecast === true && (
                  <Link
                    to="/r/$regionId/s/$stationId/forecast"
                    params={{ regionId, stationId }}
                    search={pollutant ? { pollutant } : {}}
                    className={`${dashboard.link} mt-5 inline-block`}
                  >
                    {strings.forecastDetail.linkLabel}
                  </Link>
                )}
              </Section>
            </div>

            {pollutant && (
              <Section title={strings.instrument.barsTitle(pollutantLabel)}>
                {history.isPending && <LoadingState />}
                {history.error && (
                  <ErrorState error={history.error} onRetry={() => void history.refetch()} />
                )}
                {history.data &&
                  (slots.length === 0 ? (
                    <EmptyState body={strings.dashboard.historyEmpty} />
                  ) : (
                    <HourBars
                      slots={slots}
                      outlook={outlook.data ?? null}
                      categories={categories}
                      timeZone={responseZone(history.data.timezone, region.timezone)}
                      unit={detail.unit}
                      threshold={detail.thresholdConcentration}
                      describeCategory={regionContext.describeCategory}
                    />
                  ))}
              </Section>
            )}

            <div className="grid gap-x-12 gap-y-10 2xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
              <Section title={strings.dashboard.pollutantsTitle} note={strings.instrument.lanesNote}>
                {current.isPending && <LoadingState />}
                {current.data && (
                  <PollutantLanes reading={current.data} regionContext={regionContext} />
                )}
              </Section>

              <ul className="rise-in grid content-start self-start border border-border">
                <li className="border-b border-border p-5">
                  <p className={typography.eyebrow}>{strings.instrument.factThreshold}</p>
                  <p className="my-1 font-display text-[clamp(1.8rem,3vw,2.8rem)] font-semibold uppercase leading-none">
                    {aboveThreshold === true
                      ? strings.instrument.thresholdAbove
                      : aboveThreshold === false
                        ? strings.instrument.thresholdBelow
                        : strings.instrument.thresholdUnknown}
                  </p>
                  <p className={typography.eyebrow}>{regionContext.aqiStandard}</p>
                </li>
                <li className="p-5">
                  <p className={typography.eyebrow}>{strings.instrument.factAccuracy}</p>
                  <p className="my-1 font-display text-[clamp(1.8rem,3vw,2.8rem)] font-semibold uppercase leading-none">
                    {accuracy.value}
                  </p>
                  <p className={typography.eyebrow}>{accuracy.label}</p>
                  <Link to="/about" className={`${dashboard.link} mt-3 inline-block`}>
                    {strings.app.navAbout}
                  </Link>
                </li>
              </ul>
            </div>

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
              <p className={`mb-3 ${typography.small} ${surface.muted}`}>
                {strings.dashboard.mapHint}
              </p>
              <CategoryLegend categories={categories} />
              {mapOpen && (
                <div className="mt-4">
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
            </Section>
          </div>
        </div>
      )}
    </section>
  );
}
