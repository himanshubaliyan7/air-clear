import { createFileRoute } from "@tanstack/react-router";
import { useRegion } from "@/region/region-context";
import { strings } from "@/i18n/strings";
import { surface, typography } from "@/design/tokens";
import { formatPollutantId } from "@/lib/pollutants";

export const Route = createFileRoute("/r/$regionId/")({
  head: () => ({
    meta: [
      { title: `Stations — ${strings.app.name}` },
      {
        name: "description",
        content:
          "Monitoring stations in the selected region, showing which have a current reading and which have a multi-day outlook.",
      },
      { property: "og:title", content: `Stations — ${strings.app.name}` },
      {
        property: "og:description",
        content:
          "Monitoring stations with current readings and multi-day outlooks.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RegionHome,
});

/**
 * Phase 0 placeholder. It proves the region context is wired: everything below is
 * read from the API, nothing is hardcoded. Phase 1 replaces this with the station
 * list and coverage counts.
 */
function RegionHome() {
  const { region, timeZone, categories, aqiStandard, healthThresholdCategoryId } =
    useRegion();

  return (
    <section className={surface.section}>
      <h1 className={typography.pageTitle}>{region.name}</h1>
      <div className={surface.card}>
        <dl className={`${typography.body} grid gap-2 sm:grid-cols-2`}>
          <div>
            <dt className={surface.muted}>Country</dt>
            <dd>{region.country}</dd>
          </div>
          <div>
            <dt className={surface.muted}>Time zone</dt>
            <dd>{timeZone}</dd>
          </div>
          <div>
            <dt className={surface.muted}>{strings.current.standardLabel}</dt>
            <dd>{aqiStandard}</dd>
          </div>
          <div>
            <dt className={surface.muted}>Pollutants</dt>
            <dd>{region.pollutants.map(formatPollutantId).join(", ")}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className={surface.muted}>Categories, best to worst</dt>
            <dd>
              <ol className="list-decimal pl-5">
                {categories.map((category) => (
                  <li key={category.id}>
                    {category.label}
                    {category.id === healthThresholdCategoryId && (
                      <span className={surface.muted}>
                        {" "}
                        — outdoor practice not recommended at or above this level
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
