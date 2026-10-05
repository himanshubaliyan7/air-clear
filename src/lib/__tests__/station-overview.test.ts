import { describe, expect, it } from "vitest";
import type { CurrentAqi, ExceedanceSummary } from "@/api/types";
import {
  currentReadingState,
  currentThresholdMessage,
  describeDayVerdict,
  describeOutlook,
  isDailyMean,
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
    target: "hourly",
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
describe("outlook currentness", () => {
  it("treats a non-current outlook with a timestamp as stale", () => {
    const view = describeOutlook(outlook({ is_current: false }));
    expect(view.state).toBe("stale");
    expect(view.isCurrent).toBe(false);
  });

  it("treats a non-current outlook without a timestamp as never made", () => {
    const view = describeOutlook(
      outlook({ is_current: false, forecast_made_at: null }),
    );
    expect(view.state).toBe("never");
  });

  it("never reports a stale outlook as positive, even with a go recommendation", () => {
    const view = describeOutlook(
      outlook({ is_current: false, overall_recommendation: "go" }),
    );
    expect(view.isCurrent).toBe(false);
  });
});

describe("daily-mean day verdicts", () => {
  it("recognises only the daily-mean target", () => {
    expect(isDailyMean("daily_mean")).toBe(true);
    expect(isDailyMean("hourly")).toBe(false);
    expect(isDailyMean(undefined)).toBe(false);
  });

  it("passes the server's verdict for a day through unchanged", () => {
    const summary = { is_current: true, target: "daily_mean" };
    expect(describeDayVerdict(summary, { verdict: "go" })?.value).toBe("go");
    expect(describeDayVerdict(summary, { verdict: "caution" })?.value).toBe("caution");
    expect(describeDayVerdict(summary, { verdict: "no-go" })?.value).toBe("no-go");
  });

  it("gives a day no verdict when the outlook is not current", () => {
    const summary = { is_current: false, target: "daily_mean" };
    expect(describeDayVerdict(summary, { verdict: "go" })).toBeNull();
  });

  it("gives a day no verdict for the hourly target or when the server sent none", () => {
    expect(describeDayVerdict({ is_current: true, target: "hourly" }, { verdict: "go" })).toBeNull();
    expect(describeDayVerdict({ is_current: true, target: "daily_mean" }, { verdict: null })).toBeNull();
    expect(describeDayVerdict({ is_current: true, target: "daily_mean" }, {})).toBeNull();
  });

  it("never turns an unknown verdict into a clearance", () => {
    const view = describeDayVerdict({ is_current: true, target: "daily_mean" }, { verdict: "all-clear" });
    expect(view?.isPositive).toBe(false);
    expect(view?.isUnknown).toBe(true);
  });
});
