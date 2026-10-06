/**
 * Measured and forecast on one drawing: a bar for every measured hour, then a
 * block for each forecast day (solid up to the expected mean, hatched up to the
 * upper bound), with the health threshold across both.
 *
 * - A missing hour is an empty slot, never a bar.
 * - A bar's colour is the category the API named for that hour; without one the
 *   bar is plain ink, which says "measured" and nothing about quality.
 * - Forecast days are drawn only from a current outlook.
 * - Keyboard: focus the drawing, then Left/Right step through hours and days.
 */
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import type { AqiCategory, ExceedanceSummary } from "@/api/types";
import { stagger } from "@/components/instrument/primitives";
import { categoryColor, rgbCss } from "@/lib/category-color";
import { niceTicks } from "@/lib/forecast-detail";
import { formatCalendarDate, formatDateTimeInZone, formatNumber } from "@/lib/format-time";
import { describeDayVerdict, isDailyMean } from "@/lib/station-overview";
import { axisMax, formatWeekdayShort, type HourSlot } from "@/lib/timeline";
import { strings } from "@/i18n/strings";
import { chart, typography } from "@/design/tokens";

const HEIGHT = 300;
const PAD = { top: 28, right: 6, bottom: 42, left: 38 };
/** The break between the last measured hour and the first forecast day, in hour widths. */
const GAP = 6;
const DAY = 24;

export interface HourBarsProps {
  slots: readonly HourSlot[];
  /** The station's outlook; its days are drawn only when it is current and daily. */
  outlook: ExceedanceSummary | null;
  categories: readonly AqiCategory[];
  timeZone: string;
  unit: string | null;
  threshold: number | null;
  describeCategory: (id: string | null | undefined) => { label: string } | null;
}

