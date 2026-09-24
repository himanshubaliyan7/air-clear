import { describe, expect, it } from "vitest";
import type { ModelHealth } from "@/api/types";
import {
  filterModelHealth,
  filterOptions,
  formatMetric,
  METRIC_KEYS,
} from "../model-health";

const row = (over: Partial<ModelHealth>): ModelHealth => ({
  station_id: "p:1",
  pollutant: "pm25",
  horizon_hours: 24,
  precision: 0.5,
  recall: 0.4,
  f1: 0.45,
  mae: 3.2,
  rmse: 4.1,
  evaluation_window_end: "2026-09-20T00:00:00Z",
  ...over,
});

const rows = [
  row({}),
  row({ station_id: "p:2", pollutant: "no2", horizon_hours: 48 }),
  row({ station_id: "p:1", pollutant: "no2", horizon_hours: 24 }),
];

describe("model health", () => {
  it("renders each null metric as n/a on its own", () => {
    const r = row({ recall: null, rmse: null });
    const out = METRIC_KEYS.map((k) => formatMetric(r[k]));
    expect(out[1]).toBe("n/a");
    expect(out[4]).toBe("n/a");
    expect(out[0]).not.toBe("n/a");
    expect(out[2]).not.toBe("n/a");
    expect(out[3]).not.toBe("n/a");
  });

  it("formats zero as a number, not n/a", () => {
    expect(formatMetric(0)).not.toBe("n/a");
  });

  it("combines filters", () => {
    expect(filterModelHealth(rows, {})).toHaveLength(3);
    expect(filterModelHealth(rows, { station: "p:1" })).toHaveLength(2);
    expect(
      filterModelHealth(rows, { station: "p:1", pollutant: "no2" }),
    ).toHaveLength(1);
    expect(filterModelHealth(rows, { horizon: 48 })).toHaveLength(1);
    expect(filterModelHealth(rows, { station: "p:2", horizon: 24 })).toHaveLength(0);
  });

  it("gives distinct sorted options", () => {
    expect(filterOptions(rows)).toEqual({
      stations: ["p:1", "p:2"],
      pollutants: ["no2", "pm25"],
      horizons: [24, 48],
    });
  });

  it("adds no verdict or tone fields", () => {
    const out = filterModelHealth(rows, {})[0]!;
    expect(Object.keys(out).sort()).toEqual(Object.keys(rows[0]!).sort());
  });
});
