/**
 * The region is part of app state from day one: it supplies the time zone, the
 * ordered AQI categories and labels, the health-threshold category, the AQI standard
 * name and the pollutant list to every screen. With a single region the picker is
 * hidden, but the region never leaves the data flow.
 */
import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { AqiCategory, Region } from "@/api/types";
import {
  describeCategory,
  healthThresholdRank,
  type CategoryView,
} from "@/lib/aqi-categories";
import {
  formatAsOf,
  formatCalendarDate,
  formatDateTimeInZone,
} from "@/lib/format-time";

export interface RegionContextValue {
  region: Region;
  /** All regions the service covers; drives whether the switcher is shown. */
  allRegions: Region[];
  timeZone: string;
  categories: AqiCategory[];
  pollutants: string[];
  aqiStandard: string;
  healthThresholdCategoryId: string;
  healthThresholdRank: number | null;
  describeCategory: (id: string | null | undefined) => CategoryView | null;
  formatAsOf: (iso: string | null | undefined) => string;
  formatDateTime: (iso: string | null | undefined) => string | null;
  formatDay: (day: string | null | undefined) => string | null;
}

const RegionContext = createContext<RegionContextValue | null>(null);

export function RegionProvider({
  region,
  allRegions,
  children,
}: {
  region: Region;
  allRegions: Region[];
  children: ReactNode;
}) {
  const value = useMemo<RegionContextValue>(() => {
    const timeZone = region.timezone;
    const categories = region.aqi_categories ?? [];
    return {
      region,
      allRegions,
      timeZone,
      categories,
      pollutants: region.pollutants ?? [],
      aqiStandard: region.aqi_standard,
      healthThresholdCategoryId: region.health_threshold_category,
      healthThresholdRank: healthThresholdRank(region),
      describeCategory: (id) => describeCategory(id, categories),
      formatAsOf: (iso) => formatAsOf(iso, timeZone),
      formatDateTime: (iso) => formatDateTimeInZone(iso, timeZone),
      formatDay: (day) => formatCalendarDate(day, timeZone),
    };
  }, [region, allRegions]);

  return (
    <RegionContext.Provider value={value}>{children}</RegionContext.Provider>
  );
}

export function useRegion(): RegionContextValue {
  const value = useContext(RegionContext);
  if (!value) {
    throw new Error("useRegion must be used inside a RegionProvider.");
  }
  return value;
}
