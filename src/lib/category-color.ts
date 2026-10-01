/**
 * Colour for an AQI category, taken from its position in the region's best-to-worst
 * list. Nothing here knows a category name, so any standard works.
 *
 * SAFETY RULE: a missing or unrecognised category gets the neutral grey, never a
 * colour from the scale, so missing data can never look like clean air. Colour is
 * always shown next to the category's name; it is never the only signal.
 */
import type { AqiCategory } from "@/api/types";
import { describeCategory } from "@/lib/aqi-categories";

export type Rgb = [number, number, number];

/** Neutral grey for no data and for a category the region does not list. */
export const NO_DATA_COLOR: Rgb = [128, 134, 146];

/** Best to worst, light to dark. Interpolated for any number of categories. */
const RAMP: readonly Rgb[] = [
  [46, 160, 92],
  [148, 196, 74],
  [240, 200, 50],
  [240, 140, 40],
  [214, 54, 50],
  [124, 28, 46],
];

export function rankColor(rank: number, count: number): Rgb {
  if (count <= 1) return RAMP[0]!;
  const position = (Math.min(Math.max(rank, 0), count - 1) / (count - 1)) * (RAMP.length - 1);
  const lower = Math.floor(position);
  const upper = Math.min(lower + 1, RAMP.length - 1);
  const t = position - lower;
  const a = RAMP[lower]!;
  const b = RAMP[upper]!;
  return [0, 1, 2].map((i) => Math.round(a[i]! + (b[i]! - a[i]!) * t)) as Rgb;
}

export function categoryColor(
  id: string | null | undefined,
  categories: readonly AqiCategory[],
): Rgb {
  const view = describeCategory(id, categories);
  return view && view.rank !== null ? rankColor(view.rank, categories.length) : NO_DATA_COLOR;
}

export function rgbCss(color: Rgb): string {
  return `rgb(${color[0]} ${color[1]} ${color[2]})`;
}

/** Inline style for a swatch. */
export function swatchStyle(color: Rgb): { backgroundColor: string } {
  return { backgroundColor: rgbCss(color) };
}
