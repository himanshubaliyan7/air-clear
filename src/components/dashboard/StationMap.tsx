/**
 * The optional map: every station as a dot coloured by its current category.
 * Leaflet with OpenStreetMap tiles, loaded only when the visitor asks for the map,
 * and only in the browser.
 *
 * The view is limited to the region, so the map never shows more than the area the
 * service covers. Dots are not keyboard-reachable; the nearby list and the station
 * list carry the same information.
 */
import { useEffect, useRef, useState } from "react";
import type { LayerGroup, Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";

import { rgbCss } from "@/lib/category-color";
import type { StationGlance } from "@/lib/dashboard";
import { strings } from "@/i18n/strings";
import { dashboard } from "@/design/tokens";

const loadLeaflet = import.meta.env.SSR ? null : () => import("leaflet");

type Leaflet = typeof import("leaflet");

const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const FOCUS_ZOOM = 11;
/** How far outside the region the view may be dragged, in degrees. */
const BOUNDS_MARGIN = 0.5;

export interface StationMapProps {
  stations: readonly StationGlance[];
  selectedId: string | null;
  /** [west, south, east, north] of the region, or null when unknown. */
  bounds: [number, number, number, number] | null;
  onSelect: (stationId: string) => void;
}

interface Runtime {
  L: Leaflet;
  map: LeafletMap;
  markers: LayerGroup;
}

export function StationMap({ stations, selectedId, bounds, onSelect }: StationMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const runtimeRef = useRef<Runtime | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const initialRef = useRef({ stations, selectedId, bounds });

  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let map: LeafletMap | null = null;

    void (async () => {
      try {
        if (!loadLeaflet) return;
        const module = await loadLeaflet();
        const L = ((module as { default?: Leaflet }).default ?? module) as Leaflet;
        if (cancelled || !containerRef.current) return;

        const initial = initialRef.current;
        map = L.map(containerRef.current, {
          // The page scrolls past the map; zooming is by the buttons or a pinch.
          scrollWheelZoom: false,
          minZoom: 8,
          maxZoom: 16,
          ...(initial.bounds
            ? {
                maxBounds: L.latLngBounds(
                  [initial.bounds[1] - BOUNDS_MARGIN, initial.bounds[0] - BOUNDS_MARGIN],
                  [initial.bounds[3] + BOUNDS_MARGIN, initial.bounds[2] + BOUNDS_MARGIN],
                ),
                maxBoundsViscosity: 1,
              }
            : {}),
        });
        map.attributionControl.setPrefix(
          '<a href="https://leafletjs.com" target="_blank" rel="noreferrer">Leaflet</a>',
        );
        L.tileLayer(TILE_URL, {
          attribution: `&copy; <a href="${strings.dashboard.mapCreditUrl}" target="_blank" rel="noreferrer">${strings.dashboard.mapCredit}</a>`,
        }).addTo(map);

        const selected = initial.stations.find((s) => s.stationId === initial.selectedId);
        if (selected) {
          map.setView([selected.lat, selected.lon], FOCUS_ZOOM);
        } else if (initial.stations.length > 0) {
          map.fitBounds(L.latLngBounds(initial.stations.map((s) => [s.lat, s.lon])), {
            padding: [24, 24],
          });
        } else if (initial.bounds) {
          map.fitBounds([
            [initial.bounds[1], initial.bounds[0]],
            [initial.bounds[3], initial.bounds[2]],
          ]);
        } else {
          map.setView([0, 0], 8);
        }

        runtimeRef.current = { L, map, markers: L.layerGroup().addTo(map) };
        setReady(true);
      } catch (cause) {
        console.error(cause);
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
      runtimeRef.current = null;
      map?.remove();
    };
  }, []);

  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!ready || !runtime) return;
    const { L, markers } = runtime;
    markers.clearLayers();
    // The selected station is drawn last, so it sits on top.
    const ordered = [...stations].sort(
      (a, b) => Number(a.stationId === selectedId) - Number(b.stationId === selectedId),
    );
    for (const station of ordered) {
      const isSelected = station.stationId === selectedId;
      const marker = L.circleMarker([station.lat, station.lon], {
        radius: isSelected ? 11 : 7,
        // No data: grey and hollow, so it differs in shape as well as colour.
        fillColor: rgbCss(station.color),
        fillOpacity: station.hasValue ? 0.95 : 0.15,
        color: isSelected ? "#111827" : station.hasValue ? "#ffffff" : rgbCss(station.color),
        weight: isSelected ? 3 : station.hasValue ? 1.5 : 2,
        ...(station.hasValue ? {} : { dashArray: "3 3" }),
      });
      const label = document.createElement("span");
      label.textContent = strings.dashboard.mapMarkerLabel(
        station.name,
        station.categoryLabel ?? strings.dashboard.noData,
      );
      marker.bindTooltip(label, { direction: "top" });
      marker.on("click", () => onSelectRef.current(station.stationId));
      marker.addTo(markers);
    }
  }, [ready, stations, selectedId]);

  return (
    <div className={dashboard.mapFrame}>
      <div
        ref={containerRef}
        className={dashboard.mapCanvas}
        role="application"
        aria-label={strings.dashboard.mapLabel}
      />
      {failed && <p className={dashboard.mapNotice}>{strings.dashboard.mapFailed}</p>}
    </div>
  );
}