export function HourBars(props: HourBarsProps) {
  const { slots, outlook, categories, timeZone, unit, threshold } = props;
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(720);
  const [active, setActive] = useState<number | null>(null);
  const titleId = useId();
  const patternId = useId();

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver((entries) => {
      const next = entries[0]?.contentRect.width;
      if (next && next > 0) setWidth(Math.round(next));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const days = useMemo(
    () => (outlook && outlook.is_current && isDailyMean(outlook.target) ? outlook.days : []),
    [outlook],
  );

  const layout = useMemo(() => {
    const span = slots.length + (days.length ? GAP + days.length * DAY : 0);
    const inner = Math.max(40, width - PAD.left - PAD.right);
    const unitWidth = inner / Math.max(1, span);
    const max = axisMax([
      ...slots.map((slot) => slot.value),
      ...days.map((day) => day.worst_case_value ?? day.expected_value),
      threshold,
    ]);
    const y = (value: number) => HEIGHT - PAD.bottom - (value / max) * (HEIGHT - PAD.top - PAD.bottom);
    const hourX = (index: number) => PAD.left + index * unitWidth;
    const dayX = (index: number) => PAD.left + (slots.length + GAP + index * DAY) * unitWidth;
    return { unitWidth, max, y, hourX, dayX, ticks: niceTicks(0, max, 3).filter((t) => t <= max) };
  }, [slots, days, threshold, width]);

  const total = slots.length + days.length;
  const wide = width > 700;
  const withUnit = (value: number | null | undefined) =>
    unit ? `${formatNumber(value, { maximumFractionDigits: 0 })} ${unit}` : formatNumber(value, { maximumFractionDigits: 0 });

  const describe = (index: number): string => {
    if (index < slots.length) {
      const slot = slots[index]!;
      const when = formatDateTimeInZone(new Date(slot.time).toISOString(), timeZone) ?? "";
      return slot.value === null
        ? strings.instrument.barsHourEmpty(when)
        : strings.instrument.barsHour(
            when,
            withUnit(slot.value),
            props.describeCategory(slot.category)?.label ?? null,
          );
    }
    const day = days[index - slots.length]!;
    return strings.instrument.barsDay(
      formatCalendarDate(day.date) ?? day.date,
      formatNumber(day.expected_value, { maximumFractionDigits: 0 }),
      withUnit(day.worst_case_value),
      outlook ? (describeDayVerdict(outlook, day)?.label ?? null) : null,
    );
  };

  const onPointer = (clientX: number) => {
    const el = wrapRef.current;
    if (!el || total === 0) return;
    const units = (clientX - el.getBoundingClientRect().left - PAD.left) / layout.unitWidth;
    if (units < slots.length + GAP / 2 || days.length === 0) {
      setActive(Math.max(0, Math.min(slots.length - 1, Math.floor(units))));
    } else {
      const dayIndex = Math.floor((units - slots.length - GAP) / DAY);
      setActive(slots.length + Math.max(0, Math.min(days.length - 1, dayIndex)));
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const current = active ?? -1;
    const move = (index: number) => setActive(Math.max(0, Math.min(total - 1, index)));
    const keys: Record<string, () => void> = {
      ArrowRight: () => move(current + 1),
      ArrowLeft: () => move(current < 0 ? 0 : current - 1),
      Home: () => move(0),
      End: () => move(total - 1),
      Escape: () => setActive(null),
    };
    const run = keys[event.key];
    if (run) {
      event.preventDefault();
      run();
    }
  };

  const base = HEIGHT - PAD.bottom;
  const barWidth = Math.max(1, layout.unitWidth - (layout.unitWidth > 4 ? 1.5 : 0.25));
  const cursor =
    active === null
      ? null
      : active < slots.length
        ? {
            x: layout.hourX(active) + layout.unitWidth / 2,
            y: slots[active]!.value === null ? null : layout.y(slots[active]!.value!),
          }
        : {
            x: layout.dayX(active - slots.length) + (DAY * layout.unitWidth) / 2,
            y: layout.y(days[active - slots.length]!.expected_value ?? 0),
          };
  const nowX = PAD.left + (slots.length + GAP / 2) * layout.unitWidth;
  const measuredCount = slots.filter((slot) => slot.value !== null).length;

  return (
    <figure>
      <p className={`mb-2 min-h-[1.2em] text-right ${typography.micro} ${typography.number}`} aria-live="polite">
        {active === null ? (
          <span className="text-muted-foreground">{strings.instrument.barsHint}</span>
        ) : (
          describe(active)
        )}
      </p>
      <div
        ref={wrapRef}
        role="group"
        aria-roledescription={strings.chart.roleDescription}
        aria-labelledby={titleId}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onFocus={() => active === null && total > 0 && setActive(0)}
        onBlur={() => setActive(null)}
        onPointerMove={(event) => onPointer(event.clientX)}
        onPointerDown={(event) => onPointer(event.clientX)}
        onPointerLeave={() => setActive(null)}
        className={`relative w-full touch-pan-y ${chart.focus}`}
      >
        <svg width={width} height={HEIGHT} role="img" aria-labelledby={titleId} className="block max-w-full">
          <title id={titleId}>
            {strings.instrument.barsSummary(
              measuredCount,
              days.length,
              unit ?? strings.forecastDetail.unitUnknown,
            )}
          </title>
          <defs>
            <pattern id={patternId} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="6" className="stroke-foreground/40" />
            </pattern>
          </defs>
          {layout.ticks.map((tick) => (
            <g key={tick}>
              <line x1={PAD.left} x2={width - PAD.right} y1={layout.y(tick)} y2={layout.y(tick)} className={chart.grid} />
              <text x={PAD.left - 8} y={layout.y(tick) + 3} textAnchor="end" className={chart.tick}>
                {formatNumber(tick)}
              </text>
            </g>
          ))}
          {slots.map((slot, index) =>
            slot.value === null ? null : (
              <rect
                key={slot.time}
                className={`bar-grow ${slot.category ? "" : "fill-foreground"}`}
                style={{
                  ...stagger(index),
                  ...(slot.category ? { fill: rgbCss(categoryColor(slot.category, categories)) } : {}),
                }}
                x={layout.hourX(index) + (layout.unitWidth - barWidth) / 2}
                y={layout.y(slot.value)}
                width={barWidth}
                height={Math.max(0, base - layout.y(slot.value))}
              />
            ),
          )}
          {days.map((day, index) => {
            const x = layout.dayX(index) + 2;
            const w = Math.max(1, DAY * layout.unitWidth - 4);
            const expected = day.expected_value;
            const upper = day.worst_case_value;
            if (expected === null || expected === undefined) return null;
            const fill = rgbCss(categoryColor(day.aqi_category, categories));
            const top = layout.y(Math.max(expected, upper ?? expected));
            return (
              <g key={day.date} className="bar-grow" style={stagger(slots.length + 4 + index * 6)}>
                {upper !== null && upper !== undefined && upper > expected && (
                  <rect x={x} y={top} width={w} height={layout.y(expected) - top} fill={`url(#${patternId})`} className="stroke-border" />
                )}
                <rect x={x} y={layout.y(expected)} width={w} height={base - layout.y(expected)} style={{ fill }} />
                <text x={x + w / 2} y={top - 7} textAnchor="middle" className={`${chart.tick} !fill-foreground`}>
                  {wide && upper !== null && upper !== undefined
                    ? `${formatNumber(expected, { maximumFractionDigits: 0 })} → ${formatNumber(upper, { maximumFractionDigits: 0 })}`
                    : formatNumber(expected, { maximumFractionDigits: 0 })}
                </text>
                <text x={x + w / 2} y={HEIGHT - 24} textAnchor="middle" className={chart.tick}>
                  {wide ? (formatCalendarDate(day.date) ?? day.date) : (formatWeekdayShort(day.date) ?? "")}
                </text>
              </g>
            );
          })}
          {threshold !== null && (
            <>
              <line x1={PAD.left} x2={width - PAD.right} y1={layout.y(threshold)} y2={layout.y(threshold)} className={chart.threshold} />
              <text x={width - PAD.right - 2} y={layout.y(threshold) - 6} textAnchor="end" className={`${chart.tick} !fill-foreground`}>
                {strings.instrument.limit(formatNumber(threshold))}
              </text>
            </>
          )}
          {days.length > 0 && (
            <>
              <line x1={nowX} x2={nowX} y1={PAD.top - 16} y2={base} className="stroke-foreground" />
              <text x={nowX + 7} y={PAD.top - 8} className={`${chart.tick} !fill-foreground`}>
                {strings.instrument.now}
              </text>
              <text x={layout.dayX(0) + (days.length * DAY * layout.unitWidth) / 2} y={HEIGHT - 6} textAnchor="middle" className={chart.tick}>
                {wide ? strings.instrument.barsForecast : strings.instrument.barsForecastShort}
              </text>
            </>
          )}
          <text x={PAD.left + (slots.length * layout.unitWidth) / 2} y={HEIGHT - 6} textAnchor="middle" className={chart.tick}>
            {wide ? strings.instrument.barsMeasured : strings.instrument.barsMeasuredShort}
          </text>
          {cursor && (
            <g>
              <line x1={cursor.x} x2={cursor.x} y1={PAD.top} y2={base} className={chart.cursor} />
              {cursor.y !== null && (
                <>
                  <line x1={PAD.left} x2={width - PAD.right} y1={cursor.y} y2={cursor.y} className="stroke-foreground/50" />
                  <rect x={cursor.x - 3.5} y={cursor.y - 3.5} width={7} height={7} className="fill-background stroke-foreground" strokeWidth={1.5} />
                </>
              )}
            </g>
          )}
        </svg>
      </div>
    </figure>
  );
}
