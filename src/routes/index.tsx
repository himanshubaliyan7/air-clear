import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { regionsQuery, stationsQuery } from "@/api/queries";
import type { Region } from "@/api/types";
import { AppHeader } from "@/components/AppHeader";
import { RegionRow } from "@/components/dashboard/RegionRow";
import { Lines, stagger } from "@/components/instrument/primitives";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { strings } from "@/i18n/strings";
import { browserStorage, readRememberedStation, type RememberedStation } from "@/lib/dashboard";
import { headlineLines } from "@/lib/timeline";
import { control, dashboard, shell, typography } from "@/design/tokens";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: `${strings.app.name} — current readings and outlook` },
      {
        name: "description",
        content:
          "Check official air-quality readings and the multi-day outlook for monitoring stations, so schools can decide whether outdoor practice is safe.",
      },
      { property: "og:title", content: strings.app.name },
      {
        property: "og:description",
        content:
          "Official air-quality readings and a multi-day outlook for school outdoor practice decisions.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RegionGateway,
});

/**
 * The region is always in the URL. With exactly one region we skip the picker and go
 * straight to its overview; with two or more this is the front door: one ruled row per
 * region with its live figures. The region itself never leaves the data flow, so a
 * further region needs no code change here.
 */
function RegionGateway() {
  const navigate = useNavigate();
  const { data, isPending, error, refetch } = useQuery(regionsQuery());
  const onlyRegionId = data && data.length === 1 ? (data[0]?.id ?? null) : null;

  useEffect(() => {
    if (!onlyRegionId) return;
    void navigate({
      to: "/r/$regionId",
      params: { regionId: onlyRegionId },
      replace: true,
    });
  }, [onlyRegionId, navigate]);

  return (
    <div className={shell.page}>
      <AppHeader />
      <main className={shell.main}>
        {data && data.length > 1 ? (
          <RegionPicker regions={data} />
        ) : (
          <div className="mx-auto max-w-2xl">
            {isPending && <LoadingState />}
            {error && <ErrorState error={error} onRetry={() => void refetch()} />}
            {data && data.length === 0 && (
              <EmptyState title={strings.regions.noneTitle} body={strings.regions.noneBody} />
            )}
            {onlyRegionId && <LoadingState />}
          </div>
        )}
      </main>
    </div>
  );
}

function RegionPicker({ regions }: { regions: Region[] }) {
  return (
    <section className={dashboard.stack}>
      <header className="grid items-end gap-x-12 gap-y-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div>
          <p className={`rise-in ${typography.eyebrow}`}>
            {strings.regions.homeKicker(regions.length)}
          </p>
          <h1 className={`mt-3 ${typography.mega}`}>
            <Lines lines={headlineLines(strings.regions.homeHeadline)} />
          </h1>
        </div>
        <div className="rise-in space-y-4" style={stagger(3)}>
          <p className={typography.lead}>{strings.regions.homeLead}</p>
          <LastStation regions={regions} />
        </div>
      </header>

      <nav aria-label={strings.regions.switcherLabel}>
        <ul className={dashboard.regionList}>
          {regions.map((region, index) => (
            <RegionRow key={region.id} region={region} index={index} />
          ))}
        </ul>
      </nav>
    </section>
  );
}

/** The station this visitor opened last, read after mount: the server cannot know it. */
function LastStation({ regions }: { regions: Region[] }) {
  const [remembered, setRemembered] = useState<RememberedStation | null>(null);
  useEffect(() => setRemembered(readRememberedStation(browserStorage())), []);
  const regionId = regions.some((r) => r.id === remembered?.regionId) ? remembered?.regionId : undefined;
  const stations = useQuery({ ...stationsQuery(regionId), enabled: regionId !== undefined });
  const station = stations.data?.find((item) => item.station_id === remembered?.stationId);
  if (!regionId || !station) return null;
  return (
    <Link
      to="/r/$regionId/s/$stationId"
      params={{ regionId, stationId: station.station_id }}
      search={{}}
      className={control.button}
    >
      {strings.overview.lastViewed(station.name)}
      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
    </Link>
  );
}
