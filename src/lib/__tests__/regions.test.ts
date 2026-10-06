import { describe, expect, it } from "vitest";
import type { Overview, OverviewStation, Region } from "@/api/types";
import { percentRange, regionAccuracy, regionGlance } from "@/lib/regions";

const categories = [
  { id: "c0", label: "Best" },
  { id: "c1", label: "Worst" },
];

function region(id: string, extra: Partial<Region> = {}): Region {
  return {
    id,
    name: `Region ${id}`,
    country: "Country",
    timezone: "UTC",
    bbox: [0, 0, 1, 1],
    aqi_standard: `Standard ${id}`,
    pollutants: ["p1"],
    pollutant_details: [],
    aqi_categories: categories,
    health_threshold_category: "c1",
    ...extra,
  } as Region;
}

function station(id: string, category: string, above: boolean, isCurrent = true): OverviewStation {
  return {
    station_id: id,
    name: id,
    lat: 0,
    lon: 0,
    city: "Somewhere",
    region_id: "x",
    current_aqi: {
      as_of: "2026-01-01T00:00:00Z",
      is_current: isCurrent,
      overall: { aqi: 100, category, driver: "p1" },
      at_or_above_health_threshold: above,
      pollutants: [],
    },
    outlooks: [],
  };
}

const overview = (stations: OverviewStation[]) => ({ stations }) as Overview;

describe("region glance for the home page", () => {
  it("is loading before the overview arrives and unavailable when it failed", () => {
    expect(regionGlance(region("a"), undefined).state).toBe("loading");
    expect(regionGlance(region("a"), null).state).toBe("unavailable");
  });

  it("counts a region's own stations against its own categories", () => {
    const glance = regionGlance(
      region("a"),
      overview([station("s1", "c0", false), station("s2", "c1", true), station("s3", "c1", true, false)]),
    );
    expect(glance).toMatchObject({
      state: "ready",
      name: "Region a",
      aqiStandard: "Standard a",
      total: 3,
      reporting: 2,
      atOrAboveThreshold: 1,
    });
    expect(glance.distribution?.categories.map((c) => c.count)).toEqual([1, 1]);
    expect(glance.distribution?.noData).toBe(1);
  });

  it("is empty, not zero-of-zero, for a region without stations", () => {
    const glance = regionGlance(region("b"), overview([]));
    expect(glance).toMatchObject({ state: "empty", total: 0, distribution: null });
  });

  it("shapes two regions independently", () => {
    const a = regionGlance(region("a"), overview([station("s1", "c0", false)]));
    const b = regionGlance(region("b"), overview([]));
    expect([a.state, b.state]).toEqual(["ready", "empty"]);
    expect([a.regionId, b.regionId]).toEqual(["a", "b"]);
  });
});

describe("region accuracy", () => {
  const backtest = {
    period: "2025-10 to 2026-01",
    exact_grade_tomorrow: 0.614,
    exact_grade_day_5: 0.52,
    no_go_called_go_low: 0.02,
    no_go_called_go_high: 0.05,
  };

  it("reads a backtest as three figures with its period", () => {
    expect(regionAccuracy(backtest)).toEqual({
      period: "2025-10 to 2026-01",
      figures: [
        { key: "tomorrow", value: "≈ 61%" },
        { key: "dayFive", value: "≈ 52%" },
        { key: "badDays", value: "2–5%" },
      ],
    });
  });

  it("has nothing to show without a backtest or with unusable figures", () => {
    expect(regionAccuracy(null)).toBeNull();
    expect(regionAccuracy(undefined)).toBeNull();
    expect(regionAccuracy({ ...backtest, exact_grade_tomorrow: 61 })).toBeNull();
    expect(regionAccuracy({ ...backtest, no_go_called_go_high: Number.NaN })).toBeNull();
  });

  it("writes one number when both ends round alike", () => {
    expect(percentRange(0.049, 0.051)).toBe("5%");
    expect(percentRange(0.16, 0.07)).toBe("7–16%");
  });
});
