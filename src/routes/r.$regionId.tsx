import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { regionsQuery } from "@/api/queries";
import { RegionProvider } from "@/region/region-context";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { strings } from "@/i18n/strings";
import { control, surface, typography } from "@/design/tokens";

export const Route = createFileRoute("/r/$regionId")({
  component: RegionLayout,
});

function RegionLayout() {
  const { regionId } = Route.useParams();
  const navigate = useNavigate();
  const { data, isPending, error, refetch } = useQuery(regionsQuery());

  const region = data?.find((candidate) => candidate.id === regionId) ?? null;

  return (
    <div className={`${surface.page} min-h-screen`}>
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 p-4">
          <Link to="/" className={typography.sectionTitle}>
            {strings.app.name}
          </Link>

          <Link
            to="/subscribe"
            search={{ region: regionId }}
            className={control.button}
          >
            {strings.subscriptions.navLink}
          </Link>
          {/* Region switcher: hidden while the service covers a single region. */}
          {data && data.length > 1 && (
            <label className="flex items-center gap-2 text-sm">
              <span>{strings.regions.switcherLabel}</span>
              <select
                className={control.input}
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
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-4 p-4 sm:p-6">
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
          </RegionProvider>
        )}
      </main>
    </div>
  );
}
