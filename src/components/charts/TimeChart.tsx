/**
 * A small accessible time-series chart, hand-built in SVG.
 *
 * - Nulls break lines (gaps), never drawn as zero or interpolated.
 * - A band is drawn only where both bounds exist.
 * - The threshold line is drawn only when a value is supplied.
 * - Keyboard: focus the chart, then Left/Right move between times, Home/End jump.
 *   The tooltip follows focus and hover; its content is announced once per move.
 */
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import {
  bandSegments,
  linearScale,
  niceTicks,
  segments,
  valueExtent,
  type BandPoint,
  type ChartPoint,
} from "@/lib/forecast-detail";
import { chart, surface, typography } from "@/design/tokens";
import { strings } from "@/i18n/strings";

export interface ChartLine {
  id: string;
  label: string;
  points: ChartPoint[];
  tone: keyof typeof chart.line;
}

export interface TooltipRow {
  label: string;
  value: string;
}

export interface TimeChartProps {
  title: string;
  summary: string;
  xs: number[];
  lines: ChartLine[];
  band?: { label: string; points: BandPoint[] } | undefined;
  threshold?: { value: number; label: string } | null | undefined;
  /** Shade the area under the first line, down to the bottom of the plot. */
  area?: boolean | undefined;
  axisLabel: string;
  formatTick: (x: number) => string;
  formatValue: (v: number) => string;
  tooltip: (index: number) => { heading: string; rows: TooltipRow[] };
}

const HEIGHT = 260;
const PAD = { top: 16, right: 16, bottom: 32, left: 52 };

