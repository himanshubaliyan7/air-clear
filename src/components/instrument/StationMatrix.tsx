/**
 * Every station as one row: its measured hours as colour stripes, then a cell
 * for each forecast day, then the verdict. Each row is a link to the station.
 *
 * SAFETY RULE: a station without measured hours, or without a current outlook,
 * shows the neutral hatching there. Nothing missing is ever given a colour.
 */
import { Link } from "@tanstack/react-router";
import type { AqiCategory, ExceedanceSummary, OverviewHistoryStation } from "@/api/types";
import { VerdictMark, stagger } from "@/components/instrument/primitives";
import { badgeStyle, categoryColor } from "@/lib/category-color";
import { formatNumber } from "@/lib/format-time";
import type { StationSummary } from "@/lib/overview";
import { isDailyMean } from "@/lib/station-overview";
import { formatWeekdayShort, stripeColors, stripeGradient } from "@/lib/timeline";
import { strings } from "@/i18n/strings";
import { surface, typography } from "@/design/tokens";

const columns =
  "grid items-center gap-x-5 gap-y-2 md:grid-cols-[2rem_minmax(8rem,17rem)_3.6rem_minmax(0,1fr)_11.5rem]";
const rowBase = `${columns} w-full grid-cols-[1.6rem_minmax(0,1fr)_auto] border-t border-hair px-2 py-3 transition-[background-color,opacity,padding] duration-200 [grid-template-areas:'rank_name_index''stripes_stripes_stripes''verdict_verdict_verdict'] hover:bg-muted hover:pl-5 focus-visible:bg-muted md:py-2 md:[grid-template-areas:'rank_name_index_stripes_verdict']`;
/** Measured hours, a break, then the forecast days. */
const stripeTrack = "grid h-8 min-w-0 grid-cols-[1fr_1.25rem_1.3fr] items-stretch [grid-area:stripes]";

export interface StationMatrixProps {
  stations: readonly StationSummary[];
  regionId: string;
  categories: readonly AqiCategory[];
  /** The outlook of the selected pollutant per station id; absent when it has none. */
  outlooks: ReadonlyMap<string, ExceedanceSummary>;
  /** Measured hours per station id; empty while loading or when the API has none. */
  history: ReadonlyMap<string, OverviewHistoryStation>;
}

function ForecastCells({
  outlook,
  categories,
}: {
  outlook: ExceedanceSummary | undefined;
  categories: readonly AqiCategory[];
}) {
  if (!outlook || !outlook.is_current || outlook.days.length === 0) {
    return (
      <span
        className={`hatch col-start-3 grid place-items-center overflow-hidden outline outline-1 -outline-offset-1 outline-dashed outline-border ${typography.eyebrow}`}
      >
        <span className="truncate px-2">{strings.instrument.noOutlookCells}</span>
      </span>
    );
  }
  const daily = isDailyMean(outlook.target);
  return (
    <span
      className="col-start-3 grid gap-0.5"
      style={{ gridTemplateColumns: `repeat(${outlook.days.length}, minmax(0, 1fr))` }}
    >
      {outlook.days.map((day) => (
        <span
          key={day.date}
          className={`grid place-items-center overflow-hidden font-mono text-[0.66rem] font-medium ${typography.number}`}
          style={badgeStyle(categoryColor(day.aqi_category, categories))}
        >
          {daily && formatNumber(day.expected_value, { maximumFractionDigits: 0 })}
        </span>
      ))}
    </span>
  );
}

export function StationMatrix({
  stations,
  regionId,
  categories,
  outlooks,
  history,
}: StationMatrixProps) {
  const headerDays =
    stations
      .map((station) => outlooks.get(station.stationId))
      .find((outlook) => outlook?.is_current && outlook.days.length > 0)?.days ?? [];

  return (
    <div className="group/matrix">
      <div className={`${columns} px-2 pb-2 max-md:hidden ${typography.eyebrow}`} aria-hidden="true">
        <span />
        <span>{strings.instrument.colStation}</span>
        <span className="text-right">{strings.instrument.colIndex}</span>
        <span className="grid grid-cols-[1fr_1.25rem_1.3fr]">
          <span>{strings.instrument.matrixHours}</span>
          <span />
          <span
            className="grid gap-0.5 text-center"
            style={{ gridTemplateColumns: `repeat(${Math.max(1, headerDays.length)}, minmax(0, 1fr))` }}
          >
            {headerDays.map((day) => (
              <span key={day.date}>{formatWeekdayShort(day.date)}</span>
            ))}
          </span>
        </span>
        <span>{strings.instrument.colNextDays}</span>
      </div>
      <ol>
        {stations.map((station, index) => {
          const hours = history.get(station.stationId);
          const measured = hours?.values.filter((value) => value !== null).length ?? 0;
          const gradient = hours ? stripeGradient(stripeColors(hours.categories, categories)) : null;
          return (
            <li key={station.stationId}>
              <Link
                to="/r/$regionId/s/$stationId"
                params={{ regionId, stationId: station.stationId }}
                search={{}}
                className={`${rowBase} group-hover/matrix:[&:not(:hover)]:opacity-45`}
              >
                <span className={`[grid-area:rank] ${typography.eyebrow} ${typography.number}`}>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0 [grid-area:name]">
                  <b className="block truncate font-display text-[1.05rem] font-semibold uppercase leading-tight">
                    {station.name}
                  </b>
                  <span className={`block truncate ${typography.eyebrow}`}>
                    {station.city}
                    {" · "}
                    {station.categoryLabel ?? strings.overview.noReading}
                  </span>
                </span>
                <span
                  className={`text-right font-display text-2xl font-semibold leading-none [grid-area:index] ${typography.number} ${station.hasValue ? "" : surface.muted}`}
                >
                  <span className="sr-only">{strings.overview.indexLabel} </span>
                  {station.hasValue && station.indexValue !== null
                    ? formatNumber(station.indexValue)
                    : strings.common.notAvailableShort}
                </span>
                <span className={`wipe ${stripeTrack}`} style={stagger(index)}>
                  <span
                    className="hatch"
                    role="img"
                    aria-label={
                      measured > 0
                        ? strings.instrument.stripesLabel(measured)
                        : strings.instrument.stripesEmpty
                    }
                  >
                    {/* An hour without a value is transparent, so the hatching shows through. */}
                    {gradient && measured > 0 && (
                      <span className="block h-full" style={{ backgroundImage: gradient }} />
                    )}
                  </span>
                  <ForecastCells outlook={outlooks.get(station.stationId)} categories={categories} />
                </span>
                <span className="[grid-area:verdict]">
                  <VerdictMark view={station.recommendation} prefix={strings.overview.nextDays} />
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
