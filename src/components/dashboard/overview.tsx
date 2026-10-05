/**
 * The pieces of the region overview. Each one lays out counts of what the API
 * returned: every category and verdict shown here is the server's.
 */
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { NoDataSwatch } from "@/components/dashboard/tiles";
import { NO_DATA_COLOR, badgeStyle, rgbCss, swatchStyle } from "@/lib/category-color";
import { formatNumber } from "@/lib/format-time";
import {
  sharePercent,
  type CategoryDistribution,
  type RecommendationCount,
  type StationSummary,
} from "@/lib/overview";
import type { RecommendationView } from "@/lib/recommendation";
import { strings } from "@/i18n/strings";
import { dashboard, skeleton, surface, typography, verdictChip, verdictFill } from "@/design/tokens";

/** A verdict as a small pill. The label is written out; colour is never the only signal. */
export function VerdictPill({ view, prefix }: { view: RecommendationView; prefix?: string }) {
  return (
    <span className={`${dashboard.pill} ${verdictChip[view.tone]}`}>
      <span className={`${dashboard.pillDot} ${verdictFill[view.tone]}`} aria-hidden="true" />
      {prefix && <span className="sr-only">{prefix}: </span>}
      {view.label}
    </span>
  );
}

/** A station's current index value on its category's colour, or a hollow box without one. */
export function IndexBadge({ station }: { station: StationSummary }) {
  if (!station.hasValue || station.indexValue === null) {
    return (
      <span className={dashboard.badgeHollow} style={{ borderColor: rgbCss(NO_DATA_COLOR) }}>
        {strings.common.notAvailableShort}
      </span>
    );
  }
  return (
    <span className={dashboard.badge} style={badgeStyle(station.color)}>
      <span className="sr-only">{strings.overview.indexLabel} </span>
      {formatNumber(station.indexValue)}
    </span>
  );
}

export function StatTile({
  icon,
  label,
  value,
  note,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className={dashboard.stat}>
      <div className="flex items-center gap-2">
        <span className={dashboard.statIcon} aria-hidden="true">
          {icon}
        </span>
        <p className={`${typography.small} font-medium ${surface.muted}`}>{label}</p>
      </div>
      <p className={dashboard.statValue}>{value}</p>
      <p className={`${typography.small} ${surface.muted}`}>{note}</p>
    </div>
  );
}

/** Stations by current category: a stacked bar with every count written out below it. */
export function CategoryBar({ distribution }: { distribution: CategoryDistribution }) {
  const { categories, noData, total } = distribution;
  return (
    <div>
      <div className={dashboard.barTrack} aria-hidden="true">
        {categories
          .filter((category) => category.count > 0)
          .map((category) => (
            <span
              key={category.id}
              style={{
                ...swatchStyle(category.color),
                width: `${sharePercent(category.count, total)}%`,
              }}
            />
          ))}
      </div>
      <ul className={dashboard.barLegend}>
        {categories.map((category) => (
          <li key={category.id} className={`flex items-center gap-1.5 ${typography.small}`}>
            <span
              className={dashboard.swatch}
              style={swatchStyle(category.color)}
              aria-hidden="true"
            />
            {category.label}
            <span className={`font-semibold ${typography.number}`}>{category.count}</span>
          </li>
        ))}
        <li
          className={`flex items-center gap-1.5 ${typography.small}`}
          title={strings.dashboard.noDataNote}
        >
          <NoDataSwatch />
          {strings.dashboard.noData}
          <span className={`font-semibold ${typography.number}`}>{noData}</span>
        </li>
      </ul>
    </div>
  );
}

/** Stations by outlook verdict, in the fixed order go, caution, no-go, no-data. */
export function VerdictBar({ counts }: { counts: readonly RecommendationCount[] }) {
  const total = counts.reduce((sum, item) => sum + item.count, 0);
  return (
    <div>
      <div className={dashboard.barTrack} aria-hidden="true">
        {counts
          .filter((item) => item.count > 0)
          .map((item) => (
            <span
              key={item.view.value}
              className={verdictFill[item.view.tone]}
              style={{ width: `${sharePercent(item.count, total)}%` }}
            />
          ))}
      </div>
      <ul className={dashboard.barLegend}>
        {counts.map((item) => (
          <li key={item.view.value} className={`flex items-center gap-1.5 ${typography.small}`}>
            <span
              className={`${dashboard.pillDot} h-2.5 w-2.5 ${verdictFill[item.view.tone]}`}
              aria-hidden="true"
            />
            {item.view.label}
            <span className={`font-semibold ${typography.number}`}>{item.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** A short ranked list of stations, each a link to its dashboard. */
export function RankList({
  stations,
  regionId,
}: {
  stations: readonly StationSummary[];
  regionId: string;
}) {
  if (stations.length === 0) {
    return <p className={`${typography.body} ${surface.muted}`}>{strings.overview.rankEmpty}</p>;
  }
  return (
    <ol>
      {stations.map((station, index) => (
        <li key={station.stationId}>
          <Link
            to="/r/$regionId/s/$stationId"
            params={{ regionId, stationId: station.stationId }}
            search={{}}
            className={dashboard.rowLink}
          >
            <span className={`w-4 shrink-0 ${typography.small} ${surface.muted}`}>{index + 1}</span>
            <span
              className={dashboard.swatch}
              style={swatchStyle(station.color)}
              aria-hidden="true"
            />
            <span className="min-w-0 flex-1 truncate">{station.name}</span>
            <span className={`${typography.small} ${surface.muted} whitespace-nowrap`}>
              {station.categoryLabel}
            </span>
            <span className={`w-9 shrink-0 text-right font-semibold ${typography.number}`}>
              {formatNumber(station.indexValue)}
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}

/** One station in the grid: the reading now, and the verdict for the next days. */
export function StationCard({ station, regionId }: { station: StationSummary; regionId: string }) {
  return (
    <Link
      to="/r/$regionId/s/$stationId"
      params={{ regionId, stationId: station.stationId }}
      search={{}}
      className={dashboard.stationCard}
    >
      <IndexBadge station={station} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold group-hover:text-brand">
          {station.name}
        </span>
        <span className={`block truncate ${typography.small} ${surface.muted}`}>
          {station.city}
          {" · "}
          {station.categoryLabel ?? strings.overview.noReading}
        </span>
        <span className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className={`${typography.small} ${surface.muted}`} aria-hidden="true">
            {strings.overview.nextDays}
          </span>
          <VerdictPill view={station.recommendation} prefix={strings.overview.nextDays} />
        </span>
      </span>
    </Link>
  );
}

/** Stands in for the overview while its one request is on the way. */
export function OverviewSkeleton() {
  return (
    <div role="status" aria-live="polite" className="space-y-4">
      <span className="sr-only">{strings.common.loading}</span>
      <div className={dashboard.statGrid}>
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className={`${skeleton} h-28`} />
        ))}
      </div>
      <div className={`${skeleton} h-32`} />
      <div className={dashboard.stationGrid}>
        {[0, 1, 2, 3, 4, 5].map((item) => (
          <div key={item} className={`${skeleton} h-24`} />
        ))}
      </div>
    </div>
  );
}
