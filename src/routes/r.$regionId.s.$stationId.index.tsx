import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  currentAqiQuery,
  exceedanceQuery,
  stationsQuery,
} from "@/api/queries";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { Attribution } from "@/components/Attribution";
import { AvailabilityMarker } from "@/components/AvailabilityMarker";
import { strings } from "@/i18n/strings";
import {
  control,
  recommendationTone,
  surface,
  typography,
} from "@/design/tokens";
import { useRegion } from "@/region/region-context";
import { formatNumber, formatPercent } from "@/lib/format-time";
import { formatPollutantId } from "@/lib/pollutants";
import { resolvePollutant } from "@/lib/stations";
import {
  currentReadingState,
  currentThresholdMessage,
  describeOutlook,
} from "@/lib/station-overview";
import type { CurrentAqi, ExceedanceSummary } from "@/api/types";

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
  component: StationOverview,
});

function StationOverview() {
  const { regionId, stationId } = Route.useParams();
  const { pollutant: requestedPollutant } = Route.useSearch();
  const navigate = Route.useNavigate();
  const regionContext = useRegion();
  const { region, pollutants } = regionContext;
  const stations = useQuery(stationsQuery(regionId));
  const station = stations.data?.find((item) => item.station_id === stationId) ?? null;
  const pollutant =
    resolvePollutant(requestedPollutant, pollutants) ?? pollutants[0];
  const current = useQuery({
    ...currentAqiQuery(stationId),
    enabled: station !== null,
  });
  const outlookParams = pollutant ? { pollutant } : {};
  const outlook = useQuery({
    ...exceedanceQuery(stationId, outlookParams),
    enabled: station !== null && pollutant !== undefined,
  });

  const setPollutant = (value: string) =>
    void navigate({ search: { pollutant: value }, replace: true });

  return (
    <section className={surface.section}>
      <Link
        to="/r/$regionId"
        params={{ regionId }}
        search={{}}
        className={typography.body}
      >
        {strings.stations.backToList}
      </Link>

      {stations.isPending && <LoadingState />}
      {stations.error && (
        <ErrorState error={stations.error} onRetry={() => void stations.refetch()} />
      )}

      {stations.data && !station && (
        <EmptyState
          title={strings.stations.unknownTitle}
          body={strings.stations.unknownBody}
        />
      )}

      {station && (
        <>
          <header>
            <h1 className={typography.pageTitle}>{station.name}</h1>
            <p className={`${typography.body} ${surface.muted}`}>{station.city}</p>
          </header>
          <div
            className="mt-3 flex flex-wrap gap-2"
            role="group"
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
          </div>

          <CurrentReadingSection query={current} regionContext={regionContext} />

          <section aria-labelledby="outlook-heading" className={surface.section}>
            <h2 id="outlook-heading" className={typography.sectionTitle}>
              {strings.outlook.sectionTitle}
            </h2>
            {station.has_current_forecast === true && (
              <Link
                to="/r/$regionId/s/$stationId/forecast"
                params={{ regionId, stationId }}
                search={pollutant ? { pollutant } : {}}
                className={control.button}
              >
                {strings.forecastDetail.linkLabel}
              </Link>
            )}

            {pollutants.length > 0 ? (
              <label className="block max-w-xs">
                <span className={`${typography.body} mb-1 block`}>
                  {strings.outlook.pollutantLabel}
                </span>
                <select
                  className={control.input}
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
            ) : (
              <EmptyState body={strings.outlook.noPollutants} />
            )}

            {pollutant && outlook.isPending && <LoadingState />}
            {pollutant && outlook.error && (
              <ErrorState
                error={outlook.error}
                onRetry={() => void outlook.refetch()}
              />
            )}
            {outlook.data && (
              <OutlookContent data={outlook.data} regionContext={regionContext} />
            )}
          </section>
        </>
      )}
    </section>
  );
}

function CurrentReadingSection({
  query,
  regionContext,
}: {
  query: {
    data: CurrentAqi | undefined;
    isPending: boolean;
    error: Error | null;
    refetch: () => Promise<unknown>;
  };
  regionContext: ReturnType<typeof useRegion>;
}) {
  const reading = query.data;

  return (
    <section aria-labelledby="current-heading" className={surface.section}>
      <h2 id="current-heading" className={typography.sectionTitle}>
        {strings.current.sectionTitle}
      </h2>
      {query.isPending && <LoadingState />}
      {query.error && (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      )}
      {reading && (
        <CurrentReadingContent reading={reading} regionContext={regionContext} />
      )}
    </section>
  );
}

