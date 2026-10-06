/**
 * The outlook of a station: the verdict as a headline, then one lane per day
 * on a shared axis. Every verdict, category and threshold shown is the server's.
 *
 * SAFETY RULE: an outlook that is not current never shows a verdict word. It
 * says there is none, in the neutral hatching, whatever its last run carried.
 */
import type { ExceedanceSummary } from "@/api/types";
import { Lines, VerdictMark, stagger } from "@/components/instrument/primitives";
import { categoryColor, swatchStyle } from "@/lib/category-color";
import { niceTicks, pollutantDetail } from "@/lib/forecast-detail";
import { formatNumber, formatPercent } from "@/lib/format-time";
import { formatPollutantId } from "@/lib/pollutants";
import { describeDayVerdict, describeOutlook, isDailyMean } from "@/lib/station-overview";
import { axisMax, lanePercent } from "@/lib/timeline";
import type { RegionContextValue } from "@/region/region-context";
import { strings } from "@/i18n/strings";
import { surface, typography, verdictFill } from "@/design/tokens";

const word =
  "font-display text-[clamp(1.9rem,12.2cqi,5.6rem)] font-semibold uppercase leading-[0.86] tracking-[-0.02em]";
const dayRow =
  "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 border-t border-hair py-3 transition-colors hover:bg-muted [grid-template-areas:'day_verdict''lane_lane''values_values'] @md:grid-cols-[6rem_minmax(0,1fr)_6.5rem_max-content] @md:[grid-template-areas:'day_lane_values_verdict']";

function hasValue(value: number | null | undefined): value is number {
  return value !== null && value !== undefined && Number.isFinite(value);
}

