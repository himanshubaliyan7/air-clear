import { describe, expect, it } from "vitest";
import type { AqiCategory, ExceedanceSummary, OverviewStation } from "@/api/types";
import { NO_DATA_COLOR, badgeStyle, rankColor, readableTextOn, rgbaCss } from "@/lib/category-color";
import {
  NO_DATA_FILTER,
  categoryDistribution,
  filterSummaries,
  outlookFor,
  overviewCounts,
  parseSortMode,
  rankByIndex,
  recommendationDistribution,
  sharePercent,
  sortSummaries,
  stationSummary,
} from "@/lib/overview";
import {
  THEME_INIT_SCRIPT,
  THEME_STORAGE_KEY,
  applyTheme,
  currentTheme,
  nextTheme,
  parseTheme,
  readStoredTheme,
  resolveTheme,
  storeTheme,
} from "@/lib/theme";

const categories: AqiCategory[] = [
  { id: "c0", label: "Best" },
  { id: "c1", label: "Middle" },
  { id: "c2", label: "Worst" },
];

function outlook(partial: Partial<ExceedanceSummary> = {}): ExceedanceSummary {
  return {
    station_id: "s",
    pollutant: "p1",
    timezone: "UTC",
    forecast_made_at: "2026-01-01T00:00:00Z",
    is_current: true,
    target: "daily_mean",
    days: [],
    overall_recommendation: "go",
    ...partial,
  } as ExceedanceSummary;
}

function station(
  id: string,
  options: {
    aqi?: number;
    category?: string;
    isCurrent?: boolean;
    above?: boolean | null;
    outlooks?: ExceedanceSummary[];
    city?: string;
  } = {},
): OverviewStation {
  return {
    station_id: id,
    name: id,
    lat: 0,
    lon: 0,
    city: options.city ?? "Somewhere",
    region_id: "r1",
    current_aqi: {
      as_of: "2026-01-01T00:00:00Z",
      is_current: options.isCurrent ?? true,
      overall: { aqi: options.aqi ?? 100, category: options.category ?? "c1", driver: "p1" },
      at_or_above_health_threshold: "above" in options ? options.above : false,
      pollutants: [],
    },
    outlooks: options.outlooks ?? [outlook()],
  };
}

const summarise = (stations: OverviewStation[]) =>
  stations.map((item) => stationSummary(item, categories, "p1"));

describe("station summary", () => {
  it("takes the verdict of the chosen pollutant's outlook", () => {
    const item = station("a", {
      outlooks: [
        outlook({ pollutant: "p1", overall_recommendation: "caution" }),
        outlook({ pollutant: "p2", overall_recommendation: "go" }),
      ],
    });
    expect(outlookFor(item, "p2")?.overall_recommendation).toBe("go");
    expect(outlookFor(item, "p9")).toBeNull();
    expect(outlookFor(item, undefined)).toBeNull();
    expect(stationSummary(item, categories, "p1").recommendation.value).toBe("caution");
  });

  it("never reads an old, missing or unknown outlook as a clearance", () => {
    const cases = [
      station("stale", { outlooks: [outlook({ is_current: false, overall_recommendation: "go" })] }),
      station("none", { outlooks: [] }),
      station("other", { outlooks: [outlook({ pollutant: "p2" })] }),
      station("odd", { outlooks: [outlook({ overall_recommendation: "splendid" })] }),
    ];
    for (const summary of summarise(cases)) {
      expect(summary.recommendation.value).toBe("no-data");
      expect(summary.recommendation.isPositive).toBe(false);
    }
    expect(summarise(cases).map((s) => s.hasCurrentOutlook)).toEqual([false, false, false, true]);
  });

  it("keeps the server's threshold flag only for a current reading", () => {
    expect(summarise([station("a", { above: true })])[0]!.atOrAboveThreshold).toBe(true);
    expect(summarise([station("a", { above: null })])[0]!.atOrAboveThreshold).toBeNull();
    expect(
      summarise([station("a", { above: true, isCurrent: false })])[0]!.atOrAboveThreshold,
    ).toBeNull();
  });
});

describe("overview counts", () => {
  const summaries = summarise([
    station("a", { category: "c0", aqi: 20 }),
    station("b", { category: "c2", aqi: 400, above: true }),
    station("c", { category: "c2", aqi: 300, above: true, outlooks: [] }),
    station("d", { isCurrent: false, above: true }),
    station("e", { category: "mystery" }),
  ]);

  it("counts stations per listed category and keeps the rest as no data", () => {
    const distribution = categoryDistribution(summaries, categories);
    expect(distribution.categories.map((c) => [c.id, c.count])).toEqual([
      ["c0", 1],
      ["c1", 0],
      ["c2", 2],
    ]);
    expect(distribution.categories[2]!.color).toEqual(rankColor(2, 3));
    expect(distribution.noData).toBe(2);
    expect(distribution.total).toBe(5);
  });

  it("counts verdicts in a fixed order, with no-data for a station without an outlook", () => {
    const counts = recommendationDistribution(summaries);
    expect(counts.map((c) => [c.view.value, c.count])).toEqual([
      ["go", 4],
      ["caution", 0],
      ["no-go", 0],
      ["no-data", 1],
    ]);
  });

  it("totals readings, outlooks and the server's threshold flag", () => {
    expect(overviewCounts(summaries)).toEqual({
      total: 5,
      withReading: 3,
      withOutlook: 4,
      atOrAboveThreshold: 2,
    });
  });

  it("gives a zero share when there is nothing to divide", () => {
    expect(sharePercent(1, 4)).toBe(25);
    expect(sharePercent(0, 0)).toBe(0);
  });
});

