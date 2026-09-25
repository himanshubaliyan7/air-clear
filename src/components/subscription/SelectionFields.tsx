/**
 * Station and pollutant pickers shared by the subscribe and manage pages.
 * Stations and pollutants always come from the API; nothing is hardcoded.
 */
import { useQuery } from "@tanstack/react-query";
import { useId, useState } from "react";
import { stationsQuery } from "@/api/queries";
import type { Region } from "@/api/types";
import { ErrorState, LoadingState } from "@/components/states";
import { strings } from "@/i18n/strings";
import { control, surface, typography } from "@/design/tokens";
import { formatPollutantId } from "@/lib/pollutants";
import { filterStations, sortStations } from "@/lib/stations";
import { MAX_STATIONS_PER_SUBSCRIPTION, toggle, type SelectionErrors } from "@/lib/subscription";

const t = strings.subscriptions;

export function SelectionFields({
  regions,
  regionId,
  onRegionChange,
  stationIds,
  onStationIds,
  pollutants,
  onPollutants,
  errors,
}: {
  regions: readonly Region[];
  regionId: string;
  onRegionChange: (regionId: string) => void;
  stationIds: string[];
  onStationIds: (ids: string[]) => void;
  pollutants: string[];
  onPollutants: (ids: string[]) => void;
  errors: SelectionErrors;
}) {
  const [query, setQuery] = useState("");
  const ids = useId();
  const region = regions.find((r) => r.id === regionId) ?? null;
  const { data, isPending, error, refetch } = useQuery(stationsQuery(regionId));
  const visible = data ? sortStations(filterStations(data, query)) : [];

  const stationError =
    errors.stations === "none"
      ? t.errorNoStations
      : errors.stations === "too-many"
        ? t.errorTooManyStations(MAX_STATIONS_PER_SUBSCRIPTION)
        : null;

  return (
    <div className="space-y-4">
      {/* Hidden while the service covers a single region. */}
      {regions.length > 1 && (
        <label className="block">
          <span className={`${typography.body} mb-1 block`}>{t.regionLabel}</span>
          <select
            className={control.input}
            value={regionId}
            onChange={(event) => {
              onRegionChange(event.target.value);
              onStationIds([]); // station ids belong to one region
            }}
          >
            {regions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </label>
      )}

      <fieldset
        className="space-y-2"
        aria-describedby={`${ids}-stations-hint`}
        aria-invalid={stationError ? true : undefined}
      >
        <legend className={typography.sectionTitle}>{t.stationsLegend}</legend>
        <p id={`${ids}-stations-hint`} className={`${typography.small} ${surface.muted}`}>
          {t.stationsHint(MAX_STATIONS_PER_SUBSCRIPTION)}{" "}
          <span aria-live="polite">
            {t.selectedCount(stationIds.length, MAX_STATIONS_PER_SUBSCRIPTION)}
          </span>
        </p>
        {stationError && (
          <p role="alert" className={`${typography.small} text-destructive`}>
            {stationError}
          </p>
        )}
        <label className="block">
          <span className="sr-only">{t.stationsFilterLabel}</span>
          <input
            type="search"
            className={control.input}
            placeholder={t.stationsFilterLabel}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        {isPending && <LoadingState />}
        {error && <ErrorState error={error} onRetry={() => void refetch()} />}
        {data && (
          <ul className={`${surface.card} max-h-72 space-y-1 overflow-y-auto`}>
            {visible.map((s) => {
              const checked = stationIds.includes(s.station_id);
              const full = !checked && stationIds.length >= MAX_STATIONS_PER_SUBSCRIPTION;
              return (
                <li key={s.station_id}>
                  <label className={`flex items-start gap-2 ${typography.body}`}>
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={checked}
                      disabled={full}
                      onChange={() => onStationIds(toggle(stationIds, s.station_id))}
                    />
                    <span>
                      {s.name}
                      <span className={surface.muted}> · {s.city}</span>
                      {!s.has_current_forecast && (
                        <span className={`${typography.small} ${surface.muted}`}>
                          {" "}
                          ({t.noOutlookNow})
                        </span>
                      )}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </fieldset>

      <fieldset className="space-y-2" aria-invalid={errors.pollutants ? true : undefined}>
        <legend className={typography.sectionTitle}>{t.pollutantsLegend}</legend>
        {errors.pollutants && (
          <p role="alert" className={`${typography.small} text-destructive`}>
            {t.errorNoPollutants}
          </p>
        )}
        <div className="flex flex-wrap gap-4">
          {(region?.pollutants ?? []).map((p) => (
            <label key={p} className={`flex items-center gap-2 ${typography.body}`}>
              <input
                type="checkbox"
                checked={pollutants.includes(p)}
                onChange={() => onPollutants(toggle(pollutants, p))}
              />
              {formatPollutantId(p)}
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
