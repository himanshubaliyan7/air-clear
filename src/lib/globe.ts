/**
 * Globe view shaping: which time steps the slider offers and what each station's
 * marker shows at a step.
 *
 * Pure functions only. Nothing here decides anything about air quality: the category
 * of a reading or a forecast day is the one the API returned, and its position in the
 * region's best-to-worst list picks the colour.
 *
 * SAFETY RULE: a station without a usable value at the selected step is "no-data".
 * It is drawn grey and hollow, never in a category colour, so missing data can never
 * look like clean air.
 */
import type { AqiCategory, ExceedanceSummary, OverviewStation } from "@/api/types";
import { describeCategory } from "@/lib/aqi-categories";

export type GlobeStep = { kind: "now" } | { kind: "day"; date: string };

export type Rgb = [number, number, number];

export interface GlobeMarker {
  stationId: string;
  name: string;
  lon: number;
  lat: number;
  /** "value": a category the region knows. "no-data": nothing usable at this step. */
  status: "value" | "no-data";
  categoryId: string | null;
  color: Rgb;
  /** 0..1, drives the column height. 0 for no-data. */
  magnitude: number;
}

/** Neutral grey for no-data and for a category the region does not list. */
export const NO_DATA_COLOR: Rgb = [128, 134, 146];

/** Best to worst. Interpolated, so a region with any number of categories works. */
const RAMP: readonly Rgb[] = [
  [46, 160, 92],
  [148, 196, 74],
  [240, 200, 50],
  [240, 140, 40],
  [214, 54, 50],
  [124, 28, 46],
];

/** The top of the scale used for the "now" column height (index values). */
const INDEX_SCALE_MAX = 500;

/** Inline style for a legend or panel swatch. */
export function swatchStyle(color: Rgb): { backgroundColor: string } {
  return { backgroundColor: `rgb(${color[0]} ${color[1]} ${color[2]})` };
}

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

export function outlookFor(station: OverviewStation, pollutant: string): ExceedanceSummary | null {
  return station.outlooks.find((outlook) => outlook.pollutant === pollutant) ?? null;
}

/**
 * "Now" plus every forecast day any station has for the pollutant, in date order.
 * Only current outlooks count: a stale run's days are not offered.
 */
export function globeSteps(
  stations: readonly OverviewStation[],
  pollutant: string,
  maxDays = 5,
): GlobeStep[] {
  const dates = new Set<string>();
  for (const station of stations) {
    const outlook = outlookFor(station, pollutant);
    if (!outlook?.is_current) continue;
    for (const day of outlook.days) dates.add(day.date);
  }
  const days = [...dates].sort().slice(0, maxDays);
  return [{ kind: "now" }, ...days.map((date) => ({ kind: "day" as const, date }))];
}

function noData(station: OverviewStation): GlobeMarker {
  return {
    stationId: station.station_id,
    name: station.name,
    lon: station.lon,
    lat: station.lat,
    status: "no-data",
    categoryId: null,
    color: NO_DATA_COLOR,
    magnitude: 0,
  };
}

export function markerFor(
  station: OverviewStation,
  categories: readonly AqiCategory[],
  step: GlobeStep,
  pollutant: string,
): GlobeMarker {
  let categoryId: string | null = null;
  let indexValue: number | null = null;

  if (step.kind === "now") {
    const current = station.current_aqi;
    if (!current.is_current || !current.overall) return noData(station);
    categoryId = current.overall.category;
    indexValue = current.overall.aqi;
  } else {
    const outlook = outlookFor(station, pollutant);
    if (!outlook?.is_current) return noData(station);
    const day = outlook.days.find((candidate) => candidate.date === step.date);
    if (!day) return noData(station);
    categoryId = day.aqi_category;
  }

  const view = describeCategory(categoryId, categories);
  if (!view || view.rank === null) {
    // A category the region does not list cannot be placed on the scale.
    return { ...noData(station), categoryId };
  }
  const count = categories.length;
  return {
    stationId: station.station_id,
    name: station.name,
    lon: station.lon,
    lat: station.lat,
    status: "value",
    categoryId,
    color: rankColor(view.rank, count),
    // "Now" has a real index value; a forecast day only has its category.
    magnitude:
      indexValue !== null
        ? Math.min(Math.max(indexValue / INDEX_SCALE_MAX, 0.02), 1)
        : (view.rank + 0.5) / count,
  };
}

export function globeMarkers(
  stations: readonly OverviewStation[],
  categories: readonly AqiCategory[],
  step: GlobeStep,
  pollutant: string,
): GlobeMarker[] {
  return stations.map((station) => markerFor(station, categories, step, pollutant));
}

export interface GlobeCounts {
  total: number;
  withValue: number;
  noData: number;
}

export function globeCounts(markers: readonly GlobeMarker[]): GlobeCounts {
  const withValue = markers.filter((marker) => marker.status === "value").length;
  return { total: markers.length, withValue, noData: markers.length - withValue };
}

/** [west, south, east, north] from a region's bbox, or null when it is not usable. */
export function regionBounds(
  bbox: readonly number[] | null | undefined,
): [number, number, number, number] | null {
  if (!bbox || bbox.length !== 4 || bbox.some((n) => !Number.isFinite(n))) return null;
  const [west, south, east, north] = bbox as [number, number, number, number];
  if (west >= east || south >= north) return null;
  return [west, south, east, north];
}
