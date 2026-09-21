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

export function describeOutlook(summary: ExceedanceSummary) {
  const recommendation = describeRecommendation(summary.overall_recommendation);
  return {
    recommendation,
    hasDays: summary.days.length > 0,
    isPartialOrUnavailable: recommendation.isUnknown && summary.days.length > 0,
  };
}