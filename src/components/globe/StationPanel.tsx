/**
 * What the selected station says: the official reading right now and the outlook for
 * the chosen pollutant. Every verdict, category and threshold decision shown here is
 * the server's; this only lays them out.
 */
import { Link } from "@tanstack/react-router";
import type { AqiCategory, OverviewStation, Region } from "@/api/types";
import { describeCategory } from "@/lib/aqi-categories";
import { formatAsOf, formatCalendarDate } from "@/lib/format-time";
import {
  NO_DATA_COLOR,
  outlookFor,
  rankColor,
  swatchStyle,
  type GlobeStep,
  type Rgb,
} from "@/lib/globe";
import { formatPollutantId } from "@/lib/pollutants";
import { describeRecommendation } from "@/lib/recommendation";
import { currentThresholdMessage } from "@/lib/station-overview";
import { strings } from "@/i18n/strings";
import { globe, recommendationTone, typography } from "@/design/tokens";

function categoryColor(id: string | null | undefined, categories: readonly AqiCategory[]): Rgb {
  const view = describeCategory(id, categories);
  return view && view.rank !== null ? rankColor(view.rank, categories.length) : NO_DATA_COLOR;
}

export function StationPanel({
  station,
  region,
  pollutant,
  step,
  onClose,
}: {
  station: OverviewStation;
  region: Region;
  pollutant: string;
  step: GlobeStep;
  onClose: () => void;
}) {
  const categories = region.aqi_categories ?? [];
  const current = station.current_aqi;
  const outlook = outlookFor(station, pollutant);
  const recommendation = describeRecommendation(outlook?.overall_recommendation);
  const days = outlook?.is_current ? outlook.days : [];

  return (
    <aside className={`${globe.panel} ${globe.chrome}`} aria-label={station.name}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className={typography.sectionTitle}>{station.name}</h2>
          <p className={`${typography.small} ${globe.muted}`}>{station.city}</p>
        </div>
        <button type="button" className={globe.textButton} onClick={onClose}>
          {strings.globe.closePanel}
        </button>
      </div>

      <section className="mt-3 space-y-1">
        <h3 className={globe.label}>{strings.globe.nowTitle}</h3>
        {current.is_current && current.overall ? (
          <>
            <p className="flex items-center gap-2 text-base font-semibold">
              <span
                className={globe.swatch}
                style={swatchStyle(categoryColor(current.overall.category, categories))}
                aria-hidden="true"
              />
              {describeCategory(current.overall.category, categories)?.label ??
                current.overall.category}
              <span className={`${typography.small} ${globe.muted} font-normal`}>
                {strings.globe.indexValue(current.overall.aqi)}
              </span>
            </p>
            <p className={typography.body}>
              {currentThresholdMessage(current.at_or_above_health_threshold)}
            </p>
            <p className={`${typography.small} ${globe.muted}`}>
              {formatAsOf(current.as_of, region.timezone)}
            </p>
          </>
        ) : (
          <p className={typography.body}>{strings.current.noCurrentReading}</p>
        )}
      </section>

      <section className="mt-4 space-y-2">
        <h3 className={globe.label}>{strings.globe.outlookTitle(formatPollutantId(pollutant))}</h3>
        <div
          className={`rounded-md p-2 text-foreground ${recommendationTone[recommendation.tone]}`}
        >
          <p className="text-sm font-semibold">{recommendation.label}</p>
          <p className={typography.small}>{recommendation.description}</p>
        </div>
        {days.length > 0 && (
          <ul className="space-y-1">
            {days.map((day) => {
              const shown = step.kind === "day" && step.date === day.date;
              return (
                <li
                  key={day.date}
                  className={`${globe.dayRow} ${shown ? globe.dayRowShown : ""}`}
                  aria-current={shown ? "true" : undefined}
                >
                  <span
                    className={globe.swatch}
                    style={swatchStyle(categoryColor(day.aqi_category, categories))}
                    aria-hidden="true"
                  />
                  <span className="w-20 shrink-0 whitespace-nowrap">
                    {formatCalendarDate(day.date) ?? day.date}
                  </span>
                  <span className="flex-1">
                    {describeCategory(day.aqi_category, categories)?.label ?? day.aqi_category}
                  </span>
                  <span
                    className={`${typography.small} ${globe.muted} whitespace-nowrap text-right`}
                  >
                    {day.exceedance_flag
                      ? strings.globe.dayLikelyAbove
                      : strings.globe.dayLikelyBelow}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <Link
        to="/r/$regionId/s/$stationId"
        params={{ regionId: region.id, stationId: station.station_id }}
        className={`${globe.textButton} mt-4 inline-block`}
      >
        {strings.globe.stationPage}
      </Link>
    </aside>
  );
}