describe("ranking, filtering and ordering", () => {
  const summaries = summarise([
    station("mid", { aqi: 150, category: "c1", city: "Northtown" }),
    station("low", { aqi: 30, category: "c0" }),
    station("high", { aqi: 420, category: "c2" }),
    station("silent", { isCurrent: false }),
  ]);
  const ids = (list: { stationId: string }[]) => list.map((s) => s.stationId);

  it("ranks only stations with a value", () => {
    expect(ids(rankByIndex(summaries, "highest"))).toEqual(["high", "mid", "low"]);
    expect(ids(rankByIndex(summaries, "lowest", 2))).toEqual(["low", "mid"]);
  });

  it("puts a station without a value last, never first among the lowest", () => {
    expect(ids(sortSummaries(summaries, "lowest"))).toEqual(["low", "mid", "high", "silent"]);
    expect(ids(sortSummaries(summaries, "highest"))).toEqual(["high", "mid", "low", "silent"]);
    expect(ids(sortSummaries(summaries, "name"))).toEqual(["high", "low", "mid", "silent"]);
  });

  it("filters by category, by no data, and by name or city", () => {
    expect(ids(filterSummaries(summaries, { category: "c2" }))).toEqual(["high"]);
    expect(ids(filterSummaries(summaries, { category: NO_DATA_FILTER }))).toEqual(["silent"]);
    expect(ids(filterSummaries(summaries, { query: " NORTH " }))).toEqual(["mid"]);
    expect(ids(filterSummaries(summaries, { query: "i", category: "c1" }))).toEqual(["mid"]);
    expect(filterSummaries(summaries, {})).toHaveLength(4);
  });

  it("falls back to the default order for an unknown sort value", () => {
    expect(parseSortMode("name")).toBe("name");
    expect(parseSortMode("sideways")).toBe("highest");
    expect(parseSortMode(undefined)).toBe("highest");
  });
});

describe("badge colours", () => {
  it("picks dark text on light colours and white on dark ones", () => {
    expect(readableTextOn([240, 200, 50])).toBe("#111827");
    expect(readableTextOn([124, 28, 46])).toBe("#ffffff");
    expect(badgeStyle([124, 28, 46])).toEqual({
      backgroundColor: "rgb(124 28 46)",
      color: "#ffffff",
    });
    expect(rgbaCss(NO_DATA_COLOR, 0.5)).toBe("rgb(128 134 146 / 0.5)");
  });
});

describe("theme", () => {
  function memoryStorage(initial: Record<string, string> = {}) {
    const data = new Map(Object.entries(initial));
    return {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => void data.set(key, value),
    };
  }

  function fakeRoot() {
    const classes = new Set<string>();
    return {
      classList: {
        toggle: (name: string, on?: boolean) => {
          if (on) classes.add(name);
          else classes.delete(name);
          return Boolean(on);
        },
        contains: (name: string) => classes.has(name),
      } as unknown as DOMTokenList,
    };
  }

  it("uses the stored choice, otherwise the system setting", () => {
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("dark", false)).toBe("dark");
    expect(resolveTheme(null, true)).toBe("dark");
    expect(resolveTheme("purple", false)).toBe("light");
    expect(parseTheme("purple")).toBeNull();
    expect(nextTheme("dark")).toBe("light");
    expect(nextTheme("light")).toBe("dark");
  });

  it("remembers the choice and survives blocked storage", () => {
    const storage = memoryStorage();
    expect(readStoredTheme(storage)).toBeNull();
    storeTheme(storage, "dark");
    expect(readStoredTheme(storage)).toBe("dark");
    const blocked = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    };
    expect(readStoredTheme(blocked)).toBeNull();
    expect(() => storeTheme(blocked, "dark")).not.toThrow();
    expect(readStoredTheme(null)).toBeNull();
  });

  it("sets and reads the class on the root element", () => {
    const root = fakeRoot();
    expect(currentTheme(root)).toBe("light");
    applyTheme(root, "dark");
    expect(currentTheme(root)).toBe("dark");
    applyTheme(root, "light");
    expect(currentTheme(root)).toBe("light");
  });

  it("ships a first-paint script that reads the same storage key", () => {
    expect(THEME_INIT_SCRIPT).toContain(JSON.stringify(THEME_STORAGE_KEY));
    expect(THEME_INIT_SCRIPT).toContain("prefers-color-scheme: dark");
  });
});
