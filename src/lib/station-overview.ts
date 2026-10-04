import type { CurrentAqi, ExceedanceSummary } from "@/api/types";
import { strings } from "@/i18n/strings";
import { describeRecommendation, type RecommendationView } from "@/lib/recommendation";

export type CurrentReadingState = "current" | "stale" | "never";

export function currentReadingState(reading: CurrentAqi): CurrentReadingState {
  if (reading.is_current) return "current";
  return reading.as_of ? "stale" : "never";
}

export function currentThresholdMessage(
  value: boolean | null | undefined,
): string {
  if (value === true) return strings.current.notRecommended;
  if (value === false) return strings.current.belowThreshold;
  return strings.current.noVerdict;
}

/** Mirrors currentReadingState, for the outlook's own age/currentness fields. */
export type OutlookState = CurrentReadingState;

export function outlookState(summary: ExceedanceSummary): OutlookState {
  if (summary.is_current) return "current";
  return summary.forecast_made_at ? "stale" : "never";
}

/** True when the values describe each day's mean rather than one forecast hour. */
export function isDailyMean(target: string | null | undefined): boolean {
  return target === "daily_mean";
}

/**
 * A day's own verdict, exactly as the server gave it. None for an outlook that is
 * not current: an old forecast must never read as a clearance.
 */
export function describeDayVerdict(
  summary: Pick<ExceedanceSummary, "is_current" | "target">,
  day: Pick<ExceedanceSummary["days"][number], "verdict">,
): RecommendationView | null {
  if (!summary.is_current || !isDailyMean(summary.target) || !day.verdict) return null;
  return describeRecommendation(day.verdict);
}

export function describeOutlook(summary: ExceedanceSummary) {
  const recommendation = describeRecommendation(summary.overall_recommendation);
  const state = outlookState(summary);
  return {
    recommendation,
    state,
    isCurrent: state === "current",
    hasDays: summary.days.length > 0,
    isPartialOrUnavailable: recommendation.isUnknown && summary.days.length > 0,
  };
}