function CurrentReadingContent({
  reading,
  regionContext,
}: {
  reading: CurrentAqi;
  regionContext: ReturnType<typeof useRegion>;
}) {
  const state = currentReadingState(reading);
  const asOf = regionContext.formatAsOf(reading.as_of);

  if (state !== "current") {
    return (
      <div className={surface.card}>
        <p className={typography.body}>{strings.current.noCurrentReading}</p>
        <p className={`${typography.body} ${surface.muted}`}>
          {state === "stale"
            ? strings.current.lastReadingWas(asOf)
            : strings.current.neverReported}
        </p>
        <Attribution text={reading.attribution} />
      </div>
    );
  }

  const overallCategory = regionContext.describeCategory(reading.overall?.category);
  return (
    <div className={surface.card}>
      <p className={`${typography.small} ${surface.muted}`}>{asOf}</p>
      <p className={typography.body}>
        {currentThresholdMessage(reading.at_or_above_health_threshold)}
      </p>
      {reading.overall ? (
        <dl className="mt-3 grid gap-2 sm:grid-cols-2">
          <div>
            <dt className={`${typography.small} ${surface.muted}`}>
              {strings.current.overallLabel}
            </dt>
            <dd className={typography.sectionTitle}>{formatNumber(reading.overall.aqi)}</dd>
          </div>
          <div>
            <dt className={`${typography.small} ${surface.muted}`}>
              {strings.current.categoryLabel}
            </dt>
            <dd className={typography.body}>
              {overallCategory?.label ?? strings.common.notAvailableShort}
            </dd>
          </div>
          <div>
            <dt className={`${typography.small} ${surface.muted}`}>
              {strings.current.driverLabel}
            </dt>
            <dd className={typography.body}>
              {formatPollutantId(reading.overall.driver)}
            </dd>
          </div>
          <div>
            <dt className={`${typography.small} ${surface.muted}`}>
              {strings.current.standardLabel}
            </dt>
            <dd className={typography.body}>
              {reading.aqi_standard ?? regionContext.aqiStandard}
            </dd>
          </div>
        </dl>
      ) : (
        <p className={`${typography.body} mt-3`}>{strings.current.overallUnavailable}</p>
      )}

      {reading.pollutants.length > 0 && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <caption className={`${typography.body} mb-2 text-left`}>
              {strings.current.subIndexLabel}
              <span className={`${typography.small} ${surface.muted} block`}>
                {strings.current.subIndexNote}
              </span>
            </caption>
            <thead>
              <tr className="border-b border-border">
                <th className="py-2 pr-3">{strings.current.pollutantLabel}</th>
                <th className="py-2 pr-3">{strings.current.averageLabel}</th>
                <th className="py-2 pr-3">{strings.current.spreadLabel}</th>
                <th className="py-2">{strings.current.categoryLabel}</th>
              </tr>
            </thead>
            <tbody>
              {reading.pollutants.map((item) => (
                <tr key={item.pollutant_id} className="border-b border-border">
                  <th scope="row" className="py-2 pr-3 font-medium">
                    {formatPollutantId(item.pollutant_id)}
                  </th>
                  <td className="py-2 pr-3">{formatNumber(item.sub_index_avg)}</td>
                  <td className="py-2 pr-3">
                    {formatNumber(item.sub_index_min)}–{formatNumber(item.sub_index_max)}
                  </td>
                  <td className="py-2">
                    {regionContext.describeCategory(item.category)?.label ??
                      strings.common.notAvailableShort}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Attribution text={reading.attribution} />
    </div>
  );
}

function OutlookContent({
  data,
  regionContext,
}: {
  data: ExceedanceSummary;
  regionContext: ReturnType<typeof useRegion>;
}) {
  const view = describeOutlook(data);
  const madeAt = regionContext.formatAsOf(data.forecast_made_at);
  return (
    <div className={surface.section}>
      {view.isCurrent ? (
        <div
          className={`${surface.card} ${recommendationTone[view.recommendation.tone]}`}
        >
          <h3 className={typography.sectionTitle}>{view.recommendation.label}</h3>
          <p className={typography.body}>{view.recommendation.description}</p>
          {data.forecast_made_at && (
            <p className={`${typography.small} ${surface.muted}`}>
              {strings.outlook.madeAt(madeAt)}
            </p>
          )}
        </div>
      ) : (
        <div className={surface.card}>
          <p className={typography.body}>{strings.outlook.noCurrentForecast}</p>
          <p className={`${typography.body} ${surface.muted}`}>
            {view.state === "stale"
              ? strings.outlook.lastForecastWas(madeAt)
              : strings.outlook.neverForecast}
          </p>
          {view.hasDays && (
            <p className={`${typography.small} ${surface.muted}`}>
              {strings.outlook.staleDaysNote}
            </p>
          )}
        </div>
      )}
      {!view.hasDays && (
        <EmptyState
          title={strings.outlook.noneForStation}
          body={strings.outlook.noneForStationWhy}
        />
      )}
      {view.isCurrent && view.isPartialOrUnavailable && (
        <p className={`${typography.body} ${surface.muted}`}>
          {strings.outlook.partialDaysNote}
        </p>
      )}
      {view.hasDays && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-border">
                <th className="py-2 pr-3">{strings.outlook.dayDate}</th>
                <th className="py-2 pr-3">{strings.outlook.dayCategory}</th>
                <th className="py-2 pr-3">{strings.outlook.dayProbability}</th>
                <th className="py-2">{strings.outlook.dayWorstCase}</th>
              </tr>
            </thead>
            <tbody>
              {data.days.map((day) => (
                <tr key={day.date} className="border-b border-border">
                  <th scope="row" className="py-2 pr-3 font-medium">
                    {regionContext.formatDay(day.date) ?? day.date}
                  </th>
                  <td className="py-2 pr-3">
                    {regionContext.describeCategory(day.aqi_category)?.label ?? day.aqi_category}
                  </td>
                  <td className="py-2 pr-3">
                    {formatPercent(day.exceedance_probability)}
                  </td>
                  <td className="py-2">{formatNumber(day.worst_case_value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
