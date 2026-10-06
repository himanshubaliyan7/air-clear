/**
 * The pieces of the region overview. Each one lays out counts of what the API
 * returned: every category and verdict shown here is the server's.
 */
import { NoDataSwatch } from "@/components/dashboard/tiles";
import { Square, stagger } from "@/components/instrument/primitives";
import { swatchStyle } from "@/lib/category-color";
import type { CategoryDistribution, RecommendationCount } from "@/lib/overview";
import { strings } from "@/i18n/strings";
import { dashboard, skeleton, surface, typography, verdictFill } from "@/design/tokens";

/** One figure in the framed row at the head of the overview. */
export function StatCell({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <li className={dashboard.stat}>
      <p className={typography.micro}>{label}</p>
      <p className={dashboard.statValue}>{value}</p>
      <p className={`${typography.micro} opacity-70`}>{note}</p>
    </li>
  );
}

export const noDataSegment = "hatch outline outline-1 -outline-offset-1 outline-dashed outline-border";

/** The strip alone: one segment per category present, then the stations without a reading. */
export function CategoryStrip({ distribution }: { distribution: CategoryDistribution }) {
  const present = distribution.categories.filter((category) => category.count > 0);
  return (
    <div className={dashboard.barTrack} aria-hidden="true">
      {present.map((category, index) => (
        <span
          key={category.id}
          className="grow-x min-w-1"
          style={{ ...swatchStyle(category.color), ...stagger(index), flex: `${category.count} 0 0` }}
        />
      ))}
      {distribution.noData > 0 && (
        <span
          className={`grow-x min-w-1 ${noDataSegment}`}
          style={{ ...stagger(present.length), flex: `${distribution.noData} 0 0` }}
        />
      )}
    </div>
  );
}

/** Stations by current category: one strip, with every count written out below it. */
export function CategoryBar({ distribution }: { distribution: CategoryDistribution }) {
  const { categories, noData } = distribution;
  return (
    <div>
      <CategoryStrip distribution={distribution} />
      <ul className={dashboard.barLegend}>
        {categories.map((category) => (
          <li key={category.id} className="flex items-center gap-2">
            <Square color={category.color} />
            {category.label}
            <span className={`text-foreground ${typography.number}`}>{category.count}</span>
          </li>
        ))}
        <li className="flex items-center gap-2" title={strings.dashboard.noDataNote}>
          <NoDataSwatch />
          {strings.dashboard.noData}
          <span className={`text-foreground ${typography.number}`}>{noData}</span>
        </li>
      </ul>
    </div>
  );
}

/** Stations by outlook verdict, in the fixed order go, caution, no-go, no-data. */
export function VerdictBar({ counts }: { counts: readonly RecommendationCount[] }) {
  return (
    <div>
      <div className={dashboard.barTrack} aria-hidden="true">
        {counts
          .filter((item) => item.count > 0)
          .map((item, index) => (
            <span
              key={item.view.value}
              className={`grow-x min-w-1 ${verdictFill[item.view.tone]}`}
              style={{ ...stagger(index), flex: `${item.count} 0 0` }}
            />
          ))}
      </div>
      <ul className={dashboard.barLegend}>
        {counts.map((item) => (
          <li key={item.view.value} className="flex items-center gap-2">
            <span className={`${dashboard.pillDot} ${verdictFill[item.view.tone]}`} aria-hidden="true" />
            {item.view.label}
            <span className={`text-foreground ${typography.number}`}>{item.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Stands in for the overview while its one request is on the way. */
export function OverviewSkeleton() {
  return (
    <div role="status" aria-live="polite" className="space-y-8">
      <span className="sr-only">{strings.common.loading}</span>
      <div className={`${skeleton} h-28`} />
      <div className="grid gap-8 md:grid-cols-2">
        <div className={`${skeleton} h-20`} />
        <div className={`${skeleton} h-20`} />
      </div>
      <div className="space-y-2">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((item) => (
          <div key={item} className={`${skeleton} h-12 ${surface.muted}`} />
        ))}
      </div>
    </div>
  );
}
