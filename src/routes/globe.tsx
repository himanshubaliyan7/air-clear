import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { overviewQuery, regionsQuery } from "@/api/queries";
import { GlobeMap } from "@/components/globe/GlobeMap";
import { StationPanel } from "@/components/globe/StationPanel";
import { ErrorState, LoadingState } from "@/components/states";
import { formatCalendarDate } from "@/lib/format-time";
import {
  NO_DATA_COLOR,
  globeCounts,
  globeMarkers,
  globeSteps,
  rankColor,
  regionBounds,
  swatchStyle,
  type GlobeStep,
} from "@/lib/globe";
import { formatPollutantId } from "@/lib/pollutants";
import { strings } from "@/i18n/strings";
import { globe, typography } from "@/design/tokens";

interface GlobeSearch {
  region?: string | undefined;
}

/** How long each step stays on screen while the timeline plays. */
const PLAY_STEP_MS = 1_800;

export const Route = createFileRoute("/globe")({
  validateSearch: (search: Record<string, unknown>): GlobeSearch => {
    const result: GlobeSearch = {};
    if (typeof search["region"] === "string" && search["region"] !== "") {
      result.region = search["region"];
    }
    return result;
  },
  head: () => ({
    meta: [
      { title: `${strings.globe.pageTitle} — ${strings.app.name}` },
      { name: "description", content: strings.globe.description },
      { property: "og:title", content: `${strings.globe.pageTitle} — ${strings.app.name}` },
      { property: "og:description", content: strings.globe.description },
    ],
  }),
  component: GlobePage,
});

function stepLabel(step: GlobeStep): string {
  if (step.kind === "now") return strings.globe.stepNow;
  return formatCalendarDate(step.date) ?? step.date;
}

function GlobePage() {
  const { region: regionParam } = Route.useSearch();
  const regions = useQuery(regionsQuery());
  const region =
    regions.data?.find((candidate) => candidate.id === regionParam) ?? regions.data?.[0] ?? null;
  const overview = useQuery({ ...overviewQuery(region?.id), enabled: region !== null });

  const [stepIndex, setStepIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);

  const categories = region?.aqi_categories ?? [];
  const pollutant = region?.pollutants?.[0] ?? "";
  const stations = overview.data?.stations;

  const steps = useMemo(() => globeSteps(stations ?? [], pollutant), [stations, pollutant]);
  const step = useMemo<GlobeStep>(
    () => steps[Math.min(stepIndex, steps.length - 1)] ?? { kind: "now" },
    [steps, stepIndex],
  );
  const markers = useMemo(
    () => globeMarkers(stations ?? [], region?.aqi_categories ?? [], step, pollutant),
    [stations, region, step, pollutant],
  );
  const counts = globeCounts(markers);
  const bounds = useMemo(() => regionBounds(region?.bbox), [region]);
  const selected = stations?.find((station) => station.station_id === selectedId) ?? null;

  useEffect(() => {
    if (!playing || steps.length < 2) return;
    const timer = window.setInterval(
      () => setStepIndex((index) => (index + 1) % steps.length),
      PLAY_STEP_MS,
    );
    return () => window.clearInterval(timer);
  }, [playing, steps.length]);

  const error = regions.error ?? overview.error;

  return (
    <main className={globe.page}>
      {region && (
        <GlobeMap
          markers={markers}
          selectedId={selectedId}
          onSelect={setSelectedId}
          bounds={bounds}
        />
      )}

      <header className={`${globe.header} ${globe.chrome}`}>
        <h1 className={typography.sectionTitle}>{strings.app.name}</h1>
        {region && <p className={`${typography.small} ${globe.muted}`}>{region.name}</p>}
        <div className="mt-1 flex gap-3">
          {region && (
            <Link to="/r/$regionId" params={{ regionId: region.id }} className={globe.textButton}>
              {strings.globe.listLink}
            </Link>
          )}
        </div>
        {(regions.isPending || (region && overview.isPending)) && <LoadingState />}
        {error && (
          <div className="mt-2 text-foreground">
            <ErrorState
              error={error}
              onRetry={() => void (regions.error ? regions.refetch() : overview.refetch())}
            />
          </div>
        )}
      </header>

      {region && stations && (
        <section
          className={`${globe.timeline} ${globe.chrome}`}
          aria-label={strings.globe.sliderLabel}
        >
          <div
            className="flex flex-wrap items-center gap-1"
            role="group"
            aria-label={strings.globe.sliderLabel}
          >
            {steps.length > 1 && (
              <button
                type="button"
                className={globe.stepButton}
                onClick={() => setPlaying((value) => !value)}
                aria-pressed={playing}
                aria-label={playing ? strings.globe.pause : strings.globe.play}
              >
                {playing ? "❚❚" : "▶"}
              </button>
            )}
            {steps.map((candidate, index) => {
              const active = candidate === step;
              return (
                <button
                  key={candidate.kind === "now" ? "now" : candidate.date}
                  type="button"
                  className={`${globe.stepButton} ${active ? globe.stepButtonActive : ""}`}
                  aria-pressed={active}
                  onClick={() => {
                    setPlaying(false);
                    setStepIndex(index);
                  }}
                >
                  {stepLabel(candidate)}
                </button>
              );
            })}
          </div>
          <p className={`${typography.small} mt-2`}>
            {step.kind === "now"
              ? strings.globe.showingNow
              : strings.globe.showingDay(stepLabel(step), formatPollutantId(pollutant))}{" "}
            <span className={globe.muted}>
              {strings.globe.counts(counts.withValue, counts.total)}
            </span>
          </p>
          <ul
            className="mt-2 flex flex-wrap gap-x-3 gap-y-1"
            aria-label={strings.globe.legendTitle}
          >
            {categories.map((category, rank) => (
              <li key={category.id} className={`flex items-center gap-1 ${typography.small}`}>
                <span
                  className={globe.swatch}
                  style={swatchStyle(rankColor(rank, categories.length))}
                  aria-hidden="true"
                />
                {category.label}
              </li>
            ))}
            <li
              className={`flex items-center gap-1 ${typography.small}`}
              title={strings.globe.legendNoDataNote}
            >
              <span
                className={globe.swatchHollow}
                style={{ borderColor: swatchStyle(NO_DATA_COLOR).backgroundColor }}
                aria-hidden="true"
              />
              {strings.globe.legendNoData}
            </li>
          </ul>
          {!selected && (
            <p className={`${typography.small} ${globe.muted} mt-2`}>
              {strings.globe.selectHint} {strings.globe.heightNote}
            </p>
          )}
        </section>
      )}

      {region && selected && (
        <StationPanel
          station={selected}
          region={region}
          pollutant={pollutant}
          step={step}
          onClose={() => setSelectedId(null)}
        />
      )}
    </main>
  );
}
