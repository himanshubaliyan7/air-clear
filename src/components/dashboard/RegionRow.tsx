import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { useMemo } from "react";
import { overviewQuery } from "@/api/queries";
import type { Region } from "@/api/types";
import { CategoryStrip, noDataSegment } from "@/components/dashboard/overview";
import { stagger } from "@/components/instrument/primitives";
import { regionGlance, type RegionGlance } from "@/lib/regions";
import { strings } from "@/i18n/strings";
import { dashboard, skeleton, surface, typography } from "@/design/tokens";

const t = strings.regions;

/** The live figures of one region: counts and the strip, or why there are none. */
function Figures({ glance }: { glance: RegionGlance }) {
  if (glance.state === "loading") {
    return (
      <div role="status" className="space-y-3">
        <span className="sr-only">{strings.common.loading}</span>
        <div className={`${skeleton} h-4 w-2/3`} />
        <div className={`${skeleton} h-9 w-full`} />
      </div>
    );
  }
  if (glance.state === "unavailable") {
    return <p className={`${typography.micro} ${surface.muted}`}>{t.homeUnavailable}</p>;
  }
  if (glance.state === "empty" || !glance.distribution) {
    return (
      <div className="space-y-3" title={t.homeNoDataNote}>
        <p className={`${typography.micro} ${surface.muted}`}>{t.homeNoData}</p>
        <div className={dashboard.barTrack} aria-hidden="true">
          <span className={`flex-1 ${noDataSegment}`} />
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <p className={`${typography.micro} flex flex-wrap gap-x-6 gap-y-1`}>
        <span className={typography.number}>{t.homeReporting(glance.reporting, glance.total)}</span>
        <span className={`${typography.number} ${surface.muted}`}>
          {t.homeAbove(glance.atOrAboveThreshold)}
        </span>
      </p>
      <CategoryStrip distribution={glance.distribution} />
    </div>
  );
}

/** One region, with its figures from the overview (cached, so usually already there). */
export function RegionRow({ region, index }: { region: Region; index: number }) {
  const { data, isPending } = useQuery(overviewQuery(region.id));
  const glance = useMemo(
    () => regionGlance(region, isPending ? undefined : (data ?? null)),
    [region, data, isPending],
  );
  return (
    <li className="rise-in" style={stagger(index + 4)}>
      <Link
        to="/r/$regionId"
        params={{ regionId: glance.regionId }}
        search={{}}
        className={dashboard.regionRow}
      >
        <div className="space-y-2">
          <h2 className={dashboard.regionName}>{glance.name}</h2>
          <p className={typography.eyebrow}>
            {glance.country} / {glance.aqiStandard}
          </p>
        </div>
        <Figures glance={glance} />
        <ArrowRight
          className="hidden h-6 w-6 transition-transform duration-200 group-hover:translate-x-1 lg:block"
          aria-hidden="true"
        />
      </Link>
    </li>
  );
}
