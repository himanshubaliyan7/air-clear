import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { regionsQuery } from "@/api/queries";
import { RegionProvider } from "@/region/region-context";
import { AppHeader } from "@/components/AppHeader";
import { StatusStrip } from "@/components/StatusStrip";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { strings } from "@/i18n/strings";
import { control, shell } from "@/design/tokens";

export const Route = createFileRoute("/r/$regionId")({
  component: RegionLayout,
});

function RegionLayout() {
  const { regionId } = Route.useParams();
  const navigate = useNavigate();
  const { data, isPending, error, refetch } = useQuery(regionsQuery());

  const region = data?.find((candidate) => candidate.id === regionId) ?? null;

  return (
    <div className={shell.page}>
      <AppHeader regionId={regionId}>
        {/* Region switcher: hidden while the service covers a single region. */}
        {data && data.length > 1 && (
          <label className="flex items-center gap-2 text-sm">
            <span className="sr-only">{strings.regions.switcherLabel}</span>
            <select
              className={`${control.input} w-auto py-1.5`}
              value={region?.id ?? ""}
              onChange={(event) =>
                void navigate({
                  to: "/r/$regionId",
                  params: { regionId: event.target.value },
                })
              }
            >
              {data.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.name}
                </option>
              ))}
            </select>
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
