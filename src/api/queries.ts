/**
 * Cache policy, in one place.
 *
 * Upstream data changes at most hourly, so reference data (regions, stations) is
 * cached for five minutes and per-station data is only ever fetched for the station
 * the user is looking at. Nothing polls faster than five minutes; refetch on window
 * focus is allowed because it is bounded by staleTime.
 */
import { queryOptions } from "@tanstack/react-query";
import * as api from "./endpoints";

export const FIVE_MINUTES = 5 * 60 * 1000;
const THIRTY_MINUTES = 30 * 60 * 1000;

const shared = {
  staleTime: FIVE_MINUTES,
  gcTime: THIRTY_MINUTES,
  refetchOnWindowFocus: true,
  refetchInterval: FIVE_MINUTES,
  retry: 1,
} as const;

export const regionsQuery = () =>
  queryOptions({
    queryKey: ["regions"] as const,
    queryFn: ({ signal }) => api.listRegions(signal),
    ...shared,
    refetchInterval: false as const,
  });

export const regionQuery = (regionId: string) =>
  queryOptions({
    queryKey: ["region", regionId] as const,
    queryFn: ({ signal }) => api.getRegion(regionId, signal),
    ...shared,
    refetchInterval: false as const,
  });

export const stationsQuery = (regionId?: string) =>
  queryOptions({
    queryKey: ["stations", regionId ?? null] as const,
    queryFn: ({ signal }) => api.listStations(regionId, signal),
    ...shared,
    refetchInterval: false as const,
  });

export const stationQuery = (stationId: string) =>
  queryOptions({
    queryKey: ["station", stationId] as const,
    queryFn: ({ signal }) => api.getStation(stationId, signal),
    ...shared,
  });

export const currentAqiQuery = (stationId: string) =>
  queryOptions({
    queryKey: ["current-aqi", stationId] as const,
    queryFn: ({ signal }) => api.getCurrentAqi(stationId, signal),
    ...shared,
  });

export const exceedanceQuery = (
  stationId: string,
  params: { pollutant?: string; days_ahead?: number } = {},
) =>
  queryOptions({
    queryKey: ["exceedance", stationId, params] as const,
    queryFn: ({ signal }) => api.getExceedance(stationId, params, signal),
    ...shared,
  });

export const forecastQuery = (
  stationId: string,
  params: { pollutant?: string; horizon_days?: number } = {},
) =>
  queryOptions({
    queryKey: ["forecast", stationId, params] as const,
    queryFn: ({ signal }) => api.getForecast(stationId, params, signal),
    ...shared,
  });

export const forecastHistoryQuery = (
  stationId: string,
  params: { pollutant?: string; lookback_days?: number } = {},
) =>
  queryOptions({
    queryKey: ["forecast-history", stationId, params] as const,
    queryFn: ({ signal }) => api.getForecastHistory(stationId, params, signal),
    ...shared,
  });

export const modelHealthQuery = (
  params: { station_id?: string; pollutant?: string } = {},
) =>
  queryOptions({
    queryKey: ["model-health", params] as const,
    queryFn: ({ signal }) => api.listModelHealth(params, signal),
    ...shared,
  });

export const attributionsQuery = () =>
  queryOptions({
    queryKey: ["attributions"] as const,
    queryFn: ({ signal }) => api.listAttributions(signal),
    ...shared,
    refetchInterval: false as const,
  });
