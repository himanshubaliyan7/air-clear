/**
 * The other stations beside a station's page, nearest first, each a link to
 * its own page. A search covers all of them.
 */
import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { HollowSquare, Square } from "@/components/instrument/primitives";
import { NO_DATA_COLOR } from "@/lib/category-color";
import type { NearbyStation } from "@/lib/dashboard";
import { formatNumber } from "@/lib/format-time";
import { strings } from "@/i18n/strings";
import { surface, typography } from "@/design/tokens";

const row =
  "grid shrink-0 grid-cols-[auto_auto_auto] items-center gap-x-3 whitespace-nowrap border-r border-hair px-3 py-2.5 font-display text-[0.82rem] font-semibold uppercase leading-tight transition-[background-color,padding] duration-200 hover:bg-muted xl:w-full xl:grid-cols-[auto_minmax(0,1fr)_auto] xl:border-b xl:border-r-0 xl:px-1.5 xl:hover:pl-4";

/**
 * `relative` matters: the rows hold screen-reader-only text, which is absolutely positioned.
 * In a scroller that is not positioned, that text escapes the clipping, and on a phone the
 * whole page becomes as wide as the list.
 */
const list =
  "relative flex overflow-x-auto border border-border xl:block xl:overflow-y-auto xl:overflow-x-hidden xl:border-x-0 xl:border-b-0";

export function StationIndex({
  stations,
  regionId,
}: {
  stations: readonly NearbyStation[];
  regionId: string;
}) {
  const [query, setQuery] = useState("");
  const visible = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    if (!needle) return stations;
    return stations.filter(
      (station) =>
        station.name.toLocaleLowerCase().includes(needle) ||
        station.city.toLocaleLowerCase().includes(needle),
    );
  }, [stations, query]);

  return (
    <aside
      className="rise-in grid min-w-0 content-start gap-3 xl:sticky xl:top-20 xl:max-h-[calc(100vh-9.5rem)] xl:grid-rows-[auto_auto_minmax(0,1fr)]"
      aria-label={strings.instrument.stationIndex}
    >
      <h2 className={typography.eyebrow}>{strings.instrument.stationIndex}</h2>
      <label>
        <span className="sr-only">{strings.instrument.stationSearch}</span>
        <input
          type="search"
          value={query}
          placeholder={strings.instrument.stationSearch}
          onChange={(event) => setQuery(event.target.value)}
          className={`w-full rounded-none border-0 border-b border-border bg-transparent py-2 placeholder:text-muted-foreground ${typography.micro}`}
        />
      </label>
      {visible.length === 0 ? (
        <p className={`${typography.eyebrow} py-2`}>{strings.stations.noMatchBody}</p>
      ) : (
        <ul className={list}>
          {visible.map((station) => (
            <li key={station.stationId} className="shrink-0">
              <Link
                to="/r/$regionId/s/$stationId"
                params={{ regionId, stationId: station.stationId }}
                search={(prev) => prev}
                className={row}
                title={strings.dashboard.distance(
                  formatNumber(station.distanceKm, { maximumFractionDigits: 1 }),
                )}
              >
                {station.hasValue ? (
                  <Square color={station.color} />
                ) : (
                  <HollowSquare color={NO_DATA_COLOR} />
                )}
                <span className="truncate">{station.name}</span>
                <span className={`text-right ${typography.micro} ${surface.muted} ${typography.number}`}>
                  <span className="sr-only">
                    {station.categoryLabel ?? strings.dashboard.noData}{" "}
                  </span>
                  {station.indexValue !== null ? formatNumber(station.indexValue) : "–"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
