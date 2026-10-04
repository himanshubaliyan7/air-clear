/**
 * The tiles of the station dashboard. Each one lays out what the API returned:
 * every verdict, category and threshold decision shown here is the server's.
 */
import { Link } from "@tanstack/react-router";
import type { AqiCategory, CurrentAqi, ExceedanceSummary, History, Region } from "@/api/types";
import { Attribution } from "@/components/Attribution";
import { TimeChart } from "@/components/charts/TimeChart";
import { EmptyState } from "@/components/states";
import { NO_DATA_COLOR, categoryColor, rgbCss, swatchStyle } from "@/lib/category-color";
import type { NearbyStation } from "@/lib/dashboard";
import { pollutantDetail, responseZone } from "@/lib/forecast-detail";
import {
  formatDateTimeInZone,
  formatNumber,
  formatPercent,
  formatTickInZone,
} from "@/lib/format-time";
import { formatPollutantId, withUnit } from "@/lib/pollutants";
import {
  currentReadingState,
  currentThresholdMessage,
  describeDayVerdict,
  describeOutlook,
  isDailyMean,
} from "@/lib/station-overview";
import type { RegionContextValue } from "@/region/region-context";
import { strings } from "@/i18n/strings";
import { dashboard, recommendationTone, surface, typography } from "@/design/tokens";

export function CategorySwatch({
  id,
  categories,
}: {
  id: string | null | undefined;
  categories: readonly AqiCategory[];
}) {
  return (
    <span
      className={dashboard.swatch}
      style={swatchStyle(categoryColor(id, categories))}
      aria-hidden="true"
    />
  );
}

export function NoDataSwatch() {
  return (
    <span
      className={dashboard.swatchHollow}
      style={{ borderColor: rgbCss(NO_DATA_COLOR) }}
      aria-hidden="true"
    />
  );
}

/** The official reading right now: the first thing a school needs. */
export function NowTile({
  reading,
  regionContext,
}: {
  reading: CurrentAqi;
  regionContext: RegionContextValue;
}) {
  const state = currentReadingState(reading);
  const asOf = regionContext.formatAsOf(reading.as_of);

  if (state !== "current") {
    return (
      <>
        <p className="text-lg font-semibold">{strings.current.noCurrentReading}</p>
        <p className={`${typography.body} ${surface.muted}`}>
          {state === "stale" ? strings.current.lastReadingWas(asOf) : strings.current.neverReported}
        </p>
        <Attribution text={reading.attribution} />
      </>
    );
  }

  const category = regionContext.describeCategory(reading.overall?.category);
  return (
    <>
      {reading.overall ? (
        <>
          <div
            className={dashboard.heroBar}
            style={swatchStyle(categoryColor(reading.overall.category, regionContext.categories))}
            aria-hidden="true"
          />
          <p className="flex flex-wrap items-baseline gap-x-3">
            <span className={dashboard.heroValue}>
              {category?.label ?? reading.overall.category}
            </span>
            <span className={`${typography.body} ${surface.muted}`}>
              {strings.dashboard.indexValue(formatNumber(reading.overall.aqi))}
            </span>
          </p>
        </>
      ) : (
        <p className={typography.body}>{strings.current.overallUnavailable}</p>
      )}
      <p className="mt-2 text-base font-medium">
        {currentThresholdMessage(reading.at_or_above_health_threshold)}
      </p>
      <p className={`${typography.small} ${surface.muted} mt-2`}>
        {asOf}
        {reading.overall && (
          <> · {strings.dashboard.drivenBy(formatPollutantId(reading.overall.driver))}</>
        )}
        {" · "}
        {reading.aqi_standard ?? regionContext.aqiStandard}
      </p>
      <Attribution text={reading.attribution} />
    </>
  );
}

