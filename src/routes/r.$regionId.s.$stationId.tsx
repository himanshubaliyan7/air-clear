import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { stationsQuery } from "@/api/queries";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { AvailabilityMarker } from "@/components/AvailabilityMarker";
import { strings } from "@/i18n/strings";
import { surface, typography } from "@/design/tokens";

export const Route = createFileRoute("/r/$regionId/s/$stationId")({
  head: () => ({
    meta: [
      { title: `Station — ${strings.app.name}` },
      {
        name: "description",
        content:
          "Details for a single monitoring station, including whether a current reading and a multi-day outlook are available.",
      },
      { property: "og:title", content: `Station — ${strings.app.name}` },
      {
        property: "og:description",
        content:
          "Whether a current reading and a multi-day outlook are available for this monitoring station.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StationPlaceholder,
});

/**
 * Phase 1 placeholder. It shows only the identity already present in the station
 * list, so no extra per-station request is made. The current reading and the outlook
 * are Phase 2; nothing here says or implies anything about air quality.
 */
function StationPlaceholder() {
  const { regionId, stationId } = Route.useParams();
  const { data, isPending, error, refetch } = useQuery(stationsQuery(regionId));
  const station = data?.find((item) => item.station_id === stationId) ?? null;

  return (
    <section className={surface.section}>
      <Link to="/r/$regionId" params={{ regionId }} className={typography.body}>
        {strings.stations.backToList}
      </Link>

      {isPending && <LoadingState />}
      {error && <ErrorState error={error} onRetry={() => void refetch()} />}

      {data && !station && (
        <EmptyState
          title={strings.stations.unknownTitle}
          body={strings.stations.unknownBody}
        />
      )}

      {station && (
        <div className={surface.card}>
          <h1 className={typography.pageTitle}>{station.name}</h1>
          <p className={`${typography.body} ${surface.muted}`}>{station.city}</p>
          <div
            className="mt-3 flex flex-wrap gap-2"
            aria-label={strings.stations.availabilityLabel}
          >
            <AvailabilityMarker
              available={station.has_current_aqi === true}
              availableText={strings.stations.hasCurrentReading}
              unavailableText={strings.stations.noCurrentReading}
            />
            <AvailabilityMarker
              available={station.has_current_forecast === true}
              availableText={strings.stations.hasOutlook}
              unavailableText={strings.stations.noOutlook}
            />
          </div>
          <p className={`${typography.body} ${surface.muted} mt-3`}>
            {strings.stations.detailComing}
          </p>
        </div>
      )}
    </section>
  );
}
