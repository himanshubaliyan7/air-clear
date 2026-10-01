import { describe, expect, it } from "vitest";
import {
  NO_DATA_COLOR,
  globeCounts,
  globeMarkers,
  globeSteps,
  markerFor,
  rankColor,
  regionBounds,
} from "@/lib/globe";
import type { AqiCategory, ExceedanceSummary, OverviewStation } from "@/api/types";

const categories: AqiCategory[] = [
  { id: "c0", label: "Best" },
  { id: "c1", label: "Middle" },
  { id: "c2", label: "Worst" },
];

function outlook(partial: Partial<ExceedanceSummary> = {}): ExceedanceSummary {
  return {
    station_id: "site:a",
    pollutant: "p1",
    timezone: "UTC",
    forecast_made_at: "2026-01-01T00:00:00Z",
    is_current: true,
    overall_recommendation: "go",
    days: [
      {
        date: "2026-01-02",
        exceedance_flag: false,
        exceedance_probability: 0.1,
        worst_case_value: 10,
        aqi_category: "c0",
      },
      {
        date: "2026-01-03",
        exceedance_flag: true,
        exceedance_probability: 0.9,
        worst_case_value: 300,
        aqi_category: "c2",
      },
    ],
    ...partial,
  };
}

function station(partial: Partial<OverviewStation> = {}): OverviewStation {
  return {
    station_id: "site:a",
    name: "Alpha Road",
    lat: 1,
    lon: 2,
    city: "Somewhere",
    region_id: "r1",
    current_aqi: {
      as_of: "2026-01-01T00:00:00Z",
      is_current: true,
      overall: { aqi: 250, category: "c1", driver: "p1" },
      at_or_above_health_threshold: false,
      pollutants: [],
    },
    outlooks: [outlook()],
    ...partial,
  };
}

const NOW = { kind: "now" } as const;
const day = (date: string) => ({ kind: "day", date }) as const;

describe("colour scale", () => {
  it("runs from the first ramp colour to the last and is never the no-data grey", () => {
    expect(rankColor(0, 3)).toEqual([46, 160, 92]);
    expect(rankColor(2, 3)).toEqual([124, 28, 46]);
    for (let rank = 0; rank < 6; rank++) {
      expect(rankColor(rank, 6)).not.toEqual(NO_DATA_COLOR);
    }
  });

  it("copes with a single category and out-of-range ranks", () => {
    expect(rankColor(0, 1)).toEqual([46, 160, 92]);
    expect(rankColor(99, 3)).toEqual(rankColor(2, 3));
    expect(rankColor(-1, 3)).toEqual(rankColor(0, 3));
  });
});

describe("marker for the current reading", () => {
  it("uses the server's overall category and index value", () => {
    const marker = markerFor(station(), categories, NOW, "p1");
    expect(marker.status).toBe("value");
    expect(marker.categoryId).toBe("c1");
    expect(marker.color).toEqual(rankColor(1, 3));
    expect(marker.magnitude).toBeCloseTo(0.5);
  });

  it("is no-data when the reading is stale or has no overall value", () => {
    const base = station();
    const stale = station({ current_aqi: { ...base.current_aqi, is_current: false } });
    const noOverall = station({ current_aqi: { ...base.current_aqi, overall: null } });
    for (const s of [stale, noOverall]) {
      const marker = markerFor(s, categories, NOW, "p1");
      expect(marker.status).toBe("no-data");
      expect(marker.color).toEqual(NO_DATA_COLOR);
      expect(marker.magnitude).toBe(0);
    }
  });

  it("never colours a category the region does not list", () => {
    const base = station();
    const unknown = station({
      current_aqi: { ...base.current_aqi, overall: { aqi: 10, category: "mystery", driver: "p1" } },
    });
    const marker = markerFor(unknown, categories, NOW, "p1");
    expect(marker.status).toBe("no-data");
    expect(marker.color).toEqual(NO_DATA_COLOR);
    expect(marker.categoryId).toBe("mystery");
  });
});

describe("marker for a forecast day", () => {
  it("uses that day's category from the chosen pollutant's outlook", () => {
    const marker = markerFor(station(), categories, day("2026-01-03"), "p1");
    expect(marker.status).toBe("value");
    expect(marker.categoryId).toBe("c2");
    expect(marker.color).toEqual(rankColor(2, 3));
  });

  it("is no-data for a missing day, a stale outlook or another pollutant", () => {
    const stale = station({ outlooks: [outlook({ is_current: false })] });
    expect(markerFor(station(), categories, day("2026-01-09"), "p1").status).toBe("no-data");
    expect(markerFor(stale, categories, day("2026-01-03"), "p1").status).toBe("no-data");
    expect(markerFor(station(), categories, day("2026-01-03"), "p2").status).toBe("no-data");
    expect(markerFor(station({ outlooks: [] }), categories, day("2026-01-03"), "p1").status).toBe(
      "no-data",
    );
  });
});

describe("slider steps", () => {
  it("offers now plus the days of current outlooks, in order and capped", () => {
    const other = station({
      station_id: "site:b",
      outlooks: [
        outlook({
          days: [{ ...outlook().days[0]!, date: "2026-01-01" }],
        }),
      ],
    });
    const stale = station({
      station_id: "site:c",
      outlooks: [
        outlook({ is_current: false, days: [{ ...outlook().days[0]!, date: "2025-12-25" }] }),
      ],
    });
    expect(globeSteps([station(), other, stale], "p1")).toEqual([
      NOW,
      day("2026-01-01"),
      day("2026-01-02"),
      day("2026-01-03"),
    ]);
    expect(globeSteps([station(), other], "p1", 2)).toHaveLength(3);
    expect(globeSteps([], "p1")).toEqual([NOW]);
  });
});

describe("counts and bounds", () => {
  it("counts stations with and without a value", () => {
    const markers = globeMarkers(
      [station(), station({ outlooks: [] })],
      categories,
      day("2026-01-02"),
      "p1",
    );
    expect(globeCounts(markers)).toEqual({ total: 2, withValue: 1, noData: 1 });
  });

  it("accepts only a well-formed bounding box", () => {
    expect(regionBounds([76, 28, 78, 29])).toEqual([76, 28, 78, 29]);
    expect(regionBounds([78, 28, 76, 29])).toBeNull();
    expect(regionBounds([76, 28, 78])).toBeNull();
    expect(regionBounds(null)).toBeNull();
  });
});
