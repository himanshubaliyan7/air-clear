/**
 * Pure shaping for the operator model-health page. No judgement, no thresholds,
 * no tones: values are passed through and only formatted for reading.
 */
import type { ModelHealth } from "@/api/types";
import { strings } from "@/i18n/strings";
import { formatNumber } from "./format-time";

export interface ModelHealthFilter {
  station?: string | undefined;
  pollutant?: string | undefined;
  horizon?: number | undefined;
}

export function filterModelHealth(
  rows: readonly ModelHealth[],
  filter: ModelHealthFilter,
): ModelHealth[] {
  return rows.filter(
    (row) =>
      (filter.station === undefined || row.station_id === filter.station) &&
      (filter.pollutant === undefined || row.pollutant === filter.pollutant) &&
      (filter.horizon === undefined || row.horizon_hours === filter.horizon),
  );
}

export function filterOptions(rows: readonly ModelHealth[]) {
  const stations = [...new Set(rows.map((r) => r.station_id))].sort((a, b) =>
    a.localeCompare(b),
  );
  const pollutants = [...new Set(rows.map((r) => r.pollutant))].sort((a, b) =>
    a.localeCompare(b),
  );
  const horizons = [...new Set(rows.map((r) => r.horizon_hours))].sort(
    (a, b) => a - b,
  );
  return { stations, pollutants, horizons };
}

/** Each metric is independently nullable; null becomes "n/a" on its own. */
export function formatMetric(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return strings.modelHealth.notAvailable;
  }
  return formatNumber(value, { maximumFractionDigits: 3 });
}

export const METRIC_KEYS = ["precision", "recall", "f1", "mae", "rmse"] as const;
export type MetricKey = (typeof METRIC_KEYS)[number];

export const METRIC_LABELS: Record<MetricKey, string> = {
  precision: strings.modelHealth.colPrecision,
  recall: strings.modelHealth.colRecall,
  f1: strings.modelHealth.colF1,
  mae: strings.modelHealth.colMae,
  rmse: strings.modelHealth.colRmse,
};
