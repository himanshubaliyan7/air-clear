import { describe, expect, it } from "vitest";
import type { AqiCategory } from "@/api/types";
import {
  describeCategory,
  healthThresholdRank,
  humaniseCategoryId,
} from "../aqi-categories";

// A stand-in for whatever a region returns. The app never assumes this shape,
// this count, or these names.
const categories: AqiCategory[] = [
  { id: "cat_a", label: "Best" },
  { id: "cat_b", label: "Middle" },
  { id: "cat_c", label: "Worst" },
];

describe("AQI categories", () => {
  it("uses the region's label and best-to-worst position", () => {
    expect(describeCategory("cat_a", categories)).toEqual({
      id: "cat_a",
      label: "Best",
      rank: 0,
      isUnknown: false,
    });
    expect(describeCategory("cat_c", categories)?.rank).toBe(2);
  });

  it("falls back to a readable version of an unrecognised id instead of failing", () => {
    const view = describeCategory("severe_plus", categories);
    expect(view).not.toBeNull();
    expect(view?.isUnknown).toBe(true);
    expect(view?.rank).toBeNull();
    expect(view?.label).toBe("Severe plus");
  });

  it("returns null for a missing category rather than inventing one", () => {
    expect(describeCategory(null, categories)).toBeNull();
    expect(describeCategory(undefined, categories)).toBeNull();
  });

  it("humanises ids of any shape", () => {
    expect(humaniseCategoryId("very-poor")).toBe("Very poor");
    expect(humaniseCategoryId("MODERATE")).toBe("Moderate");
    expect(humaniseCategoryId("x")).toBe("X");
  });

  it("locates the region's health-threshold category, or reports none", () => {
    const base = {
      id: "r",
      name: "R",
      country: "C",
      timezone: "Asia/Kolkata",
      bbox: [0, 0, 1, 1],
      aqi_standard: "S",
      pollutants: ["pm25"],
      aqi_categories: categories,
    };
    expect(
      healthThresholdRank({ ...base, health_threshold_category: "cat_b" }),
    ).toBe(1);
    expect(
      healthThresholdRank({ ...base, health_threshold_category: "nope" }),
    ).toBeNull();
  });
});
