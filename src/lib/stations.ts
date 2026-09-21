/**
 * Station list shaping: filtering, ordering and coverage counts.
 *
 * Pure functions only. Nothing here decides anything about air quality; it reads the
 * availability flags the API already returns (`has_current_aqi`,
 * `has_current_forecast`) and never treats a missing flag as a positive signal.
 */
import type { Station } from "@/api/types";

/** Ordering rank: outlook first, then current reading, then everything else. */
export function stationRank(station: Station): number {
  if (station.has_current_forecast) return 0;
  if (station.has_current_aqi) return 1;
  return 2;
}

export function sortStations(stations: readonly Station[]): Station[] {
  return [...stations].sort((a, b) => {
    const byRank = stationRank(a) - stationRank(b);
    if (byRank !== 0) return byRank;
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });
}

/**
 * Name is the primary match; city is matched too as a secondary aid.
 * Case- and accent-insensitive, done over the already-loaded list.
 */
export function matchesQuery(station: Station, query: string): boolean {
  const needle = query.trim().toLocaleLowerCase();
  if (!needle) return true;
  return (
    station.name.toLocaleLowerCase().includes(needle) ||
    station.city.toLocaleLowerCase().includes(needle)
  );
}

export function filterStations(
  stations: readonly Station[],
  query: string,
): Station[] {
  return stations.filter((station) => matchesQuery(station, query));
}

export interface Coverage {
  total: number;
  withReading: number;
  withForecast: number;
}

export function coverageCounts(stations: readonly Station[]): Coverage {
  return {
    total: stations.length,
    withReading: stations.filter((s) => s.has_current_aqi === true).length,
    withForecast: stations.filter((s) => s.has_current_forecast === true).length,
  };
}

/**
 * Keeps the pollutant URL parameter honest: only a pollutant the region itself
 * lists survives. Phase 1 renders no chooser; the value is carried for later phases.
 */
export function resolvePollutant(
  value: string | undefined,
  regionPollutants: readonly string[],
): string | undefined {
  if (!value) return undefined;
  return regionPollutants.includes(value) ? value : undefined;
}
