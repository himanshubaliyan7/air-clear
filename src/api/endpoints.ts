/**
 * One typed function per endpoint in docs/openapi.json.
 * Nothing outside this folder calls fetch.
 */
import { apiGet, encodePathSegment, request } from "./client";

import type {
  Attribution,
  CurrentAqi,
  ExceedanceSummary,
  ForecastSeries,
  History,
  ModelHealth,
  Region,
  Station,
  StationDetail,
} from "./types";

export function listRegions(signal?: AbortSignal) {
  return apiGet<Region[]>("/regions", { signal });
}

export function getRegion(regionId: string, signal?: AbortSignal) {
  return apiGet<Region>(`/regions/${encodePathSegment(regionId)}`, { signal });
}

export function listStations(regionId?: string, signal?: AbortSignal) {
  return apiGet<Station[]>("/stations", {
    query: { region_id: regionId },
    signal,
  });
}

export function getStation(stationId: string, signal?: AbortSignal) {
  return apiGet<StationDetail>(`/stations/${encodePathSegment(stationId)}`, {
    signal,
  });
}

export function getCurrentAqi(stationId: string, signal?: AbortSignal) {
  return apiGet<CurrentAqi>(
    `/stations/${encodePathSegment(stationId)}/current-aqi`,
    { signal },
  );
}

export function getExceedance(
  stationId: string,
  params: { pollutant?: string; days_ahead?: number } = {},
  signal?: AbortSignal,
) {
  return apiGet<ExceedanceSummary>(
    `/forecast/${encodePathSegment(stationId)}/exceedance`,
    { query: params, signal },
  );
}

export function getForecast(
  stationId: string,
  params: { pollutant?: string; horizon_days?: number } = {},
  signal?: AbortSignal,
) {
  return apiGet<ForecastSeries>(`/forecast/${encodePathSegment(stationId)}`, {
    query: params,
    signal,
  });
}

export function getForecastHistory(
  stationId: string,
  params: { pollutant?: string; lookback_days?: number } = {},
  signal?: AbortSignal,
) {
  return apiGet<History>(
    `/forecast/${encodePathSegment(stationId)}/history`,
    { query: params, signal },
  );
}

export function listModelHealth(
  params: { station_id?: string; pollutant?: string } = {},
  signal?: AbortSignal,
) {
  return apiGet<ModelHealth[]>("/model-health", { query: params, signal });
}

export function getServiceHealth(signal?: AbortSignal) {
  return apiGet<unknown>("/health", { signal });
}

export function listAttributions(signal?: AbortSignal) {
  return apiGet<Attribution[]>("/attributions", { signal });
}

export { request };
