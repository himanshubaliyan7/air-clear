/**
 * The tiles of the station dashboard. Each one lays out what the API returned:
 * every verdict, category and threshold decision shown here is the server's.
 */
import { Link } from "@tanstack/react-router";
import type { AqiCategory, CurrentAqi, ExceedanceSummary, History, Region } from "@/api/types";
import { Attribution } from "@/components/Attribution";
import { TimeChart } from "@/components/charts/TimeChart";
import { EmptyState } from "@/components/states";
import {
  NO_DATA_COLOR,
  categoryColor,
  rankColor,
  rgbCss,
  rgbaCss,
  swatchStyle,
} from "@/lib/category-color";
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
import {
  dashboard,
  recommendationTone,
  surface,
  typography,
  verdictChip,
  verdictFill,
} from "@/design/tokens";

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
  const color = categoryColor(reading.overall?.category, regionContext.categories);
  const categoryLabel = category?.label ?? reading.overall?.category ?? "";
  return (
    <>
      {reading.overall ? (
        <div
          className={dashboard.heroPanel}
          style={{ backgroundColor: rgbaCss(color, 0.12), borderColor: rgbaCss(color, 0.45) }}
        >
          <p className="flex flex-wrap items-end gap-x-3 gap-y-1">
            <span className={dashboard.heroIndex}>
              <span className="sr-only">{strings.current.overallLabel} </span>
              {formatNumber(reading.overall.aqi)}
            </span>
            <span className="pb-1">
              <span className={`flex items-center gap-2 ${dashboard.heroValue}`}>
                <span className={dashboard.swatch} style={swatchStyle(color)} aria-hidden="true" />
                {categoryLabel}
              </span>
              <span className={`${typography.small} ${surface.muted}`}>
                {strings.dashboard.drivenBy(formatPollutantId(reading.overall.driver))}
              </span>
            </span>
          </p>
          <CategoryScale
            categories={regionContext.categories}
            activeRank={category?.rank ?? null}
            activeLabel={categoryLabel}
          />
        </div>
      ) : (
        <p className={typography.body}>{strings.current.overallUnavailable}</p>
      )}
      <p className="mt-3 text-sm font-medium leading-relaxed">
        {currentThresholdMessage(reading.at_or_above_health_threshold)}
      </p>
      <p className={`${typography.small} ${surface.muted} mt-2`}>
        {asOf}
        {" · "}
        {reading.aqi_standard ?? regionContext.aqiStandard}
      </p>
      <Attribution text={reading.attribution} />
    </>
  );
}

/**
 * The region's categories as a strip, best to worst, with the current one raised.
 * Segments are equal: the API gives the order of the categories, not their bounds.
 */
function CategoryScale({
  categories,
  activeRank,
  activeLabel,
}: {
  categories: readonly AqiCategory[];
  activeRank: number | null;
  activeLabel: string;
}) {
  if (categories.length < 2) return null;
  return (
    <div role="img" aria-label={strings.dashboard.scaleLabel(activeLabel)}>
      <div className={dashboard.scale}>
        {categories.map((category, rank) => (
          <span
            key={category.id}
            className={rank === activeRank ? dashboard.scaleSegmentActive : dashboard.scaleSegment}
            style={swatchStyle(rankColor(rank, categories.length))}
          />
        ))}
      </div>
      <div className={dashboard.scaleLabels} aria-hidden="true">
        <span>{strings.dashboard.scaleBest}</span>
        <span>{strings.dashboard.scaleWorst}</span>
      </div>
    </div>
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
  // One scale for every tile, so the bars can be compared with each other.
  const scaleMax = Math.max(
    1,
    ...measured.map((item) => item.sub_index_max ?? item.sub_index_avg ?? 0),
  );
  const percent = (value: number | null) =>
    Math.min(100, Math.max(0, ((value ?? 0) / scaleMax) * 100));
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
            {item.sub_index_min !== null && item.sub_index_max !== null && (
              <div className={dashboard.rangeTrack} aria-hidden="true">
                <span
                  className={dashboard.rangeFill}
                  style={{
                    ...swatchStyle(categoryColor(item.category, regionContext.categories)),
                    left: `${percent(item.sub_index_min)}%`,
                    width: `${Math.max(4, percent(item.sub_index_max) - percent(item.sub_index_min))}%`,
                  }}
                />
              </div>
            )}
            <p className={`${typography.small} ${surface.muted} mt-1`}>
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
        <div className={`rounded-xl p-4 ${recommendationTone[view.recommendation.tone]}`}>
          <p className="flex items-center gap-2 text-xl font-semibold tracking-tight">
            <span
              className={`h-2.5 w-2.5 shrink-0 rounded-full ${verdictFill[view.recommendation.tone]}`}
              aria-hidden="true"
            />
            {view.recommendation.label}
          </p>
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
        <div className={`rounded-xl p-4 ${recommendationTone.unknown}`}>
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
        <ul className={dashboard.dayStrip}>
          {data.days.map((day) => {
            const verdict = describeDayVerdict(data, day);
            const upper = formatNumber(day.worst_case_value, { maximumFractionDigits: 0 });
            return (
              <li key={day.date} className={dashboard.dayCard}>
                <span
                  className={dashboard.dayBar}
                  style={swatchStyle(categoryColor(day.aqi_category, regionContext.categories))}
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1 sm:flex-none">
                  <p className={dashboard.dayName}>
                    {regionContext.formatDay(day.date) ?? day.date}
                  </p>
                  <p className={`${typography.small} ${surface.muted}`}>
                    {regionContext.describeCategory(day.aqi_category)?.label ?? day.aqi_category}
                  </p>
                </div>
                <div className="text-right sm:text-left">
                  {daily ? (
                    <>
                      <p className={dashboard.dayValue}>
                        <span className="sr-only">
                          {strings.dashboard.dayExpectedMean(concentration(day.expected_value))}
                        </span>
                        <span aria-hidden="true">
                          {strings.dashboard.dayMeanShort(
                            formatNumber(day.expected_value, { maximumFractionDigits: 0 }),
                          )}
                          {unit && (
                            <span className={`${typography.small} ${surface.muted} font-normal`}>
                              {" "}
                              {unit}
                            </span>
                          )}
                        </span>
                      </p>
                      <p className={`${typography.small} ${surface.muted}`}>
                        {strings.dashboard.dayUpTo(upper)}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-medium">
                        {strings.dashboard.dayChance(formatPercent(day.exceedance_probability))}
                      </p>
                      <p className={`${typography.small} ${surface.muted}`}>
                        {strings.dashboard.dayWorstCase(upper)}
                      </p>
                    </>
                  )}
                </div>
                {verdict && (
                  <span
                    className={`${dashboard.pill} shrink-0 self-center sm:self-start ${verdictChip[verdict.tone]}`}
                  >
                    {verdict.label}
                  </span>
                )}
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
      area
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
