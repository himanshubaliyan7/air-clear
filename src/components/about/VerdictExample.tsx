/**
 * A worked example of the forecast rule, drawn like the lanes on a station's
 * page. The numbers are invented for the explanation and labelled as such:
 * nothing here is a reading, and the verdict words come from the same strings
 * the real verdicts use.
 */
import { VerdictMark, stagger } from "@/components/instrument/primitives";
import { describeRecommendation } from "@/lib/recommendation";
import { lanePercent } from "@/lib/timeline";
import { strings } from "@/i18n/strings";
import { surface, typography } from "@/design/tokens";

const t = strings.about;

/** Invented values on one axis: a threshold, and for each day a range with its 40% point. */
const AXIS_MAX = 160;
const LIMIT = 91;
const START = 80;
const DAYS = [
  { low: 58, expected: 80, high: 122, point: 86, verdict: "go" },
  { low: 55, expected: 80, high: 130, point: 88, verdict: "go" },
  { low: 52, expected: 81, high: 137, point: 90, verdict: "go" },
  { low: 50, expected: 81, high: 144, point: 93, verdict: "caution" },
  { low: 48, expected: 82, high: 150, point: 95, verdict: "caution" },
] as const;

const row = "grid grid-cols-[3.6rem_minmax(0,1fr)_auto] items-center gap-x-4 py-2.5";
const pct = (value: number) => `${lanePercent(value, AXIS_MAX)}%`;

export function VerdictExample() {
  return (
    <div className="grid gap-x-12 gap-y-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <ol className="space-y-5">
        {t.exampleSteps.map((step, index) => (
          <li key={step.title} className="rise-in border-t border-foreground pt-3" style={stagger(index * 3)}>
            <span className={`${typography.eyebrow} ${typography.number}`} aria-hidden="true">
              {String(index + 1).padStart(2, "0")}
            </span>
            <h3 className="mt-1 font-display text-lg font-semibold uppercase leading-tight">
              {step.title}
            </h3>
            <p className={`mt-1 ${typography.small} ${surface.muted} leading-relaxed`}>{step.body}</p>
          </li>
        ))}
      </ol>

      <div className="min-w-0">
        <div className={`${row} !py-0 ${typography.eyebrow}`} aria-hidden="true">
          <span />
          <span className="relative h-9">
            {[0, 40, 80, 120].map((tick) => (
              <span
                key={tick}
                className={`absolute bottom-1 -translate-x-1/2 ${typography.number}`}
                style={{ left: pct(tick) }}
              >
                {tick}
              </span>
            ))}
            <span
              className={`absolute bottom-5 -translate-x-1/2 whitespace-nowrap text-foreground ${typography.number}`}
              style={{ left: pct(LIMIT) }}
            >
              {LIMIT} {t.exampleLimit}
            </span>
          </span>
          <span className="w-[5.5rem] sm:w-[7.5rem]" />
        </div>

        {/* The starting point: one value, no range yet. */}
        <div className={`${row} border-t border-hair`}>
          <span className={typography.micro}>{t.exampleStart}</span>
          <span className="relative h-6" aria-hidden="true">
            <i
              className="absolute -bottom-2.5 -top-2.5 border-l border-dashed border-foreground/60"
              style={{ left: pct(LIMIT) }}
            />
            <i
              className="pop absolute top-1/2 -ml-1.5 -mt-1.5 h-3 w-3 rotate-45 bg-foreground"
              style={{ left: pct(START) }}
            />
          </span>
          <span className={`w-[5.5rem] sm:w-[7.5rem] font-display text-xl font-semibold ${typography.number}`}>{START}</span>
        </div>

        <ul>
          {DAYS.map((day, index) => (
            <li key={index} className={`${row} border-t border-hair`}>
              <span className={typography.micro}>{t.exampleDay(index + 1)}</span>
              <span
                className="relative h-6"
                role="img"
                aria-label={t.exampleLaneLabel(day.low, day.expected, day.high)}
              >
                <i
                  className="absolute -bottom-2.5 -top-2.5 border-l border-dashed border-foreground/60"
                  style={{ left: pct(LIMIT) }}
                />
                <i
                  className="grow-x absolute top-1/2 -mt-px h-0.5 bg-foreground/55"
                  style={{
                    ...stagger(index + 3),
                    left: pct(day.low),
                    width: `${lanePercent(day.high - day.low, AXIS_MAX)}%`,
                  }}
                />
                <i
                  className="pop absolute top-1/2 -ml-1.5 -mt-1.5 h-3 w-3 rotate-45 bg-foreground outline outline-2 outline-background"
                  style={{ ...stagger(index + 3), left: pct(day.expected) }}
                />
                <i
                  className="pop absolute top-1/2 -ml-px -mt-2.5 h-5 w-0.5 bg-foreground"
                  style={{ ...stagger(index + 5), left: pct(day.point) }}
                />
              </span>
              <span className="w-[5.5rem] sm:w-[7.5rem]">
                <VerdictMark view={describeRecommendation(day.verdict)} />
              </span>
            </li>
          ))}
        </ul>
        <p className={`mt-4 ${typography.eyebrow}`}>{t.exampleKey}</p>
        <p className={`mt-1 ${typography.small} ${surface.muted}`}>{t.exampleOverall}</p>
      </div>
    </div>
  );
}
