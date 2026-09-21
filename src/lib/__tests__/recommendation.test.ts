import { describe, expect, it } from "vitest";
import {
  describeRecommendation,
  parseRecommendation,
  RECOMMENDATIONS,
} from "../recommendation";

describe("recommendation mapping", () => {
  it("maps every known value to itself", () => {
    for (const value of RECOMMENDATIONS) {
      expect(parseRecommendation(value)).toBe(value);
    }
  });

  it("treats 'go' as the only positive state", () => {
    expect(describeRecommendation("go").isPositive).toBe(true);
    for (const value of ["caution", "no-go", "no-data"]) {
      expect(describeRecommendation(value).isPositive).toBe(false);
    }
  });

  it("never presents no-data as a go", () => {
    const view = describeRecommendation("no-data");
    expect(view.value).toBe("no-data");
    expect(view.isPositive).toBe(false);
    expect(view.isUnknown).toBe(true);
    expect(view.tone).toBe("unknown");
    expect(view.tone).not.toBe("positive");
    expect(view.label.toLowerCase()).not.toMatch(/\bgo\b/);
  });

  it("degrades unknown, missing and malformed values to no-data, never to go", () => {
    const unknownValues = [
      "GO",
      "Go",
      "go ",
      "safe",
      "all-clear",
      "maybe",
      "",
      " ",
      null,
      undefined,
    ];
    for (const value of unknownValues) {
      const view = describeRecommendation(value as string | null | undefined);
      expect(view.value).toBe("no-data");
      expect(view.isPositive).toBe(false);
      expect(view.isUnknown).toBe(true);
      expect(view.tone).not.toBe("positive");
    }
  });

  it("marks no-go as critical and caution as warning", () => {
    expect(describeRecommendation("no-go").tone).toBe("critical");
    expect(describeRecommendation("caution").tone).toBe("warning");
  });
});