/** One small tile per pollutant in the current reading. */
export function PollutantTiles({
  reading,
  regionContext,
}: {
  reading: CurrentAqi;
  regionContext: RegionContextValue;
}) {
  // A pollutant the station lists but has no value for adds nothing as a tile.
  const measured = reading.is_current
    ? reading.pollutants.filter((item) => item.sub_index_avg !== null)
    : [];
  if (measured.length === 0) {
    return <p className={typography.body}>{strings.current.noCurrentReading}</p>;
  }
  return (
    <>
      <ul className={dashboard.pollutantGrid}>
        {measured.map((item) => (
          <li key={item.pollutant_id} className={dashboard.pollutantTile}>
            <p className={`${typography.small} ${surface.muted}`}>
              {formatPollutantId(item.pollutant_id)}
            </p>
            <p className={dashboard.pollutantValue}>{formatNumber(item.sub_index_avg)}</p>
            <p className={`flex items-center gap-1 ${typography.small}`}>
              {item.category ? (
                <CategorySwatch id={item.category} categories={regionContext.categories} />
              ) : (
                <NoDataSwatch />
              )}
              {regionContext.describeCategory(item.category)?.label ??
                strings.common.notAvailableShort}
            </p>
            <p className={`${typography.small} ${surface.muted}`}>
              {strings.dashboard.pollutantRange(
                formatNumber(item.sub_index_min),
                formatNumber(item.sub_index_max),
              )}
            </p>
          </li>
        ))}
      </ul>
      <p className={`${typography.small} ${surface.muted} mt-2`}>
        {strings.current.subIndexLabel}. {strings.current.subIndexNote}
      </p>
    </>
  );
}

/** The outlook verdict and its days. */
export function OutlookTile({
  data,
  regionContext,
}: {
  data: ExceedanceSummary;
  regionContext: RegionContextValue;
}) {
  const view = describeOutlook(data);
  const madeAt = regionContext.formatAsOf(data.forecast_made_at);
  const daily = isDailyMean(data.target);
  const unit = pollutantDetail(regionContext.region, data.pollutant).unit;
  const concentration = (v: number | null | undefined) =>
    withUnit(formatNumber(v, { maximumFractionDigits: 0 }), unit);
  return (
    <div className="space-y-3">
      {view.isCurrent ? (
        <div className={`rounded-md p-3 ${recommendationTone[view.recommendation.tone]}`}>
          <p className="text-lg font-semibold">{view.recommendation.label}</p>
          <p className={typography.body}>{view.recommendation.description}</p>
          {daily && !view.recommendation.isUnknown && (
            <p className={`${typography.small} ${surface.muted} mt-1`}>
              {strings.outlook.overallCovers(data.days.length)}
            </p>
          )}
          {data.forecast_made_at && (
            <p className={`${typography.small} ${surface.muted} mt-1`}>
              {strings.outlook.madeAt(madeAt)}
            </p>
          )}
        </div>
      ) : (
        <div className={`rounded-md p-3 ${recommendationTone.unknown}`}>
          <p className="text-lg font-semibold">{strings.outlook.noCurrentForecast}</p>
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
        <p className={`${typography.small} ${surface.muted}`}>
          {strings.outlook.noneForStation} {strings.outlook.noneForStationWhy}
        </p>
      )}
      {view.isCurrent && view.isPartialOrUnavailable && (
        <p className={`${typography.small} ${surface.muted}`}>{strings.outlook.partialDaysNote}</p>
      )}
      {view.hasDays && (
        <ul className="divide-y divide-border">
          {data.days.map((day) => {
            const verdict = describeDayVerdict(data, day);
            return (
              <li key={day.date} className="py-2">
                <p className="flex items-center gap-2 text-sm">
                  <CategorySwatch id={day.aqi_category} categories={regionContext.categories} />
                  <span className="w-24 shrink-0 font-medium">
                    {regionContext.formatDay(day.date) ?? day.date}
                  </span>
                  <span>
                    {regionContext.describeCategory(day.aqi_category)?.label ?? day.aqi_category}
                  </span>
                  {verdict && <span className="ml-auto font-medium">{verdict.label}</span>}
                </p>
                <p className={`${typography.small} ${surface.muted} pl-5`}>
                  {daily ? (
                    <>
                      {strings.dashboard.dayExpectedMean(concentration(day.expected_value))}
                      {" · "}
                      {strings.dashboard.dayCouldReach(
                        formatNumber(day.worst_case_value, { maximumFractionDigits: 0 }),
                      )}
                    </>
                  ) : (
                    <>
                      {strings.dashboard.dayChance(formatPercent(day.exceedance_probability))}
                      {" · "}
                      {strings.dashboard.dayWorstCase(
                        formatNumber(day.worst_case_value, { maximumFractionDigits: 0 }),
                      )}
                    </>
                  )}
                </p>
              </li>
            );
          })}
        </ul>
      )}
      {daily && view.hasDays && (
        <p className={`${typography.small} ${surface.muted}`}>{strings.outlook.estimateNote}</p>
      )}
    </div>
  );
}

