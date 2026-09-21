/**
 * The single mapping for `overall_recommendation`.
 *
 * SAFETY RULE: `no-data` — and any value the API adds that we do not recognise —
 * must never be presented as a go, a clearance, or any positive/safe state.
 * `isPositive` is true for exactly one value: "go".
 */
import { strings } from "@/i18n/strings";

export const RECOMMENDATIONS = ["go", "caution", "no-go", "no-data"] as const;

export type Recommendation = (typeof RECOMMENDATIONS)[number];

export type RecommendationTone = "positive" | "warning" | "critical" | "unknown";

export interface RecommendationView {
  value: Recommendation;
  label: string;
  description: string;
  tone: RecommendationTone;
  /** True only when the server actually cleared outdoor practice. */
  isPositive: boolean;
  /** True when there is no usable recommendation at all. */
  isUnknown: boolean;
}

export function parseRecommendation(value: string | null | undefined): Recommendation {
  // Anything unknown, missing or malformed degrades to "no usable recommendation".
  return (RECOMMENDATIONS as readonly string[]).includes(value ?? "")
    ? (value as Recommendation)
    : "no-data";
}

export function describeRecommendation(
  value: string | null | undefined,
): RecommendationView {
  const parsed = parseRecommendation(value);

  switch (parsed) {
    case "go":
      return {
        value: parsed,
        label: strings.recommendation.go.label,
        description: strings.recommendation.go.description,
        tone: "positive",
        isPositive: true,
        isUnknown: false,
      };
    case "caution":
      return {
        value: parsed,
        label: strings.recommendation.caution.label,
        description: strings.recommendation.caution.description,
        tone: "warning",
        isPositive: false,
        isUnknown: false,
      };
    case "no-go":
      return {
        value: parsed,
        label: strings.recommendation.noGo.label,
        description: strings.recommendation.noGo.description,
        tone: "critical",
        isPositive: false,
        isUnknown: false,
      };
    case "no-data":
      return {
        value: parsed,
        label: strings.recommendation.noData.label,
        description: strings.recommendation.noData.description,
        tone: "unknown",
        isPositive: false,
        isUnknown: true,
      };
    default: {
      // Exhaustiveness guard: adding a value to Recommendation breaks the build here.
      const exhaustive: never = parsed;
      return exhaustive;
    }
  }
}
