/**
 * AQI categories come entirely from the region: ids, labels, count and order
 * (best to worst). Nothing here knows any standard's category names.
 */
import type { AqiCategory, Region } from "@/api/types";

export interface CategoryView {
  id: string;
  label: string;
  /** Position in the region's best-to-worst order, or null when unrecognised. */
  rank: number | null;
  /** True when the id was not in the region's list and the label is a fallback. */
  isUnknown: boolean;
}

/** Turns an unrecognised id into something a person can read, e.g. "very_poor" -> "Very poor". */
export function humaniseCategoryId(id: string): string {
  const words = id.replace(/[_-]+/g, " ").trim().replace(/\s+/g, " ");
  if (!words) return id;
  return words.charAt(0).toUpperCase() + words.slice(1).toLowerCase();
}

export function describeCategory(
  id: string | null | undefined,
  categories: readonly AqiCategory[],
): CategoryView | null {
  if (!id) return null;
  const index = categories.findIndex((category) => category.id === id);
  if (index === -1) {
    // Unknown id: show a readable version rather than failing.
    return { id, label: humaniseCategoryId(id), rank: null, isUnknown: true };
  }
  const match = categories[index]!;
  return {
    id: match.id,
    label: match.label || humaniseCategoryId(match.id),
    rank: index,
    isUnknown: false,
  };
}

/**
 * Position of the region's health-threshold category. Informational only: whether a
 * current reading is at or above it is decided by the server
 * (`at_or_above_health_threshold`) and must never be recomputed here.
 */
export function healthThresholdRank(region: Region): number | null {
  const index = region.aqi_categories.findIndex(
    (category) => category.id === region.health_threshold_category,
  );
  return index === -1 ? null : index;
}
