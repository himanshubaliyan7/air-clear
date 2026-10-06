/**
 * Shaping for the instrument drawings: hour slots, stripe gradients, lane
 * positions and the density of the particle window.
 *
 * Pure functions only. A category is the one the API returned for that hour or
 * day; nothing here knows a breakpoint or judges air quality.
 *
 * SAFETY RULE: an hour without a measurement stays empty (null). It is never
 * filled from its neighbours and never given a colour from the scale.
 */
import type { AqiCategory, HistoryPoint } from "@/api/types";
import { categoryColor, rgbCss, type Rgb } from "@/lib/category-color";
import { niceTicks } from "@/lib/forecast-detail";

const HOUR_MS = 3_600_000;

export interface HourSlot {
  /** Start of the hour, in milliseconds. */
  time: number;
  value: number | null;
  /** The API's category for the value; null when it sent none. */
  category: string | null;
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/**
 * The last `hours` hours ending at the newest measured hour, one slot each.
 * Empty when nothing was measured at all.
 */
export function hourSlots(points: readonly HistoryPoint[], hours = 48): HourSlot[] {
  const measured = new Map<number, HourSlot>();
  for (const point of points) {
    if (!isNumber(point.actual)) continue;
    const ms = new Date(point.time).getTime();
    if (!Number.isFinite(ms)) continue;
    const time = Math.floor(ms / HOUR_MS) * HOUR_MS;
    measured.set(time, { time, value: point.actual, category: point.aqi_category ?? null });
  }
  if (measured.size === 0) return [];
  const newest = Math.max(...measured.keys());
  return Array.from({ length: hours }, (_, index) => {
    const time = newest - (hours - 1 - index) * HOUR_MS;
    return measured.get(time) ?? { time, value: null, category: null };
  });
}

/** The newest measured value among the slots, or null. */
export function latestValue(slots: readonly HourSlot[]): number | null {
  for (let index = slots.length - 1; index >= 0; index -= 1) {
    const value = slots[index]!.value;
    if (value !== null) return value;
  }
  return null;
}

/**
 * The colour of each hour for a stripe row: the category's colour, or null for
 * an hour with no category (not measured, or the API named none).
 */
export function stripeColors(
  categoryIds: ReadonlyArray<string | null | undefined>,
  categories: readonly AqiCategory[],
): Array<Rgb | null> {
  return categoryIds.map((id) =>
    id && categories.some((category) => category.id === id) ? categoryColor(id, categories) : null,
  );
}

/**
 * Equal-width vertical stripes as one CSS gradient. Runs of the same colour are
 * merged; a null stripe is transparent, so whatever lies behind shows through.
 */
export function stripeGradient(colors: ReadonlyArray<Rgb | null>): string | null {
  if (colors.length === 0) return null;
  const percent = (index: number) => `${Number(((index / colors.length) * 100).toFixed(3))}%`;
  const stops: string[] = [];
  let start = 0;
  for (let index = 1; index <= colors.length; index += 1) {
    const previous = colors[index - 1]!;
    const current = colors[index];
    const same =
      current !== undefined &&
      (current === previous ||
        (current !== null && previous !== null && current.every((v, i) => v === previous[i])));
    if (same) continue;
    stops.push(`${previous ? rgbCss(previous) : "transparent"} ${percent(start)} ${percent(index)}`);
    start = index;
  }
  return `linear-gradient(90deg, ${stops.join(", ")})`;
}

/** A round upper bound for an axis that starts at zero and covers every value. */
export function axisMax(values: ReadonlyArray<number | null | undefined>): number {
  const top = Math.max(0, ...values.filter(isNumber));
  if (top <= 0) return 1;
  const ticks = niceTicks(0, top, 4);
  const step = ticks.length > 1 ? ticks[1]! - ticks[0]! : top;
  return Number((Math.ceil(top / step) * step).toPrecision(12));
}

/** Where a value sits on an axis from zero to `max`, as a percentage clamped to 0–100. */
export function lanePercent(value: number | null | undefined, max: number): number {
  if (!isNumber(value) || !(max > 0)) return 0;
  return Math.min(100, Math.max(0, (value / max) * 100));
}

/**
 * How many dots the particle window draws: more for a higher concentration, on
 * a larger window, within fixed bounds. This is a drawing density, not a reading.
 */
export function particleCount(concentration: number | null, width: number, height: number): number {
  if (!isNumber(concentration) || concentration <= 0 || !(width > 0) || !(height > 0)) return 0;
  const areaFactor = Math.max(0.4, (width * height) / 420_000);
  return Math.round(Math.min(900, Math.max(14, concentration * 4.2) * areaFactor));
}

/** A calendar day (YYYY-MM-DD) as a short weekday, printed in UTC like formatCalendarDate. */
export function formatWeekdayShort(day: string | null | undefined): string | null {
  if (!day) return null;
  const date = new Date(`${day}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en", { timeZone: "UTC", weekday: "short" }).format(date);
}

/** A headline broken into at most two lines at a word boundary, the last word alone. */
export function headlineLines(text: string): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length < 2) return words.length ? [words[0]!] : [];
  return [words.slice(0, -1).join(" "), words[words.length - 1]!];
}
