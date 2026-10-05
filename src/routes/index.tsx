import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { regionsQuery } from "@/api/queries";
import { AppHeader } from "@/components/AppHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { strings } from "@/i18n/strings";
import { control, shell, surface, typography } from "@/design/tokens";
import { browserStorage, readRememberedStation } from "@/lib/dashboard";

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
 * The region is always in the URL. A visitor who has opened a station before goes
 * straight back to it. Otherwise, with exactly one region we skip the picker and go
 * straight in; the region itself never leaves the data flow, so a second region needs
 * no code change here.
 */
function RegionGateway() {
  const navigate = useNavigate();
  const { data, isPending, error, refetch } = useQuery(regionsQuery());
  const onlyRegionId = data && data.length === 1 ? (data[0]?.id ?? null) : null;

  useEffect(() => {
    if (!data) return;
    // A returning visitor lands on the station they looked at last.
    const remembered = readRememberedStation(browserStorage());
    if (remembered && data.some((region) => region.id === remembered.regionId)) {
      void navigate({
        to: "/r/$regionId/s/$stationId",
        params: remembered,
        search: {},
        replace: true,
      });
      return;
    }
    if (!onlyRegionId) return;
    void navigate({
      to: "/r/$regionId",
      params: { regionId: onlyRegionId },
      replace: true,
    });
  }, [data, onlyRegionId, navigate]);

  return (
    <div className={shell.page}>
      <AppHeader />
      <main className={shell.mainNarrow}>
        <h1 className={typography.pageTitle}>{strings.app.name}</h1>

        {isPending && <LoadingState />}

        {error && <ErrorState error={error} onRetry={() => void refetch()} />}

        {data && data.length === 0 && (
          <EmptyState
            title={strings.regions.noneTitle}
            body={strings.regions.noneBody}
          />
        )}

        {data && data.length > 1 && (
          <nav aria-label={strings.regions.switcherLabel}>
            <ul className="space-y-2">
              {data.map((region) => (
                <li key={region.id}>
                  <button
                    type="button"
                    className={`${control.button} w-full justify-between`}
                    onClick={() =>
                      void navigate({
                        to: "/r/$regionId",
                        params: { regionId: region.id },
                      })
                    }
                  >
                    <span>{region.name}</span>
                    <span className={surface.muted}>{region.country}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        )}

        {onlyRegionId && <LoadingState />}
      </main>
    </div>
  );
}
