/**
 * The current reading of a station: the plot with the index, and the pollutant
 * lanes. Each one lays out what the API returned: every category and threshold
 * decision shown here is the server's.
 */
import type { AqiCategory, CurrentAqi } from "@/api/types";
import { Attribution } from "@/components/Attribution";
import { AirWindow } from "@/components/instrument/AirWindow";
import { HollowSquare, Square, stagger, useCountUp } from "@/components/instrument/primitives";
import { NO_DATA_COLOR, categoryColor, rankColor, rgbCss, swatchStyle } from "@/lib/category-color";
import { formatNumber } from "@/lib/format-time";
import { formatPollutantId } from "@/lib/pollutants";
import { currentReadingState, currentThresholdMessage } from "@/lib/station-overview";
import { axisMax, lanePercent } from "@/lib/timeline";
import { niceTicks } from "@/lib/forecast-detail";
import type { RegionContextValue } from "@/region/region-context";
import { strings } from "@/i18n/strings";
import { shell, surface, typography } from "@/design/tokens";

export function CategorySwatch({
  id,
  categories,
}: {
  id: string | null | undefined;
  categories: readonly AqiCategory[];
}) {
  return <Square color={categoryColor(id, categories)} />;
}

export function NoDataSwatch() {
  return <HollowSquare color={NO_DATA_COLOR} />;
}

const plotFrame =
  "frame-draw plot-grid relative grid min-h-[clamp(19rem,34vw,30rem)] content-end overflow-hidden border border-border p-4 pr-16 sm:p-5 sm:pr-[4.5rem]";
const bigIndex =
  "-ml-[0.04em] font-display text-[clamp(6rem,17vw,16rem)] font-bold leading-[0.78] tracking-[-0.05em] tabular-nums";

function BigIndex({ value }: { value: number }) {
  const shown = useCountUp(Math.round(value));
  return (
    <span className={bigIndex}>
      <span className="sr-only">{strings.current.overallLabel} </span>
      {formatNumber(shown)}
    </span>
  );
}

/**
 * The region's categories as a vertical ruler, best at the foot, with a pointer
 * at the current one. Segments are equal: the API gives the order of the
 * categories, not their bounds, so the pointer marks a category, not a height.
 */
function CategoryRuler({
  categories,
  activeRank,
  activeLabel,
  value,
}: {
  categories: readonly AqiCategory[];
  activeRank: number | null;
  activeLabel: string;
  value: number;
}) {
  if (categories.length < 2) return null;
  const pointer = activeRank === null ? null : ((activeRank + 0.5) / categories.length) * 100;
  return (
    <div
      role="img"
      aria-label={strings.dashboard.scaleLabel(activeLabel)}
      className="absolute bottom-5 right-5 top-14 z-[2] flex w-2 flex-col-reverse gap-0.5"
    >
      {categories.map((category, rank) => (
        <span
          key={category.id}
          className={`flex-1 ${rank === activeRank ? "" : "opacity-30"}`}
          style={swatchStyle(rankColor(rank, categories.length))}
        />
      ))}
      {pointer !== null && (
        <span className="slide-up absolute -right-2 h-px w-12 bg-foreground" style={{ bottom: `${pointer}%` }}>
          <span className={`absolute bottom-1 right-5 ${typography.micro} ${typography.number}`}>
            {formatNumber(value)}
          </span>
        </span>
      )}
    </div>
  );
}

/** The official reading right now: the first thing a school needs. */
export function NowPlot({
  reading,
  regionContext,
  particles,
}: {
  reading: CurrentAqi;
  regionContext: RegionContextValue;
  /** What the drifting dots are drawn to, when a recent concentration is known. */
  particles: { concentration: number; note: string } | null;
}) {
  const state = currentReadingState(reading);
  const asOf = regionContext.formatAsOf(reading.as_of);

  if (state !== "current") {
    return (
      <div className="space-y-4">
        <div className={`${plotFrame} hatch`}>
          <p className="font-display text-[clamp(2.2rem,6vw,5rem)] font-semibold uppercase leading-[0.9]">
            {strings.current.noCurrentReading}
          </p>
        </div>
        <p className={typography.lead}>
          {state === "stale" ? strings.current.lastReadingWas(asOf) : strings.current.neverReported}
        </p>
        <Attribution text={reading.attribution} />
      </div>
    );
  }

  const category = regionContext.describeCategory(reading.overall?.category);
  const color = categoryColor(reading.overall?.category, regionContext.categories);
  const categoryLabel = category?.label ?? reading.overall?.category ?? "";
  return (
    <div className="space-y-4">
      <div className={plotFrame}>
        {particles && <AirWindow concentration={particles.concentration} tint={rgbCss(color)} />}
        <i className="scan" />
        <p className={`absolute left-4 top-4 z-[2] sm:left-5 ${typography.micro}`}>
          <span className={shell.liveDot} aria-hidden="true" />
          {strings.dashboard.nowTitle}
          {" · "}
          {asOf}
        </p>
        {reading.overall ? (
          <>
            <div className="relative z-[2] flex flex-wrap items-end gap-x-6 gap-y-1">
              <BigIndex value={reading.overall.aqi} />
              <span className="pb-2">
                <span className="flex items-center gap-3 font-display text-[clamp(1.3rem,2.6vw,2.4rem)] font-semibold uppercase leading-none">
                  <Square color={color} className="!h-[0.9em] !w-[0.9em]" />
                  {categoryLabel}
                </span>
                <span className={`mt-2 block ${typography.eyebrow}`}>
                  {strings.dashboard.drivenBy(formatPollutantId(reading.overall.driver))}
                  {" · "}
                  {reading.aqi_standard ?? regionContext.aqiStandard}
                </span>
                {particles && (
                  <span className={`mt-1 block ${typography.eyebrow}`}>{particles.note}</span>
                )}
              </span>
            </div>
            <CategoryRuler
              categories={regionContext.categories}
              activeRank={category?.rank ?? null}
              activeLabel={categoryLabel}
              value={reading.overall.aqi}
            />
          </>
        ) : (
          <p className={`relative z-[2] ${typography.lead}`}>{strings.current.overallUnavailable}</p>
        )}
      </div>
      <p className={typography.lead}>
        {currentThresholdMessage(reading.at_or_above_health_threshold)}
      </p>
      <p className={typography.eyebrow}>{strings.instrument.notAForecast}</p>
      <Attribution text={reading.attribution} />
    </div>
  );
}

