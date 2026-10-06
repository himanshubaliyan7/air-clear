/**
 * What the home page shows for each region, and how a region's backtest reads.
 *
 * Pure functions only. Every count and category is the one the API returned for
 * that region; nothing here names a region or judges air quality.
 */
import type { Overview, Region, RegionBacktest } from "@/api/types";
import {
  categoryDistribution,
  overviewCounts,
  stationSummary,
  type CategoryDistribution,
} from "@/lib/overview";

/** `loading` before the overview arrived, `unavailable` when it failed. */
export type RegionGlanceState = "loading" | "unavailable" | "empty" | "ready";

export interface RegionGlance {
  regionId: string;
  name: string;
  country: string;
  aqiStandard: string;
  state: RegionGlanceState;
  total: number;
  reporting: number;
  atOrAboveThreshold: number;
  /** The strip of stations by category; null until there are stations. */
  distribution: CategoryDistribution | null;
}

/** `overview` is undefined while loading and null when its request failed. */
export function regionGlance(region: Region, overview: Overview | null | undefined): RegionGlance {
  const base = {
    regionId: region.id,
    name: region.name,
    country: region.country,
    aqiStandard: region.aqi_standard,
  };
  const none = { total: 0, reporting: 0, atOrAboveThreshold: 0, distribution: null };
  if (overview === undefined) return { ...base, ...none, state: "loading" };
  if (overview === null) return { ...base, ...none, state: "unavailable" };
  const categories = region.aqi_categories ?? [];
  const summaries = overview.stations.map((station) =>
    stationSummary(station, categories, undefined),
  );
  if (summaries.length === 0) return { ...base, ...none, state: "empty" };
  const counts = overviewCounts(summaries);
  return {
    ...base,
    state: "ready",
    total: counts.total,
    reporting: counts.withReading,
    atOrAboveThreshold: counts.atOrAboveThreshold,
    distribution: categoryDistribution(summaries, categories),
  };
}

/* ---- forecast accuracy ---- */

export interface AccuracyFigure {
  key: "tomorrow" | "dayFive" | "badDays";
  value: string;
}

export interface RegionAccuracy {
  period: string;
  figures: AccuracyFigure[];
}

const isShare = (n: unknown): n is number =>
  typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= 1;

const whole = (share: number) => Math.round(share * 100);

/** Exact-grade shares read as approximate: they are measured on a sample of days. */
export const approxPercent = (share: number) => `≈ ${whole(share)}%`;

/** One figure when both ends round alike, otherwise "low–high". */
export function percentRange(low: number, high: number): string {
  const [a, b] = [whole(Math.min(low, high)), whole(Math.max(low, high))];
  return a === b ? `${a}%` : `${a}–${b}%`;
}

/**
 * The figures to show for a region, or null when it has not been backtested or the
 * API sent something unusable: an absent figure is never shown as zero.
 */
export function regionAccuracy(
  backtest: RegionBacktest | null | undefined,
): RegionAccuracy | null {
  if (!backtest) return null;
  const { exact_grade_tomorrow: d1, exact_grade_day_5: d5 } = backtest;
  const { no_go_called_go_low: low, no_go_called_go_high: high } = backtest;
  if (!isShare(d1) || !isShare(d5) || !isShare(low) || !isShare(high)) return null;
  return {
    period: backtest.period,
    figures: [
      { key: "tomorrow", value: approxPercent(d1) },
      { key: "dayFive", value: approxPercent(d5) },
      { key: "badDays", value: percentRange(low, high) },
    ],
  };
}
