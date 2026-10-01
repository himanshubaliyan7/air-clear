import { describe, expect, it } from "vitest";
import { NO_DATA_COLOR, categoryColor, rankColor, rgbCss } from "@/lib/category-color";
import {
  distanceKm,
  forgetStation,
  nearbyStations,
  readRememberedStation,
  regionBounds,
  rememberStation,
  stationGlance,
} from "@/lib/dashboard";
import type { AqiCategory, OverviewStation } from "@/api/types";

const categories: AqiCategory[] = [
  { id: "c0", label: "Best" },
  { id: "c1", label: "Middle" },
  { id: "c2", label: "Worst" },
];

function station(partial: Partial<OverviewStation> & { station_id: string }): OverviewStation {
  return {
    name: partial.station_id,
    lat: 0,
    lon: 0,
    city: "Somewhere",
    region_id: "r1",
    current_aqi: {
      as_of: "2026-01-01T00:00:00Z",
      is_current: true,
      overall: { aqi: 250, category: "c1", driver: "p1" },
      at_or_above_health_threshold: false,
      pollutants: [],
    },
    outlooks: [],
    ...partial,
  };
}

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
  };
}

describe("category colour", () => {
  it("runs from the first ramp colour to the last and is never the no-data grey", () => {
    expect(rankColor(0, 3)).toEqual([46, 160, 92]);
    expect(rankColor(2, 3)).toEqual([124, 28, 46]);
    for (let rank = 0; rank < 6; rank++) {
      expect(rankColor(rank, 6)).not.toEqual(NO_DATA_COLOR);
    }
    expect(rankColor(0, 1)).toEqual([46, 160, 92]);
    expect(rankColor(99, 3)).toEqual(rankColor(2, 3));
  });

  it("gives a missing or unlisted category the neutral grey", () => {
    expect(categoryColor("c2", categories)).toEqual(rankColor(2, 3));
    expect(categoryColor("mystery", categories)).toEqual(NO_DATA_COLOR);
    expect(categoryColor(null, categories)).toEqual(NO_DATA_COLOR);
    expect(rgbCss([1, 2, 3])).toBe("rgb(1 2 3)");
  });
});

describe("station at a glance", () => {
  it("shows the server's category and index value for a current reading", () => {
    const glance = stationGlance(station({ station_id: "a" }), categories);
    expect(glance).toMatchObject({ hasValue: true, categoryLabel: "Middle", indexValue: 250 });
    expect(glance.color).toEqual(rankColor(1, 3));
  });

  it("has no value, and no category colour, without a usable current reading", () => {
    const base = station({ station_id: "a" }).current_aqi;
    const cases = [
      { ...base, is_current: false },
      { ...base, overall: null },
      { ...base, overall: { aqi: 10, category: "mystery", driver: "p1" } },
    ];
    for (const current_aqi of cases) {
      const glance = stationGlance(station({ station_id: "a", current_aqi }), categories);
      expect(glance).toMatchObject({ hasValue: false, categoryLabel: null, indexValue: null });
      expect(glance.color).toEqual(NO_DATA_COLOR);
    }
  });
});

describe("nearby stations", () => {
  const here = station({ station_id: "here", lat: 28.6, lon: 77.2 });
  const near = station({ station_id: "near", lat: 28.61, lon: 77.21 });
  const far = station({ station_id: "far", lat: 28.9, lon: 77.6 });
  const mid = station({ station_id: "mid", lat: 28.7, lon: 77.3 });

  it("measures distance on the globe", () => {
    expect(distanceKm(here, here)).toBe(0);
    expect(distanceKm({ lat: 0, lon: 0 }, { lat: 0, lon: 1 })).toBeCloseTo(111.19, 1);
  });

  it("lists the other stations nearest first, capped, without the station itself", () => {
    const result = nearbyStations([far, here, mid, near], "here", categories, 2);
    expect(result.map((s) => s.stationId)).toEqual(["near", "mid"]);
    expect(result[0]!.distanceKm).toBeLessThan(result[1]!.distanceKm);
    expect(nearbyStations([far, near], "missing", categories)).toEqual([]);
  });
});

describe("remembered station", () => {
  it("round-trips through storage and can be forgotten", () => {
    const storage = memoryStorage();
    expect(readRememberedStation(storage)).toBeNull();
    rememberStation(storage, { regionId: "r1", stationId: "site:1" });
    expect(readRememberedStation(storage)).toEqual({ regionId: "r1", stationId: "site:1" });
    forgetStation(storage);
    expect(readRememberedStation(storage)).toBeNull();
  });

  it("ignores damaged values and unavailable storage", () => {
    for (const raw of [
      "not json",
      "null",
      "{}",
      '{"regionId":"r1"}',
      '{"regionId":"","stationId":"x"}',
    ]) {
      expect(readRememberedStation(memoryStorage({ "air-clear:last-station": raw }))).toBeNull();
    }
    const broken = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
      removeItem: () => {
        throw new Error("blocked");
      },
    };
    expect(readRememberedStation(broken)).toBeNull();
    expect(() => rememberStation(broken, { regionId: "r1", stationId: "s" })).not.toThrow();
    expect(() => forgetStation(broken)).not.toThrow();
    expect(readRememberedStation(null)).toBeNull();
  });
});

describe("region bounds", () => {
  it("accepts only a well-formed bounding box", () => {
    expect(regionBounds([76, 28, 78, 29])).toEqual([76, 28, 78, 29]);
    expect(regionBounds([78, 28, 76, 29])).toBeNull();
    expect(regionBounds([76, 28, 78])).toBeNull();
    expect(regionBounds(null)).toBeNull();
  });
});