export function ForecastPlot({
  data,
  regionContext,
}: {
  data: ExceedanceSummary;
  regionContext: RegionContextValue;
}) {
  const view = describeOutlook(data);
  const madeAt = regionContext.formatAsOf(data.forecast_made_at);
  const daily = isDailyMean(data.target);
  const detail = pollutantDetail(regionContext.region, data.pollutant);
  const threshold = detail.thresholdConcentration;
  const max = axisMax([...data.days.map((day) => day.worst_case_value), threshold]);
  const ticks = niceTicks(0, max, 4).filter((tick) => tick < max * 0.97);
  const whole = (value: number | null | undefined) =>
    formatNumber(value, { maximumFractionDigits: 0 });

  return (
    <div className="@container min-w-0">
      {view.isCurrent ? (
        <>
          <p className={word}>
            <Lines lines={view.recommendation.label.split(" ")} />
          </p>
          <i
            className={`grow-x my-4 block h-3 ${verdictFill[view.recommendation.tone]}`}
            aria-hidden="true"
          />
          <p className={typography.lead}>{view.recommendation.description}</p>
          <p className={`mt-2 ${typography.eyebrow}`}>
            {daily && !view.recommendation.isUnknown && (
              <>{strings.outlook.overallCovers(data.days.length)} </>
            )}
            {data.forecast_made_at && strings.outlook.madeAt(madeAt)}
          </p>
        </>
      ) : (
        <>
          <p className={word}>
            <Lines lines={strings.outlook.noCurrentForecast.replace(/\.$/, "").split(" ")} />
          </p>
          <i className={`my-4 block h-3 ${verdictFill.unknown}`} aria-hidden="true" />
          <p className={typography.lead}>
            {view.state === "stale"
              ? strings.outlook.lastForecastWas(madeAt)
              : strings.outlook.neverForecast}
          </p>
          {view.hasDays && (
            <p className={`mt-2 ${typography.eyebrow}`}>{strings.outlook.staleDaysNote}</p>
          )}
        </>
      )}

      {!view.hasDays && (
        <p className={`mt-6 ${surface.empty} ${typography.eyebrow}`}>
          {strings.outlook.noneForStation} {strings.outlook.noneForStationWhy}
        </p>
      )}
      {view.isCurrent && view.isPartialOrUnavailable && (
        <p className={`mt-3 ${typography.eyebrow}`}>{strings.outlook.partialDaysNote}</p>
      )}

      {view.hasDays && (
        <div className="mt-7">
          <div
            className={`${dayRow} border-t-0 !py-0 pb-1 hover:!bg-transparent ${typography.eyebrow}`}
            aria-hidden="true"
          >
            <span className="[grid-area:day] @max-md:hidden">{strings.instrument.colDay}</span>
            <span className="relative h-10 [grid-area:lane]">
              {daily &&
                ticks.map((tick) => (
                  <span
                    key={tick}
                    className={`absolute bottom-1 -translate-x-1/2 ${typography.number}`}
                    style={{ left: `${lanePercent(tick, max)}%` }}
                  >
                    {formatNumber(tick)}
                  </span>
                ))}
              {daily && threshold !== null && (
                <span
                  className={`absolute bottom-5 -translate-x-1/2 whitespace-nowrap text-foreground ${typography.number}`}
                  style={{ left: `${lanePercent(threshold, max)}%` }}
                >
                  {strings.instrument.limit(formatNumber(threshold))}
                </span>
              )}
            </span>
            <span className="[grid-area:values] @max-md:hidden">
              {daily ? strings.instrument.colMean : strings.outlook.dayProbability}
            </span>
            <span className="[grid-area:verdict] @max-md:hidden">{strings.instrument.colVerdict}</span>
          </div>
          <ul>
            {data.days.map((day, index) => {
              const verdict = describeDayVerdict(data, day);
              const color = categoryColor(day.aqi_category, regionContext.categories);
              const expected = lanePercent(day.expected_value, max);
              const upper = lanePercent(day.worst_case_value, max);
              return (
                <li key={day.date} className={dayRow}>
                  <span className="[grid-area:day]">
                    <span className={`block ${typography.micro}`}>
                      {regionContext.formatDay(day.date) ?? day.date}
                    </span>
                    <span className={`block ${typography.eyebrow}`}>
                      {regionContext.describeCategory(day.aqi_category)?.label ?? day.aqi_category}
                    </span>
                  </span>
                  {daily ? (
                    <span
                      className="relative h-6 [grid-area:lane]"
                      role="img"
                      aria-label={strings.instrument.dayRange(
                        whole(day.expected_value),
                        whole(day.worst_case_value),
                      )}
                    >
                      {threshold !== null && (
                        <i
                          className="absolute -bottom-3 -top-3 border-l border-dashed border-foreground/60"
                          style={{ left: `${lanePercent(threshold, max)}%` }}
                        />
                      )}
                      <i
                        className="grow-x absolute top-1/2 -mt-px h-0.5 after:absolute after:-top-[5px] after:right-0 after:h-3 after:w-0.5 after:bg-[inherit]"
                        style={{
                          ...swatchStyle(color),
                          ...stagger(index),
                          left: `${expected}%`,
                          width: `${Math.max(0, upper - expected)}%`,
                        }}
                      />
                      <i
                        className="pop absolute top-1/2 -ml-1.5 -mt-1.5 h-3 w-3 rotate-45 outline outline-2 outline-background"
                        style={{ ...swatchStyle(color), ...stagger(index), left: `${expected}%` }}
                      />
                    </span>
                  ) : (
                    <span className="[grid-area:lane]" />
                  )}
                  <span className={`whitespace-nowrap font-mono text-[0.8rem] [grid-area:values] ${typography.number}`}>
                    {daily ? (
                      <>
                        <b className="font-display text-xl font-semibold">
                          {whole(day.expected_value)}
                        </b>
                        {" → "}
                        {whole(day.worst_case_value)}
                        {hasValue(day.expected_sub_index) && (
                          <span className={`block ${typography.eyebrow}`}>
                            {strings.dashboard.dayIndex(
                              formatPollutantId(data.pollutant),
                              formatNumber(day.expected_sub_index),
                            )}
                          </span>
                        )}
                      </>
                    ) : (
                      <>
                        {strings.dashboard.dayChance(formatPercent(day.exceedance_probability))}
                        <span className={`block ${typography.eyebrow}`}>
                          {strings.dashboard.dayWorstCase(whole(day.worst_case_value))}
                        </span>
                      </>
                    )}
                  </span>
                  <span className="justify-self-end [grid-area:verdict] @md:justify-self-start">
                    {verdict && <VerdictMark view={verdict} />}
                  </span>
                </li>
              );
            })}
          </ul>
          {daily && (
            <p className={`mt-4 max-w-[70ch] ${typography.small} ${surface.muted}`}>
              {strings.outlook.estimateNote} {strings.instrument.plotNote}
              {data.days.some((day) => hasValue(day.expected_sub_index)) && (
                <> {strings.outlook.indexNote(formatPollutantId(data.pollutant))}</>
              )}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