const laneRow =
  "grid grid-cols-[3.6rem_minmax(0,1fr)_3rem] items-center gap-x-4 border-t border-hair py-2.5 transition-colors hover:bg-muted sm:grid-cols-[4.2rem_minmax(0,1fr)_3.4rem_8rem]";

/** One lane per pollutant on a shared axis: a diamond at the value, a line over its range. */
export function PollutantLanes({
  reading,
  regionContext,
}: {
  reading: CurrentAqi;
  regionContext: RegionContextValue;
}) {
  // A pollutant the station lists but has no value for adds nothing as a lane.
  const measured = reading.is_current
    ? reading.pollutants.filter((item) => item.sub_index_avg !== null)
    : [];
  if (measured.length === 0) {
    return <p className={`${surface.empty} ${typography.eyebrow}`}>{strings.current.noCurrentReading}</p>;
  }
  // One axis for every lane, so they can be compared with each other.
  const max = axisMax(measured.map((item) => item.sub_index_max ?? item.sub_index_avg));
  const ticks = niceTicks(0, max, 4).filter((tick) => tick < max * 0.98);
  return (
    <>
      <div className={`${laneRow} border-t-0 !py-0 hover:!bg-transparent`} aria-hidden="true">
        <span />
        <span className="relative h-6">
          {ticks.map((tick) => (
            <span
              key={tick}
              className={`absolute bottom-1 -translate-x-1/2 ${typography.eyebrow} ${typography.number}`}
              style={{ left: `${lanePercent(tick, max)}%` }}
            >
              {formatNumber(tick)}
            </span>
          ))}
        </span>
      </div>
      <ul>
        {measured.map((item, index) => {
          const color = categoryColor(item.category, regionContext.categories);
          const label = formatPollutantId(item.pollutant_id);
          const hasRange = item.sub_index_min !== null && item.sub_index_max !== null;
          return (
            <li key={item.pollutant_id} className={laneRow}>
              <span className={typography.micro}>{label}</span>
              <span
                className="relative h-6"
                role="img"
                aria-label={strings.instrument.laneLabel(
                  label,
                  formatNumber(item.sub_index_avg),
                  formatNumber(item.sub_index_min),
                  formatNumber(item.sub_index_max),
                )}
              >
                {hasRange && (
                  <i
                    className="grow-x absolute top-1/2 -mt-px h-0.5"
                    style={{
                      ...swatchStyle(color),
                      ...stagger(index),
                      left: `${lanePercent(item.sub_index_min, max)}%`,
                      width: `${lanePercent((item.sub_index_max ?? 0) - (item.sub_index_min ?? 0), max)}%`,
                    }}
                  />
                )}
                <i
                  className="pop absolute top-1/2 -ml-1.5 -mt-1.5 h-3 w-3 rotate-45 outline outline-2 outline-background"
                  style={{
                    ...swatchStyle(color),
                    ...stagger(index),
                    left: `${lanePercent(item.sub_index_avg, max)}%`,
                  }}
                />
              </span>
              <b className={`text-right font-display text-xl font-semibold ${typography.number}`}>
                {formatNumber(item.sub_index_avg)}
              </b>
              <span className={`hidden sm:block ${typography.eyebrow}`}>
                {regionContext.describeCategory(item.category)?.label ??
                  strings.common.notAvailableShort}
              </span>
            </li>
          );
        })}
      </ul>
      <p className={`mt-3 ${typography.small} ${surface.muted}`}>
        {strings.current.subIndexLabel}. {strings.current.subIndexNote}
      </p>
    </>
  );
}

/** The colour key for the map and the lists. */
export function CategoryLegend({ categories }: { categories: readonly AqiCategory[] }) {
  return (
    <ul
      className={`flex flex-wrap gap-x-5 gap-y-1.5 ${typography.eyebrow}`}
      aria-label={strings.dashboard.legendTitle}
    >
      {categories.map((category) => (
        <li key={category.id} className="flex items-center gap-2">
          <CategorySwatch id={category.id} categories={categories} />
          {category.label}
        </li>
      ))}
      <li className="flex items-center gap-2" title={strings.dashboard.noDataNote}>
        <NoDataSwatch />
        {strings.dashboard.noData}
      </li>
    </ul>
  );
}
