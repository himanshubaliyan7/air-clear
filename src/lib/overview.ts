/**
 * Region overview shaping: one row per station, the counts behind the summary
 * bars, and the filter and order of the station grid.
 *
 * Pure functions only. Every category and verdict is the one the API returned;
 * nothing here judges air quality.
 *
 * SAFETY RULE: a station without a current outlook counts as `no-data`, whatever
 * verdict its last forecast carried. An old forecast must never read as a clearance.
 */
import type { AqiCategory, ExceedanceSummary, OverviewStation } from "@/api/types";
import { rankColor, type Rgb } from "@/lib/category-color";
import { stationGlance, type StationGlance } from "@/lib/dashboard";
import {
  RECOMMENDATIONS,
  describeRecommendation,
  type Recommendation,
  type RecommendationView,
} from "@/lib/recommendation";

export interface StationSummary extends StationGlance {
  /** The server's verdict for the outlook pollutant; `no-data` unless it is current. */
  recommendation: RecommendationView;
  /** The server's own flag for the current reading; null when it gave none. */
  atOrAboveThreshold: boolean | null;
  hasCurrentOutlook: boolean;
}

/** The outlook of one pollutant, or null when the station lists none for it. */
export function outlookFor(
  station: Pick<OverviewStation, "outlooks">,
  pollutant: string | undefined,
): ExceedanceSummary | null {
  if (!pollutant) return null;
  return station.outlooks.find((outlook) => outlook.pollutant === pollutant) ?? null;
}

export function stationSummary(
  station: OverviewStation,
  categories: readonly AqiCategory[],
  pollutant: string | undefined,
): StationSummary {
  const outlook = outlookFor(station, pollutant);
  const hasCurrentOutlook = outlook?.is_current === true;
  const current = station.current_aqi;
  return {
    ...stationGlance(station, categories),
    recommendation: describeRecommendation(
      hasCurrentOutlook ? outlook?.overall_recommendation : "no-data",
    ),
    atOrAboveThreshold: current.is_current ? (current.at_or_above_health_threshold ?? null) : null,
    hasCurrentOutlook,
  };
}

export interface CategoryCount {
  id: string;
  label: string;
  color: Rgb;
  count: number;
}

export interface CategoryDistribution {
  /** Every category the region lists, best to worst, including those with no station. */
  categories: CategoryCount[];
  /** Stations without a current reading in a listed category. */
  noData: number;
  total: number;
}

export function categoryDistribution(
  summaries: readonly StationSummary[],
  categories: readonly AqiCategory[],
): CategoryDistribution {
  const counts = new Map<string, number>();
  let noData = 0;
  for (const summary of summaries) {
    if (!summary.hasValue || summary.categoryId === null) noData += 1;
    else counts.set(summary.categoryId, (counts.get(summary.categoryId) ?? 0) + 1);
  }
  return {
    categories: categories.map((category, rank) => ({
      id: category.id,
      label: category.label || category.id,
      color: rankColor(rank, categories.length),
      count: counts.get(category.id) ?? 0,
    })),
    noData,
    total: summaries.length,
  };
}

export interface RecommendationCount {
  view: RecommendationView;
  count: number;
}

/** One entry per verdict, in the fixed order go, caution, no-go, no-data. */
export function recommendationDistribution(
  summaries: readonly StationSummary[],
): RecommendationCount[] {
  const counts = new Map<Recommendation, number>();
  for (const summary of summaries) {
    const value = summary.recommendation.value;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return RECOMMENDATIONS.map((value) => ({
    view: describeRecommendation(value),
    count: counts.get(value) ?? 0,
  }));
}

export interface OverviewCounts {
  total: number;
  withReading: number;
  withOutlook: number;
  /** Stations the server flags as at or above the health threshold right now. */
  atOrAboveThreshold: number;
}

export function overviewCounts(summaries: readonly StationSummary[]): OverviewCounts {
  return {
    total: summaries.length,
    withReading: summaries.filter((s) => s.hasValue).length,
    withOutlook: summaries.filter((s) => s.hasCurrentOutlook).length,
    atOrAboveThreshold: summaries.filter((s) => s.atOrAboveThreshold === true).length,
  };
}

/** Stations with a current index value, lowest or highest first. */
export function rankByIndex(
  summaries: readonly StationSummary[],
  direction: "lowest" | "highest",
  limit = 5,
): StationSummary[] {
  const sign = direction === "lowest" ? 1 : -1;
  return summaries
    .filter((s) => s.hasValue && s.indexValue !== null)
    .sort(
      (a, b) =>
        sign * ((a.indexValue ?? 0) - (b.indexValue ?? 0)) ||
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
    )
    .slice(0, limit);
}

export const SORT_MODES = ["highest", "lowest", "name"] as const;
export type SortMode = (typeof SORT_MODES)[number];

export function parseSortMode(value: unknown): SortMode {
  return (SORT_MODES as readonly unknown[]).includes(value) ? (value as SortMode) : "highest";
}

/** The category filter value for stations without a current reading. */
export const NO_DATA_FILTER = "no-data";

export interface StationFilter {
  query?: string | undefined;
  /** A category id, NO_DATA_FILTER, or nothing for every station. */
  category?: string | undefined;
}

export function filterSummaries(
  summaries: readonly StationSummary[],
  filter: StationFilter,
): StationSummary[] {
  const needle = (filter.query ?? "").trim().toLocaleLowerCase();
  return summaries.filter((summary) => {
    if (filter.category === NO_DATA_FILTER) {
      if (summary.hasValue) return false;
    } else if (filter.category && summary.categoryId !== filter.category) {
      return false;
    }
    if (!needle) return true;
    return (
      summary.name.toLocaleLowerCase().includes(needle) ||
      summary.city.toLocaleLowerCase().includes(needle)
    );
  });
}

/** Stations without a value always come last: they are never the "best" station. */
export function sortSummaries(
  summaries: readonly StationSummary[],
  mode: SortMode,
): StationSummary[] {
  const byName = (a: StationSummary, b: StationSummary) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  if (mode === "name") return [...summaries].sort(byName);
  const sign = mode === "lowest" ? 1 : -1;
  return [...summaries].sort((a, b) => {
    const aHas = a.hasValue && a.indexValue !== null;
    const bHas = b.hasValue && b.indexValue !== null;
    if (aHas !== bHas) return aHas ? -1 : 1;
    if (!aHas) return byName(a, b);
    return sign * ((a.indexValue ?? 0) - (b.indexValue ?? 0)) || byName(a, b);
  });
}

/** A share as a percentage for a bar segment; zero when there is nothing to divide. */
export function sharePercent(count: number, total: number): number {
  return total > 0 ? (count / total) * 100 : 0;
}
