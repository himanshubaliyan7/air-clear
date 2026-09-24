/**
 * Pure helpers for the forecast-detail charts. No verdicts are derived here: these
 * only shape the values the API returned for drawing, and keep nulls as gaps.
 */
import type { Region } from "@/api/types";

export const LOOKBACK_OPTIONS = [7, 14, 30, 90] as const;
export const DEFAULT_LOOKBACK = 14;
export const MIN_LOOKBACK = 1;
export const MAX_LOOKBACK = 90;

/** Clamp a URL-supplied lookback to the API's documented 1–90 range. */
export function clampLookback(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return DEFAULT_LOOKBACK;
  return Math.min(MAX_LOOKBACK, Math.max(MIN_LOOKBACK, Math.round(n)));
}

export interface PollutantDetail {
  unit: string | null;
  thresholdConcentration: number | null;
  thresholdAveraging: string | null;
}

/** The region's details for one pollutant; every field null when absent. */
export function pollutantDetail(
  region: Pick<Region, "pollutant_details"> | null | undefined,
  pollutant: string | null | undefined,
): PollutantDetail {
  const list = (region as { pollutant_details?: unknown } | null | undefined)
    ?.pollutant_details;
  const found = Array.isArray(list)
    ? (list as Array<{
        id: string;
        unit?: string | null;
        health_threshold_concentration?: number | null;
        threshold_averaging?: string | null;
      }>).find((item) => item.id === pollutant)
    : undefined;
  const unit = found?.unit?.trim() ? found.unit.trim() : null;
  const threshold = found?.health_threshold_concentration;
  return {
    unit,
    thresholdConcentration:
      typeof threshold === "number" && Number.isFinite(threshold) ? threshold : null,
    thresholdAveraging: found?.threshold_averaging ?? null,
  };
}

/** The response's own zone; the region's only when the response omits it. */
export function responseZone(
  responseTimezone: string | null | undefined,
  regionTimezone: string,
): string {
  return responseTimezone && responseTimezone.trim() ? responseTimezone : regionTimezone;
}

export interface ChartPoint {
  x: number;
  y: number | null;
}

export function isValue(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

/** Split a series into runs of consecutive non-null points. A null is a gap, never zero. */
export function segments(points: ChartPoint[]): Array<Array<{ x: number; y: number }>> {
  const out: Array<Array<{ x: number; y: number }>> = [];
  let run: Array<{ x: number; y: number }> = [];
  for (const p of points) {
    if (isValue(p.y)) {
      run.push({ x: p.x, y: p.y });
    } else if (run.length) {
      out.push(run);
      run = [];
    }
  }
  if (run.length) out.push(run);
  return out;
}

export interface BandPoint {
  x: number;
  low: number | null;
  high: number | null;
}

/** Band runs drawn only where both bounds exist. */
export function bandSegments(
  points: BandPoint[],
): Array<Array<{ x: number; low: number; high: number }>> {
  const out: Array<Array<{ x: number; low: number; high: number }>> = [];
  let run: Array<{ x: number; low: number; high: number }> = [];
  for (const p of points) {
    if (isValue(p.low) && isValue(p.high)) {
      run.push({ x: p.x, low: p.low, high: p.high });
    } else if (run.length) {
      out.push(run);
      run = [];
    }
  }
  if (run.length) out.push(run);
  return out;
}

/** Value extent across everything drawn; the threshold is included only when non-null. */
export function valueExtent(
  values: Array<number | null | undefined>,
): [number, number] | null {
  const finite = values.filter(isValue);
  if (!finite.length) return null;
  let min = Math.min(...finite);
  let max = Math.max(...finite);
  if (min === max) {
    const pad = Math.abs(min) * 0.1 || 1;
    min -= pad;
    max += pad;
  }
  return [min, max];
}

/** Round, human-friendly tick values covering [min, max]. */
export function niceTicks(min: number, max: number, count = 5): number[] {
  const span = max - min;
  if (!(span > 0)) return [min];
  const raw = span / Math.max(1, count);
  const mag = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / mag;
  const step = (norm >= 5 ? 10 : norm >= 2 ? 5 : norm >= 1 ? 2 : 1) * mag;
  const start = Math.floor(min / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= max + step * 0.5; v += step) {
    ticks.push(Number(v.toPrecision(12)));
  }
  return ticks;
}

export function linearScale(
  domain: [number, number],
  range: [number, number],
): (v: number) => number {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const k = d1 === d0 ? 0 : (r1 - r0) / (d1 - d0);
  return (v) => r0 + (v - d0) * k;
}
