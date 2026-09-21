import { describe, expect, it } from "vitest";
import {
  coverageCounts,
  filterStations,
  resolvePollutant,
  sortStations,
  stationRank,
} from "@/lib/stations";
import type { Station } from "@/api/types";

function station(partial: Partial<Station> & { name: string }): Station {
  return {
    station_id: `site:${partial.name}`,
    name: partial.name,
    lat: 0,
    lon: 0,
    city: partial.city ?? "Somewhere",
    is_active: true,
    region_id: "r1",
    latest_observed_at: null,
    has_current_aqi: partial.has_current_aqi ?? false,
    has_current_forecast: partial.has_current_forecast ?? false,
  };
}

const withForecast = station({
  name: "Zulu Park",
  has_current_forecast: true,
  has_current_aqi: true,
});
const withReading = station({ name: "Alpha Road", has_current_aqi: true });
const bare = station({ name: "Beta Lane", city: "Othertown" });

describe("station ordering", () => {
  it("puts outlook first, then current reading, then the rest", () => {
    const sorted = sortStations([bare, withReading, withForecast]);
    expect(sorted.map((s) => s.name)).toEqual([
      "Zulu Park",
      "Alpha Road",
      "Beta Lane",
    ]);
  });

  it("never groups a station with no data alongside ones that have data", () => {
    expect(stationRank(bare)).toBeGreaterThan(stationRank(withReading));
    expect(stationRank(bare)).toBeGreaterThan(stationRank(withForecast));
  });

  it("breaks ties by name", () => {
    const a = station({ name: "Anvil", has_current_aqi: true });
    const b = station({ name: "Bellows", has_current_aqi: true });
    expect(sortStations([b, a]).map((s) => s.name)).toEqual(["Anvil", "Bellows"]);
  });
});

describe("coverage counts", () => {
  it("matches the list", () => {
    expect(coverageCounts([bare, withReading, withForecast])).toEqual({
      total: 3,
      withReading: 2,
      withForecast: 1,
    });
  });

  it("counts nothing for an empty list", () => {
    expect(coverageCounts([])).toEqual({
      total: 0,
      withReading: 0,
      withForecast: 0,
    });
  });
});

describe("search", () => {
  it("matches name case-insensitively", () => {
    expect(filterStations([bare, withReading], "alpha").map((s) => s.name)).toEqual(
      ["Alpha Road"],
    );
  });

  it("also matches city as a secondary aid", () => {
    expect(filterStations([bare, withReading], "othertown").map((s) => s.name)).toEqual(
      ["Beta Lane"],
    );
  });

  it("returns everything for a blank query", () => {
    expect(filterStations([bare, withReading], "   ")).toHaveLength(2);
  });

  it("returns nothing when there is no match", () => {
    expect(filterStations([bare, withReading], "zzz")).toHaveLength(0);
  });
});

describe("pollutant parameter", () => {
  it("keeps a pollutant the region lists", () => {
    expect(resolvePollutant("pm25", ["pm25", "no2"])).toBe("pm25");
  });

  it("drops an unknown pollutant instead of erroring", () => {
    expect(resolvePollutant("unobtainium", ["pm25"])).toBeUndefined();
    expect(resolvePollutant(undefined, ["pm25"])).toBeUndefined();
  });
});
