import { describe, expect, it } from "vitest";
import type { AqiCategory, HistoryPoint } from "@/api/types";
import { rankColor, rgbCss } from "@/lib/category-color";
import {
  axisMax,
  formatWeekdayShort,
  headlineLines,
  hourSlots,
  lanePercent,
  latestValue,
  particleCount,
  stripeColors,
  stripeGradient,
} from "@/lib/timeline";

const categories: AqiCategory[] = [
  { id: "c0", label: "Zero" },
  { id: "c1", label: "One" },
  { id: "c2", label: "Two" },
];

const point = (time: string, actual: number | null, aqi_category: string | null = null) =>
  ({ time, actual, forecast_value: null, aqi_category }) as HistoryPoint;

describe("hourSlots", () => {
  it("ends at the newest measured hour and leaves unmeasured hours empty", () => {
    const slots = hourSlots(
      [
        point("2026-10-06T08:00:00Z", 40, "c1"),
        point("2026-10-06T10:00:00Z", 95, "c2"),
        point("2026-10-06T11:00:00Z", null), // a forecast-only point is not a measurement
      ],
      4,
    );
    expect(slots.map((slot) => slot.value)).toEqual([null, 40, null, 95]);
    expect(slots.map((slot) => slot.category)).toEqual([null, "c1", null, "c2"]);
    expect(new Date(slots[3]!.time).toISOString()).toBe("2026-10-06T10:00:00.000Z");
    expect(latestValue(slots)).toBe(95);
  });

  it("is empty when nothing was measured, and keeps a missing category null", () => {
    expect(hourSlots([point("2026-10-06T08:00:00Z", null)])).toEqual([]);
    expect(latestValue([])).toBeNull();
    const slots = hourSlots([{ time: "2026-10-06T08:00:00Z", actual: 12, forecast_value: null }], 1);
    expect(slots[0]).toMatchObject({ value: 12, category: null });
  });
});

describe("stripes", () => {
  it("gives a colour only to a category the region lists", () => {
    expect(stripeColors(["c0", null, "mystery", "c2"], categories)).toEqual([
      rankColor(0, 3),
      null,
      null,
      rankColor(2, 3),
    ]);
  });

  it("merges equal neighbours and keeps gaps transparent", () => {
    const a = rankColor(0, 3);
    const b = rankColor(2, 3);
    expect(stripeGradient([a, [...a] as typeof a, null, b])).toBe(
      `linear-gradient(90deg, ${rgbCss(a)} 0% 50%, transparent 50% 75%, ${rgbCss(b)} 75% 100%)`,
    );
    expect(stripeGradient([null, null])).toBe("linear-gradient(90deg, transparent 0% 100%)");
    expect(stripeGradient([])).toBeNull();
  });
});

describe("axes", () => {
  it("rounds an axis up and never returns zero", () => {
    expect(axisMax([62, 118, null])).toBeGreaterThanOrEqual(118);
    expect(axisMax([62, 118, null]) % 10).toBe(0);
    expect(axisMax([])).toBe(1);
    expect(axisMax([null, undefined, 0])).toBe(1);
  });

  it("places a value on a lane within 0 to 100", () => {
    expect(lanePercent(50, 200)).toBe(25);
    expect(lanePercent(500, 200)).toBe(100);
    expect(lanePercent(-5, 200)).toBe(0);
    expect(lanePercent(null, 200)).toBe(0);
    expect(lanePercent(50, 0)).toBe(0);
  });
});

describe("particleCount", () => {
  it("draws nothing without a concentration and more for dirtier air", () => {
    expect(particleCount(null, 800, 400)).toBe(0);
    expect(particleCount(0, 800, 400)).toBe(0);
    expect(particleCount(60, 0, 400)).toBe(0);
    expect(particleCount(120, 800, 400)).toBeGreaterThan(particleCount(30, 800, 400));
    expect(particleCount(100_000, 4000, 4000)).toBeLessThanOrEqual(900 * ((4000 * 4000) / 420_000));
  });
});

describe("labels", () => {
  it("prints a calendar day's weekday without shifting it by a zone", () => {
    expect(formatWeekdayShort("2026-10-07")).toBe("Wed");
    expect(formatWeekdayShort(null)).toBeNull();
    expect(formatWeekdayShort("nonsense")).toBeNull();
  });

  it("breaks a headline before its last word", () => {
    expect(headlineLines("Anand Vihar, New Delhi")).toEqual(["Anand Vihar, New", "Delhi"]);
    expect(headlineLines("Loni")).toEqual(["Loni"]);
    expect(headlineLines("  ")).toEqual([]);
  });
});
