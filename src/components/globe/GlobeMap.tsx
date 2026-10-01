/**
 * The globe itself: MapLibre GL (globe projection, satellite imagery) with deck.gl
 * drawing the stations. MapLibre stays on v5: deck.gl 9.4 reads map internals that
 * v6 removed (checked 2026-10-01: every frame threw in v6). Client-only: both libraries need WebGL, so they are loaded
 * inside an effect and never during server rendering.
 *
 * It draws what it is given. Colours, heights and the no-data state are decided in
 * src/lib/globe.ts.
 */
import { useEffect, useRef, useState } from "react";
import type { Map as MapLibreMap, StyleSpecification } from "maplibre-gl";
import type { MapboxOverlay } from "@deck.gl/mapbox";
import "maplibre-gl/dist/maplibre-gl.css";

import type { GlobeMarker } from "@/lib/globe";
import { strings } from "@/i18n/strings";
import { globe } from "@/design/tokens";

/** Station footprint and the height of a column at the top of the scale, in metres. */
const STATION_RADIUS_M = 700;
const MAX_COLUMN_HEIGHT_M = 14_000;
const TRANSITION_MS = 600;

const SPIN_MS = 2_200;
const SPIN_DEGREES = 28;
const FLY_MS = 5_000;
const TARGET_PITCH = 50;
const TARGET_BEARING = -12;

/**
 * Imagery: Sentinel-2 cloudless 2020 by EOX (CC BY-NC-SA 4.0, fine for this
 * non-commercial service; credit is shown on the map). Place names: OpenFreeMap.
 * Only city and town names are drawn. No borders are drawn at all.
 */
function buildStyle(): StyleSpecification {
  return {
    version: 8,
    projection: { type: "globe" },
    glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
    sky: {
      "atmosphere-blend": ["interpolate", ["linear"], ["zoom"], 0, 1, 5, 1, 7, 0],
    },
    sources: {
      imagery: {
        type: "raster",
        tiles: [
          "https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2020_3857/default/g/{z}/{y}/{x}.jpg",
        ],
        tileSize: 256,
        maxzoom: 14,
        attribution: `<a href="${strings.globe.imageryUrl}" target="_blank" rel="noreferrer">${strings.globe.imageryCredit}</a>`,
      },
      places: {
        type: "vector",
        url: "https://tiles.openfreemap.org/planet",
        attribution: `<a href="${strings.globe.labelsUrl}" target="_blank" rel="noreferrer">${strings.globe.labelsCredit}</a>`,
      },
    },
    layers: [
      { id: "space", type: "background", paint: { "background-color": "#04060c" } },
      { id: "imagery", type: "raster", source: "imagery" },
      {
        id: "place-names",
        type: "symbol",
        source: "places",
        "source-layer": "place",
        minzoom: 5,
        filter: ["in", ["get", "class"], ["literal", ["city", "town"]]],
        layout: {
          "text-field": ["coalesce", ["get", "name:en"], ["get", "name"]],
          "text-font": ["Noto Sans Regular"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 5, 11, 10, 14],
          "text-max-width": 8,
        },
        paint: {
          "text-color": "#ffffff",
          "text-halo-color": "rgba(0,0,0,0.75)",
          "text-halo-width": 1.4,
        },
      },
    ],
  };
}

export interface GlobeMapProps {
  markers: readonly GlobeMarker[];
  selectedId: string | null;
  onSelect: (stationId: string | null) => void;
  /** [west, south, east, north] to fly to; null keeps the whole-globe view. */
  bounds: [number, number, number, number] | null;
}

interface Runtime {
  map: MapLibreMap;
  overlay: MapboxOverlay;
  layers: typeof import("@deck.gl/layers");
}

/**
 * Browser only. The SSR branch is removed at build time, which keeps about 3 MB of
 * WebGL code out of the server bundle.
 */
const loadLibraries = import.meta.env.SSR
  ? null
  : () =>
      Promise.all([import("maplibre-gl"), import("@deck.gl/mapbox"), import("@deck.gl/layers")]);

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true
  );
}

