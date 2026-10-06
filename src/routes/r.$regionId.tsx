import { createFileRoute, Outlet, useNavigate, useSearch } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { regionsQuery } from "@/api/queries";
import { RegionProvider } from "@/region/region-context";
import { AppHeader } from "@/components/AppHeader";
import { StatusStrip } from "@/components/StatusStrip";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { strings } from "@/i18n/strings";
import { resolvePollutant } from "@/lib/stations";
import { control, shell } from "@/design/tokens";

export const Route = createFileRoute("/r/$regionId")({
  component: RegionLayout,
});

function RegionLayout() {
  const { regionId } = Route.useParams();
  const navigate = useNavigate();
  const { data, isPending, error, refetch } = useQuery(regionsQuery());

  const region = data?.find((candidate) => candidate.id === regionId) ?? null;
  const { pollutant } = useSearch({ strict: false }) as { pollutant?: string };

  // Switching lands on the other region's overview, keeping the pollutant when it lists it.
  const switchTo = (id: string) => {
    const target = data?.find((candidate) => candidate.id === id);
    const keep = target ? resolvePollutant(pollutant, target.pollutants ?? []) : undefined;
    void navigate({
      to: "/r/$regionId",
      params: { regionId: id },
      search: keep ? { pollutant: keep } : {},
    });
  };

  return (
    <div className={shell.page}>
      <AppHeader regionId={regionId}>
        {/* Region switcher: hidden while the service covers a single region. */}
        {data && data.length > 1 && (
          <label className="relative block min-w-0 max-w-[9rem] sm:max-w-none">
            <span className="sr-only">{strings.regions.switcherLabel}</span>
            <select
              className={control.select}
              value={region?.id ?? ""}
              onChange={(event) => switchTo(event.target.value)}
            >
              {data.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.name}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2"
              aria-hidden="true"
            />
          </label>
        )}
      </AppHeader>

      <main className={shell.main}>
        {isPending && <LoadingState />}
        {error && <ErrorState error={error} onRetry={() => void refetch()} />}
        {data && !region && (
          <EmptyState
            title={strings.regions.unknownTitle}
            body={strings.regions.unknownBody}
          />
        )}
        {region && (
          <RegionProvider region={region} allRegions={data ?? [region]}>
            <Outlet />
            <StatusStrip regionId={regionId} />
          </RegionProvider>
        )}
      </main>
    </div>
  );
}