export function TimeChart(props: TimeChartProps) {
  const { title, summary, xs, lines, band, threshold, area, axisLabel } = props;
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  const [active, setActive] = useState<number | null>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w && w > 0) setWidth(Math.round(w));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const layout = useMemo(() => {
    const all: Array<number | null> = [];
    for (const l of lines) for (const p of l.points) all.push(p.y);
    if (band) for (const p of band.points) all.push(p.low, p.high);
    if (threshold) all.push(threshold.value);
    const extent = valueExtent(all);
    const xMin = Math.min(...xs);
    const xMax = Math.max(...xs);
    const innerW = Math.max(40, width - PAD.left - PAD.right);
    const x = linearScale(
      xMin === xMax ? [xMin - 1, xMax + 1] : [xMin, xMax],
      [PAD.left, PAD.left + innerW],
    );
    const narrow = width < 480;
    const yTicks = extent ? niceTicks(extent[0], extent[1], narrow ? 3 : 5) : [];
    const yDomain: [number, number] = yTicks.length
      ? [Math.min(yTicks[0]!, extent![0]), Math.max(yTicks[yTicks.length - 1]!, extent![1])]
      : [0, 1];
    const y = linearScale(yDomain, [HEIGHT - PAD.bottom, PAD.top]);
    const xTickCount = narrow ? 3 : 5;
    const xTicks =
      xs.length <= xTickCount
        ? xs
        : Array.from({ length: xTickCount }, (_, i) =>
            xs[Math.round((i * (xs.length - 1)) / (xTickCount - 1))]!,
          );
    return { x, y, yTicks, xTicks, hasValues: extent !== null };
  }, [lines, band, threshold, xs, width]);

  const move = (index: number) =>
    setActive(Math.max(0, Math.min(xs.length - 1, index)));

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const current = active ?? -1;
    const keys: Record<string, () => void> = {
      ArrowRight: () => move(current + 1),
      ArrowLeft: () => move(current < 0 ? 0 : current - 1),
      Home: () => move(0),
      End: () => move(xs.length - 1),
      Escape: () => setActive(null),
    };
    const fn = keys[event.key];
    if (fn) {
      event.preventDefault();
      fn();
    }
  };

  const onPointer = (clientX: number) => {
    const el = wrapRef.current;
    if (!el || !xs.length) return;
    const px = clientX - el.getBoundingClientRect().left;
    let best = 0;
    let bestD = Infinity;
    xs.forEach((v, i) => {
      const d = Math.abs(layout.x(v) - px);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    setActive(best);
  };

  const tip = active !== null ? props.tooltip(active) : null;
  const activeX = active !== null ? layout.x(xs[active]!) : null;
  const pathFor = (run: Array<{ x: number; y: number }>) =>
    run
      .map((p, i) => `${i ? "L" : "M"}${layout.x(p.x).toFixed(1)},${layout.y(p.y).toFixed(1)}`)
      .join(" ");

  return (
    <figure className="space-y-2">
      <div
        ref={wrapRef}
        role="group"
        aria-roledescription={strings.chart.roleDescription}
        aria-labelledby={titleId}
        aria-describedby={descId}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onFocus={() => active === null && xs.length && setActive(0)}
        onMouseMove={(e) => onPointer(e.clientX)}
        onMouseLeave={() => setActive(null)}
        onBlur={() => setActive(null)}
        className={`relative w-full ${chart.focus}`}
      >
        <svg width={width} height={HEIGHT} role="img" aria-labelledby={titleId} aria-describedby={descId} className="block max-w-full">
          <title id={titleId}>{title}</title>
          <desc id={descId}>{summary}</desc>
          {layout.yTicks.map((t) => (
            <g key={`y${t}`}>
              <line x1={PAD.left} x2={width - PAD.right} y1={layout.y(t)} y2={layout.y(t)} className={chart.grid} />
              <text x={PAD.left - 6} y={layout.y(t)} textAnchor="end" dominantBaseline="middle" className={chart.tick}>
                {props.formatValue(t)}
              </text>
            </g>
          ))}
          {layout.xTicks.map((t, i, arr) => (
            <text key={`x${t}`} x={layout.x(t)} y={HEIGHT - 10} textAnchor={arr.length > 1 && i === arr.length - 1 ? "end" : i === 0 && arr.length > 1 ? "start" : "middle"} className={chart.tick}>
              {props.formatTick(t)}
            </text>
          ))}
          <text x={12} y={HEIGHT / 2} transform={`rotate(-90 12 ${HEIGHT / 2})`} textAnchor="middle" className={chart.tick}>
            {axisLabel}
          </text>
          {band &&
            bandSegments(band.points).map((run, i) => (
              <path
                key={`b${i}`}
                className={chart.band}
                d={
                  run.map((p, j) => `${j ? "L" : "M"}${layout.x(p.x)},${layout.y(p.high)}`).join(" ") +
                  " " +
                  [...run].reverse().map((p) => `L${layout.x(p.x)},${layout.y(p.low)}`).join(" ") +
                  " Z"
                }
              />
            ))}
          {area &&
            lines[0] &&
            segments(lines[0].points)
              .filter((run) => run.length > 1)
              .map((run, i) => (
                <path
                  key={`a${i}`}
                  className={chart.area}
                  d={`${pathFor(run)} L${layout.x(run[run.length - 1]!.x).toFixed(1)},${HEIGHT - PAD.bottom} L${layout.x(run[0]!.x).toFixed(1)},${HEIGHT - PAD.bottom} Z`}
                />
              ))}
          {threshold && (
            <line
              x1={PAD.left}
              x2={width - PAD.right}
              y1={layout.y(threshold.value)}
              y2={layout.y(threshold.value)}
              className={chart.threshold}
            />
          )}
          {lines.map((line) =>
            segments(line.points).map((run, i) =>
              run.length === 1 ? (
                <circle key={`${line.id}${i}`} cx={layout.x(run[0]!.x)} cy={layout.y(run[0]!.y)} r={2.5} className={chart.dot[line.tone]} />
              ) : (
                <path key={`${line.id}${i}`} d={pathFor(run)} className={chart.line[line.tone]} />
              ),
            ),
          )}
          {activeX !== null && (
            <line x1={activeX} x2={activeX} y1={PAD.top} y2={HEIGHT - PAD.bottom} className={chart.cursor} />
          )}
        </svg>
        {tip && activeX !== null && (
          <div
            className={`${surface.card} ${typography.small} pointer-events-none absolute top-2 z-10 max-w-[70%] p-2 shadow`}
            style={activeX > width / 2 ? { right: width - activeX + 8 } : { left: activeX + 8 }}
            aria-hidden="true"
          >
            <p className="font-medium">{tip.heading}</p>
            {tip.rows.map((r) => (
              <p key={r.label}>
                {r.label}: {r.value}
              </p>
            ))}
          </div>
        )}
        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {tip ? `${tip.heading}. ${tip.rows.map((r) => `${r.label}: ${r.value}`).join(". ")}` : ""}
        </p>
      </div>
      <figcaption className={`${typography.small} ${surface.muted} flex flex-wrap gap-x-4 gap-y-1`}>
        {lines.map((l) => (
          <span key={l.id} className="inline-flex items-center gap-1">
            <span aria-hidden="true" className={chart.swatch[l.tone]} />
            {l.label}
          </span>
        ))}
        {band && (
          <span className="inline-flex items-center gap-1">
            <span aria-hidden="true" className={chart.bandSwatch} />
            {band.label}
          </span>
        )}
        {threshold && (
          <span className="inline-flex items-center gap-1">
            <span aria-hidden="true" className={chart.thresholdSwatch} />
            {threshold.label}
          </span>
        )}
        <span>{strings.chart.keyboardHint}</span>
      </figcaption>
    </figure>
  );
}
