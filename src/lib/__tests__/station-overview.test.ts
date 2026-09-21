import { describe, expect, it } from "vitest";
import type { CurrentAqi, ExceedanceSummary } from "@/api/types";
import {
  currentReadingState,
  currentThresholdMessage,
  describeOutlook,
} from "@/lib/station-overview";

function current(partial: Partial<CurrentAqi> = {}): CurrentAqi {
  return {
    station_id: "site:one",
    as_of: "2026-09-21T12:00:00Z",
    is_current: true,
    aqi_standard: "standard-from-api",
    timezone: "Asia/Kolkata",
    overall: { aqi: 87, category: "moderate", driver: "pm25" },
    at_or_above_health_threshold: false,
    pollutants: [],
    attribution: "Exact source text",
    ...partial,
  };
}

function outlook(partial: Partial<ExceedanceSummary> = {}): ExceedanceSummary {
  return {
    station_id: "site:one",
    pollutant: "pm25",
    timezone: "Asia/Kolkata",
    days: [],
    forecast_made_at: "2026-09-21T06:00:00Z",
    is_current: true,
    overall_recommendation: "no-data",
    ...partial,
  };
}

describe("current-reading presentation", () => {
  it("treats a non-current response with a timestamp as stale", () => {
    expect(currentReadingState(current({ is_current: false }))).toBe("stale");
  });

  it("treats a non-current response without a timestamp as never reported", () => {
    expect(currentReadingState(current({ is_current: false, as_of: null }))).toBe(
      "never",
    );
  });

  it("allows a current response with no overall value", () => {
    expect(currentReadingState(current({ overall: null }))).toBe("current");
  });

  it("uses no go/no-go wording for current threshold messages", () => {
    for (const value of [true, false, null, undefined]) {
      expect(currentThresholdMessage(value)).not.toMatch(/\b(?:go|no-go)\b/i);
    }
  });
});

describe("outlook presentation", () => {
  it("keeps an empty outlook neutral", () => {
    const view = describeOutlook(outlook());
    expect(view.hasDays).toBe(false);
    expect(view.recommendation.isPositive).toBe(false);
  });

  it("keeps partial no-data days neutral", () => {
    const view = describeOutlook(
      outlook({
        days: [
          {
            date: "2026-09-22",
            exceedance_flag: false,
            exceedance_probability: 0.2,
            worst_case_value: 80,
            aqi_category: "moderate",
          },
        ],
      }),
    );
    expect(view.isPartialOrUnavailable).toBe(true);
    expect(view.recommendation.isPositive).toBe(false);
  });

  it("degrades an unknown recommendation to no-data", () => {
    const view = describeOutlook(outlook({ overall_recommendation: "all-clear" }));
    expect(view.recommendation.value).toBe("no-data");
    expect(view.recommendation.isPositive).toBe(false);
  });
});