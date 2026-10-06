/**
 * One hour of the pipeline as a clock face: a mark at each minute a job starts
 * and a hand that keeps turning. The same schedule is written out beside it, so
 * the drawing is never the only place the information lives.
 */
import { strings } from "@/i18n/strings";
import { surface, typography } from "@/design/tokens";

const t = strings.about;
const SIZE = 260;
const CENTER = SIZE / 2;
const RADIUS = 96;

/** A point on the face for a minute, at a distance from the centre. Minute 0 is at the top. */
function at(minute: number, distance: number): { x: number; y: number } {
  const angle = (minute / 60) * Math.PI * 2 - Math.PI / 2;
  return { x: CENTER + Math.cos(angle) * distance, y: CENTER + Math.sin(angle) * distance };
}

export function HourClock() {
  return (
    <div className="grid items-center gap-x-12 gap-y-8 md:grid-cols-[auto_minmax(0,1fr)]">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        role="img"
        aria-label={t.scheduleLabel}
        className="rise-in mx-auto h-auto w-full max-w-[20rem]"
      >
        <circle cx={CENTER} cy={CENTER} r={RADIUS} className="fill-none stroke-border" />
        <circle cx={CENTER} cy={CENTER} r={RADIUS - 34} className="fill-none stroke-hair" />
        {Array.from({ length: 60 }, (_, minute) => {
          const outer = at(minute, RADIUS);
          const inner = at(minute, RADIUS - (minute % 5 === 0 ? 9 : 4));
          return (
            <line
              key={minute}
              x1={outer.x}
              y1={outer.y}
              x2={inner.x}
              y2={inner.y}
              className={minute % 5 === 0 ? "stroke-foreground/60" : "stroke-border"}
            />
          );
        })}
        {t.hourly.map((job) => {
          const mark = at(job.minute, RADIUS);
          const label = at(job.minute, RADIUS + 20);
          return (
            <g key={job.minute}>
              <rect x={mark.x - 5} y={mark.y - 5} width={10} height={10} className="fill-foreground" />
              <text
                x={label.x}
                y={label.y + 3.5}
                textAnchor="middle"
                className="fill-foreground font-mono text-[10px] tracking-[0.08em]"
              >
                {t.minutePast(job.minute)}
              </text>
            </g>
          );
        })}
        <line
          x1={CENTER}
          y1={CENTER}
          x2={CENTER}
          y2={CENTER - RADIUS + 14}
          className="clock-hand stroke-foreground"
          strokeWidth={1.5}
        />
        <rect x={CENTER - 3} y={CENTER - 3} width={6} height={6} className="fill-foreground" />
      </svg>

      <div className="min-w-0">
        <ol>
          {t.hourly.map((job) => (
            <li
              key={job.minute}
              className="grid grid-cols-[3.2rem_minmax(0,1fr)] items-baseline gap-x-4 border-t border-hair py-2.5 first:border-t-0"
            >
              <span className={`font-display text-xl font-semibold ${typography.number}`}>
                {t.minutePast(job.minute)}
              </span>
              <span>
                <span className="block font-display text-base font-semibold uppercase leading-tight">
                  {job.name}
                </span>
                <span className={`block ${typography.eyebrow}`}>{job.note}</span>
              </span>
            </li>
          ))}
        </ol>
        <h3 className={`mt-6 border-b border-border pb-2 ${typography.micro}`}>{t.slowerTitle}</h3>
        <ul>
          {t.slower.map((job) => (
            <li
              key={job.name}
              className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-x-4 border-b border-hair py-2"
            >
              <span className={typography.eyebrow}>{job.when}</span>
              <span className={`${typography.small} ${surface.muted}`}>{job.name}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
