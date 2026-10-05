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

/** The colour at a given opacity, for a tinted background behind a category. */
export function rgbaCss(color: Rgb, alpha: number): string {
  return `rgb(${color[0]} ${color[1]} ${color[2]} / ${alpha})`;
}

/**
 * Black or white, whichever reads better on the colour (WCAG relative luminance).
 * The ramp runs from light yellows to a dark maroon, so one text colour cannot serve.
 */
export function readableTextOn(color: Rgb): "#111827" | "#ffffff" {
  const channel = (value: number) => {
    const c = value / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const luminance =
    0.2126 * channel(color[0]) + 0.7152 * channel(color[1]) + 0.0722 * channel(color[2]);
  // Contrast against near-black (0.012) and white (1.0); pick the larger.
  return (luminance + 0.05) / 0.062 >= 1.05 / (luminance + 0.05) ? "#111827" : "#ffffff";
}

/** Inline style for a solid badge in a category's colour. */
export function badgeStyle(color: Rgb): { backgroundColor: string; color: string } {
  return { backgroundColor: rgbCss(color), color: readableTextOn(color) };
}