export function GlobeMap({ markers, selectedId, onSelect, bounds }: GlobeMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const runtimeRef = useRef<Runtime | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const boundsRef = useRef(bounds);
  boundsRef.current = bounds;

  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  // Create the map once.
  useEffect(() => {
    let cancelled = false;
    let map: MapLibreMap | null = null;

    void (async () => {
      try {
        if (!loadLibraries) return;
        const [maplibre, deckMapbox, layers] = await loadLibraries();
        if (cancelled || !containerRef.current) return;

        const target = boundsRef.current;
        const startLon = target ? (target[0] + target[2]) / 2 - 70 : 0;
        map = new maplibre.Map({
          container: containerRef.current,
          style: buildStyle(),
          center: [startLon, 18],
          zoom: 1.4,
          maxPitch: 70,
          attributionControl: { compact: true },
        });
        const created = map;
        const overlay = new deckMapbox.MapboxOverlay({ interleaved: true, layers: [] });
        created.addControl(overlay);

        created.on("load", () => {
          if (cancelled) return;
          runtimeRef.current = { map: created, overlay, layers };
          setReady(true);
          introduce(created, boundsRef.current);
        });
        created.on("error", (event) => {
          // Tile hiccups are routine; only a map that never loaded counts as a failure.
          if (!runtimeRef.current) console.error(event.error);
        });
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

  // Redraw the stations whenever the markers or the selection change.
  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!ready || !runtime) return;
    const { ColumnLayer, ScatterplotLayer } = runtime.layers;
    const withValue = markers.filter((marker) => marker.status === "value");
    const withoutValue = markers.filter((marker) => marker.status === "no-data");
    const selected = markers.filter((marker) => marker.stationId === selectedId);
    const pick = (info: { object?: GlobeMarker | null }) => {
      onSelectRef.current(info.object?.stationId ?? null);
      return true;
    };

    runtime.overlay.setProps({
      layers: [
        // A dot under every column keeps a station visible from far away.
        new ScatterplotLayer<GlobeMarker>({
          id: "station-dots",
          data: withValue,
          getPosition: (marker) => [marker.lon, marker.lat],
          getFillColor: (marker) => [...marker.color, 235],
          getRadius: STATION_RADIUS_M,
          radiusMinPixels: 3.5,
          stroked: true,
          getLineColor: [255, 255, 255, 200],
          lineWidthMinPixels: 1,
          pickable: true,
          onClick: pick,
          transitions: { getFillColor: TRANSITION_MS },
        }),
        // No data: grey and hollow, so it differs in shape as well as colour.
        new ScatterplotLayer<GlobeMarker>({
          id: "station-no-data",
          data: withoutValue,
          getPosition: (marker) => [marker.lon, marker.lat],
          filled: true,
          getFillColor: [0, 0, 0, 90],
          stroked: true,
          getLineColor: (marker) => [...marker.color, 255],
          getRadius: STATION_RADIUS_M,
          radiusMinPixels: 5,
          lineWidthMinPixels: 2,
          pickable: true,
          onClick: pick,
        }),
        new ColumnLayer<GlobeMarker>({
          id: "station-columns",
          data: withValue,
          getPosition: (marker) => [marker.lon, marker.lat],
          getFillColor: (marker) => [...marker.color, 230],
          getElevation: (marker) => marker.magnitude * MAX_COLUMN_HEIGHT_M,
          radius: STATION_RADIUS_M,
          diskResolution: 16,
          extruded: true,
          pickable: true,
          autoHighlight: true,
          onClick: pick,
          transitions: { getFillColor: TRANSITION_MS, getElevation: TRANSITION_MS },
        }),
        new ScatterplotLayer<GlobeMarker>({
          id: "station-selected",
          data: selected,
          getPosition: (marker) => [marker.lon, marker.lat],
          filled: false,
          stroked: true,
          getLineColor: [255, 255, 255, 255],
          getRadius: STATION_RADIUS_M * 2.2,
          radiusMinPixels: 11,
          lineWidthMinPixels: 3,
          // Drawn over the columns, so the ring is never hidden behind one.
          parameters: { depthCompare: "always" },
        }),
      ],
      onClick: (info: { object?: unknown }) => {
        if (!info.object) onSelectRef.current(null);
      },
      getCursor: ({ isHovering }: { isHovering: boolean }) => (isHovering ? "pointer" : "grab"),
    });
  }, [ready, markers, selectedId]);

  const zoomBy = (delta: number) => {
    const map = runtimeRef.current?.map;
    if (!map) return;
    map.easeTo({ zoom: map.getZoom() + delta, duration: prefersReducedMotion() ? 0 : 300 });
  };
  const resetView = () => {
    const map = runtimeRef.current?.map;
    if (map) flyToRegion(map, boundsRef.current, prefersReducedMotion() ? 0 : 1_500);
  };

  return (
    <div className={globe.stage}>
      <div
        ref={containerRef}
        className={globe.canvas}
        role="application"
        aria-label={strings.globe.mapLabel}
      />
      {failed && <p className={globe.notice}>{strings.globe.unsupported}</p>}
      {ready && (
        <div className={globe.controls}>
          <button
            type="button"
            className={globe.controlButton}
            onClick={() => zoomBy(1)}
            aria-label={strings.globe.zoomIn}
          >
            +
          </button>
          <button
            type="button"
            className={globe.controlButton}
            onClick={() => zoomBy(-1)}
            aria-label={strings.globe.zoomOut}
          >
            −
          </button>
          <button
            type="button"
            className={globe.controlButton}
            onClick={resetView}
            aria-label={strings.globe.resetView}
          >
            ⌂
          </button>
        </div>
      )}
    </div>
  );
}

function flyToRegion(
  map: MapLibreMap,
  bounds: [number, number, number, number] | null,
  duration: number,
): void {
  if (!bounds) return;
  const camera = map.cameraForBounds(
    [
      [bounds[0], bounds[1]],
      [bounds[2], bounds[3]],
    ],
    { padding: 40 },
  );
  if (!camera?.center) return;
  const target = {
    center: camera.center,
    zoom: camera.zoom ?? 8,
    pitch: TARGET_PITCH,
    bearing: TARGET_BEARING,
  };
  if (duration === 0) map.jumpTo(target);
  else map.flyTo({ ...target, duration, essential: true });
}

/** The opening: the globe turns a little, then the camera flies into the region. */
function introduce(map: MapLibreMap, bounds: [number, number, number, number] | null): void {
  if (!bounds) return;
  if (prefersReducedMotion()) {
    flyToRegion(map, bounds, 0);
    return;
  }
  const start = map.getCenter();
  map.easeTo({
    center: [start.lng + SPIN_DEGREES, start.lat],
    duration: SPIN_MS,
    easing: (t) => t,
  });
  // A user who grabs the globe during the turn keeps control: the fly-in is skipped.
  let interrupted = false;
  const interrupt = () => {
    interrupted = true;
  };
  map.once("dragstart", interrupt);
  map.once("wheel", interrupt);
  map.once("touchstart", interrupt);
  map.once("remove", interrupt);
  window.setTimeout(() => {
    if (!interrupted) flyToRegion(map, bounds, FLY_MS);
  }, SPIN_MS);
}
