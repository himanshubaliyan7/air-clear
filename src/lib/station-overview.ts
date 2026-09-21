import type { CurrentAqi, ExceedanceSummary } from "@/api/types";
import { strings } from "@/i18n/strings";
import { describeRecommendation } from "@/lib/recommendation";

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
