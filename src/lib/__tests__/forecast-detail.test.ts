import { describe, expect, it } from "vitest";
import {
  bandSegments,
  clampLookback,
  pollutantDetail,
  responseZone,
  segments,
  valueExtent,
} from "../forecast-detail";
import { formatTickInZone } from "../format-time";

const region = {
  pollutant_details: [
    { id: "pm25", unit: "µg/m³", health_threshold_concentration: 60, threshold_averaging: "24h" },
    { id: "no2", unit: "ppb", health_threshold_concentration: null, threshold_averaging: null },
  ],
};

describe("forecast detail helpers", () => {
  it("keeps nulls as gaps, never zeros", () => {
    const runs = segments([
      { x: 1, y: 5 },
      { x: 2, y: null },
      { x: 3, y: 7 },
      { x: 4, y: 8 },
    ]);
    expect(runs).toEqual([[{ x: 1, y: 5 }], [{ x: 3, y: 7 }, { x: 4, y: 8 }]]);
    expect(runs.flat().some((p) => p.y === 0)).toBe(false);
  });

  it("draws the band only where both bounds exist", () => {
    const runs = bandSegments([
      { x: 1, low: 1, high: 3 },
      { x: 2, low: null, high: 4 },
      { x: 3, low: 2, high: 5 },
    ]);
    expect(runs).toHaveLength(2);
  });

  it("has no threshold when the API returns null, and reads the unit from the region", () => {
    expect(pollutantDetail(region as never, "no2")).toEqual({
      unit: "ppb",
      thresholdConcentration: null,
      thresholdAveraging: null,
    });
    expect(pollutantDetail(region as never, "pm25").thresholdConcentration).toBe(60);
    expect(pollutantDetail(region as never, "o3").unit).toBeNull();
  });

  it("clamps lookback to 1–90", () => {
    expect(clampLookback(0)).toBe(1);
    expect(clampLookback(500)).toBe(90);
    expect(clampLookback("abc")).toBe(14);
    expect(clampLookback("30")).toBe(30);
  });

  it("ignores null values in the extent", () => {
    expect(valueExtent([null, 3, undefined, 9])).toEqual([3, 9]);
    expect(valueExtent([null, null])).toBeNull();
  });

  it("uses the response's own zone before the region's", () => {
    expect(responseZone("Asia/Kolkata", "America/Los_Angeles")).toBe("Asia/Kolkata");
    expect(responseZone(null, "America/Los_Angeles")).toBe("America/Los_Angeles");
    const ms = Date.parse("2026-09-21T23:00:00Z");
    expect(formatTickInZone(ms, "Asia/Kolkata")).toContain("22");
  });
});
