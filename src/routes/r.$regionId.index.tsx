import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { stationsQuery } from "@/api/queries";
import { useRegion } from "@/region/region-context";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { AvailabilityMarker } from "@/components/AvailabilityMarker";
import { strings } from "@/i18n/strings";
import { control, surface, typography } from "@/design/tokens";
import { coverageCounts, filterStations, sortStations } from "@/lib/stations";

/**
 * Search parameters. Phase 1 renders no pollutant control, but the parameter is
 * validated and carried so Phase 2 and 3 can use it without changing the URL
 * contract. Anything unparseable degrades to the default rather than erroring.
 */
interface StationSearch {
  q: string;
  pollutant?: string;
}

export const Route = createFileRoute("/r/$regionId/")({
  validateSearch: (search: Record<string, unknown>): StationSearch => ({
    q: typeof search["q"] === "string" ? search["q"] : "",
    pollutant:
      typeof search["pollutant"] === "string" && search["pollutant"]
        ? search["pollutant"]
        : undefined,
  }),
  head: () => ({
    meta: [
      { title: `Stations — ${strings.app.name}` },
      {
        name: "description",
        content:
          "Monitoring stations in the selected region, showing which have a current reading and which have a multi-day outlook.",
      },
      { property: "og:title", content: `Stations — ${strings.app.name}` },
      {
        property: "og:description",
        content:
          "Monitoring stations with current readings and multi-day outlooks.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StationList,
});

function StationList() {
  const { regionId } = Route.useParams();
  const { q } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { region } = useRegion();
  const { data, isPending, error, refetch } = useQuery(stationsQuery(regionId));

  const setQuery = (value: string) =>
    void navigate({
      search: (prev) => ({ ...prev, q: value }),
      replace: true,
    });

  const coverage = data ? coverageCounts(data) : null;
  const visible = data ? sortStations(filterStations(data, q)) : [];

  return (
    <section className={surface.section}>
      <h1 className={typography.pageTitle}>{region.name}</h1>
      <h2 className={typography.sectionTitle}>{strings.stations.listTitle}</h2>

      {isPending && <LoadingState />}
      {error && <ErrorState error={error} onRetry={() => void refetch()} />}

      {data && coverage && (
        <>
          <p
            aria-live="polite"
            className={`${typography.body} ${surface.muted}`}
          >
            {strings.stations.coverage(
              coverage.withReading,
              coverage.total,
              coverage.withForecast,
            )}{" "}
            {strings.stations.coverageWhy}
          </p>

          {coverage.total > 0 && (
            <div className="flex flex-wrap items-end gap-2">
              <label className="flex-1 min-w-[12rem]">
                <span className={`${typography.body} block mb-1`}>
                  {strings.stations.searchLabel}
                </span>
                <input
                  type="search"
                  className={control.input}
                  value={q}
                  placeholder={strings.stations.searchPlaceholder}
                  aria-describedby="station-search-hint"
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>
              {q !== "" && (
                <button
                  type="button"
                  className={control.button}
                  onClick={() => setQuery("")}
                >
                  {strings.stations.clearSearch}
                </button>
              )}
              <p
                id="station-search-hint"
                className={`${typography.small} ${surface.muted} w-full`}
              >
                {strings.stations.searchHint}
              </p>
            </div>
          )}

          {coverage.total === 0 && (
            <EmptyState
              title={strings.stations.noneTitle}
              body={strings.stations.noneBody}
            />
          )}

          {coverage.total > 0 && visible.length === 0 && (
            <EmptyState
              title={strings.stations.noMatchTitle}
              body={strings.stations.noMatchBody}
            >
              <button
                type="button"
                className={`${control.button} mt-3`}
                onClick={() => setQuery("")}
              >
                {strings.stations.clearSearch}
              </button>
            </EmptyState>
          )}

          {visible.length > 0 && (
            <>
              <p aria-live="polite" className={`${typography.small} ${surface.muted}`}>
                {strings.stations.resultCount(visible.length, coverage.total)}
              </p>
              <ul className="space-y-2">
                {visible.map((station) => (
                  <li key={station.station_id}>
                    <Link
                      to="/r/$regionId/s/$stationId"
                      params={{ regionId, stationId: station.station_id }}
                      search={(prev) => prev}
                      className={`${surface.card} block hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring`}
                    >
                      <span className={`${typography.sectionTitle} block`}>
                        {station.name}
                      </span>
                      <span
                        className={`${typography.body} ${surface.muted} block`}
                      >
                        {station.city}
                      </span>
                      <span
                        className="mt-2 flex flex-wrap gap-2"
                        aria-label={strings.stations.availabilityLabel}
                      >
                        <AvailabilityMarker
                          available={station.has_current_aqi === true}
                          availableText={strings.stations.hasCurrentReading}
                          unavailableText={strings.stations.noCurrentReading}
                        />
                        <AvailabilityMarker
                          available={station.has_current_forecast === true}
                          availableText={strings.stations.hasOutlook}
                          unavailableText={strings.stations.noOutlook}
                        />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </section>
  );
}