/** Measured values over the last two days, with the health threshold when known. */
export function HistoryTile({
  data,
  region,
  pollutant,
}: {
  data: History;
  region: Region;
  pollutant: string;
}) {
  const zone = responseZone(data.timezone, region.timezone);
  const detail = pollutantDetail(region, pollutant);
  const points = data.points
    .map((point) => ({ ...point, x: new Date(point.time).getTime() }))
    .filter((point) => Number.isFinite(point.x))
    .sort((a, b) => a.x - b.x);

  if (!points.some((point) => point.actual !== null && point.actual !== undefined)) {
    return <EmptyState body={strings.dashboard.historyEmpty} />;
  }

  const value = (v: number | null | undefined) =>
    v === null || v === undefined
      ? strings.chart.noValue
      : detail.unit
        ? `${formatNumber(v)} ${detail.unit}`
        : formatNumber(v);
  return (
    <TimeChart
      title={strings.dashboard.historyTitle(formatPollutantId(pollutant))}
      summary={strings.dashboard.historySummary(detail.unit ?? strings.forecastDetail.unitUnknown)}
      xs={points.map((point) => point.x)}
      lines={[
        {
          id: "actual",
          label: strings.forecastDetail.actual,
          tone: "primary",
          points: points.map((point) => ({ x: point.x, y: point.actual ?? null })),
        },
      ]}
      threshold={
        detail.thresholdConcentration !== null
          ? {
              value: detail.thresholdConcentration,
              label: strings.forecastDetail.thresholdLabel(
                value(detail.thresholdConcentration),
                detail.thresholdAveraging,
              ),
            }
          : null
      }
      axisLabel={
        detail.unit
          ? strings.forecastDetail.unitLabel(detail.unit)
          : strings.forecastDetail.unlabelledAxis
      }
      formatTick={(x) => formatTickInZone(x, zone)}
      formatValue={(v) => formatNumber(v)}
      tooltip={(index) => {
        const point = points[index]!;
        return {
          heading: formatDateTimeInZone(point.time, zone) ?? point.time,
          rows: [{ label: strings.forecastDetail.actual, value: value(point.actual) }],
        };
      }}
    />
  );
}

/** The closest other stations, each a link to its own dashboard. */
export function NearbyTile({
  stations,
  regionId,
}: {
  stations: readonly NearbyStation[];
  regionId: string;
}) {
  if (stations.length === 0) {
    return <p className={typography.body}>{strings.dashboard.nearbyEmpty}</p>;
  }
  return (
    <ul>
      {stations.map((station) => (
        <li key={station.stationId}>
          <Link
            to="/r/$regionId/s/$stationId"
            params={{ regionId, stationId: station.stationId }}
            search={(prev) => prev}
            className={dashboard.rowLink}
          >
            {station.hasValue ? (
              <span
                className={dashboard.swatch}
                style={swatchStyle(station.color)}
                aria-hidden="true"
              />
            ) : (
              <NoDataSwatch />
            )}
            <span className="min-w-0 flex-1 truncate">{station.name}</span>
            <span className={`${typography.small} whitespace-nowrap`}>
              {station.categoryLabel ?? strings.dashboard.noData}
              {station.indexValue !== null && ` · ${formatNumber(station.indexValue)}`}
            </span>
            <span className={`${typography.small} ${surface.muted} w-14 shrink-0 text-right`}>
              {strings.dashboard.distance(
                formatNumber(station.distanceKm, { maximumFractionDigits: 1 }),
              )}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** The colour key for the map and the lists. */
export function CategoryLegend({ categories }: { categories: readonly AqiCategory[] }) {
  return (
    <ul className="flex flex-wrap gap-x-3 gap-y-1" aria-label={strings.dashboard.legendTitle}>
      {categories.map((category) => (
        <li key={category.id} className={`flex items-center gap-1 ${typography.small}`}>
          <CategorySwatch id={category.id} categories={categories} />
          {category.label}
        </li>
      ))}
      <li
        className={`flex items-center gap-1 ${typography.small}`}
        title={strings.dashboard.noDataNote}
      >
        <NoDataSwatch />
        {strings.dashboard.noData}
      </li>
    </ul>
  );
}
