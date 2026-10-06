/**
 * Station dashboard shaping: what a station shows at a glance in a list or on the
 * map, which stations are nearby, and which station the visitor looked at last.
 *
 * Pure functions only. A category is the one the API returned; nothing here judges
 * air quality.
 */
import type { AqiCategory, OverviewStation } from "@/api/types";
import { describeCategory } from "@/lib/aqi-categories";
import { NO_DATA_COLOR, rankColor, type Rgb } from "@/lib/category-color";

export interface StationGlance {
  stationId: string;
  name: string;
  city: string;
  lat: number;
  lon: number;
  /** False when there is no current reading with a category the region lists. */
  hasValue: boolean;
  /** The category's id as the API gave it, or null without a value. */
  categoryId: string | null;
  /** The category's label, or null without a value. */
  categoryLabel: string | null;
  indexValue: number | null;
  color: Rgb;
}

/** The current official reading of a station, reduced to what a list row needs. */
export function stationGlance(
  station: OverviewStation,
  categories: readonly AqiCategory[],
): StationGlance {
  const base = {
    stationId: station.station_id,
    name: station.name,
    city: station.city,
    lat: station.lat,
    lon: station.lon,
  };
  const current = station.current_aqi;
  const view =
    current.is_current && current.overall
      ? describeCategory(current.overall.category, categories)
      : null;
  if (!current.overall || !view || view.rank === null) {
    return {
      ...base,
      hasValue: false,
      categoryId: null,
      categoryLabel: null,
      indexValue: null,
      color: NO_DATA_COLOR,
    };
  }
  return {
    ...base,
    hasValue: true,
    categoryId: view.id,
    categoryLabel: view.label,
    indexValue: current.overall.aqi,
    color: rankColor(view.rank, categories.length),
  };
}

const EARTH_RADIUS_KM = 6371;

export function distanceKm(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number },
): number {
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

export interface NearbyStation extends StationGlance {
  distanceKm: number;
}

/** The closest other stations, nearest first. Stations without a value are kept. */
export function nearbyStations(
  stations: readonly OverviewStation[],
  stationId: string,
  categories: readonly AqiCategory[],
  limit = 6,
): NearbyStation[] {
  const origin = stations.find((station) => station.station_id === stationId);
  if (!origin) return [];
  return stations
    .filter((station) => station.station_id !== stationId)
    .map((station) => ({
      ...stationGlance(station, categories),
      distanceKm: distanceKm(origin, station),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);
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

/* ---- the station the visitor looked at last, per region ---- */

export interface RememberedStation {
  regionId: string;
  stationId: string;
}

/** The first version kept one slot for the whole site; it is still read. */
const LEGACY_KEY = "air-clear:last-station";
const STORAGE_KEY = "air-clear:last-stations";

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

interface Remembered {
  /** The region of the most recent visit. */
  latest: string;
  stations: Record<string, string>;
}

const isId = (value: unknown): value is string => typeof value === "string" && value !== "";

function readJson(storage: StorageLike | null | undefined, key: string): unknown {
  try {
    const raw = storage?.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function readLegacy(storage: StorageLike | null | undefined): RememberedStation | null {
  const value = readJson(storage, LEGACY_KEY) as Partial<RememberedStation> | null;
  return value && isId(value.regionId) && isId(value.stationId)
    ? { regionId: value.regionId, stationId: value.stationId }
    : null;
}

function readAll(storage: StorageLike | null | undefined): Remembered | null {
  const value = readJson(storage, STORAGE_KEY) as Partial<Remembered> | null;
  if (!value || !isId(value.latest) || !value.stations || typeof value.stations !== "object") {
    return null;
  }
  const stations: Record<string, string> = {};
  for (const [regionId, stationId] of Object.entries(value.stations)) {
    if (isId(stationId)) stations[regionId] = stationId;
  }
  return { latest: value.latest, stations };
}

/**
 * The station last opened in a region, or, without a region, the one opened most
 * recently anywhere. Storage can be missing or blocked (private mode); then nothing
 * is remembered.
 */
export function readRememberedStation(
  storage: StorageLike | null | undefined,
  regionId?: string,
): RememberedStation | null {
  const all = readAll(storage);
  const legacy = readLegacy(storage);
  const wanted = regionId ?? all?.latest ?? legacy?.regionId;
  if (!wanted) return null;
  const stationId = all?.stations[wanted];
  if (stationId) return { regionId: wanted, stationId };
  return legacy?.regionId === wanted ? legacy : null;
}

export function rememberStation(
  storage: StorageLike | null | undefined,
  station: RememberedStation,
): void {
  try {
    const legacy = readLegacy(storage);
    const stations = readAll(storage)?.stations ?? {};
    // A station kept only in the old single slot moves across with the first write.
    if (legacy && !stations[legacy.regionId]) stations[legacy.regionId] = legacy.stationId;
    stations[station.regionId] = station.stationId;
    const next: Remembered = { latest: station.regionId, stations };
    storage?.setItem(STORAGE_KEY, JSON.stringify(next));
    storage?.removeItem(LEGACY_KEY);
  } catch {
    // Not being able to remember is harmless.
  }
}

/** Drops one region's station, e.g. when it no longer exists; other regions stay. */
export function forgetStation(storage: StorageLike | null | undefined, regionId: string): void {
  try {
    const legacy = readLegacy(storage);
    if (legacy?.regionId === regionId) storage?.removeItem(LEGACY_KEY);
    const all = readAll(storage);
    if (!all?.stations[regionId]) return;
    const { [regionId]: _gone, ...stations } = all.stations;
    const latest = all.latest === regionId ? (Object.keys(stations)[0] ?? "") : all.latest;
    if (!latest) storage?.removeItem(STORAGE_KEY);
    else storage?.setItem(STORAGE_KEY, JSON.stringify({ latest, stations }));
  } catch {
    // As above.
  }
}

export function browserStorage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}
