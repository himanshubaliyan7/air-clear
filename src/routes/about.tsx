import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { regionsQuery } from "@/api/queries";
import { AppHeader } from "@/components/AppHeader";
import { HourClock } from "@/components/about/HourClock";
import { SystemDiagram } from "@/components/about/SystemDiagram";
import { VerdictExample } from "@/components/about/VerdictExample";
import { Lines, stagger } from "@/components/instrument/primitives";
import { regionAccuracy } from "@/lib/regions";
import { headlineLines } from "@/lib/timeline";
import { strings } from "@/i18n/strings";
import { control, dashboard, shell, surface, typography } from "@/design/tokens";

const t = strings.about;

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: `${t.title} — ${strings.app.name}` },
      { name: "description", content: t.intro },
      { property: "og:title", content: `${t.title} — ${strings.app.name}` },
      { property: "og:description", content: t.intro },
      { property: "og:type", content: "article" },
    ],
  }),
  component: AboutPage,
});

const cells = "rise-in grid border border-border sm:grid-cols-3";
const cell = "border-b border-border p-5 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0";

/** A chapter of the page: a ruled heading with an optional sentence, then the content. */
function Chapter({
  id,
  title,
  intro,
  children,
}: {
  id: string;
  title: string;
  intro?: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={`${id}-heading`}>
      <div className="mb-6 grid gap-x-10 gap-y-2 border-b border-border pb-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-end">
        <h2 id={`${id}-heading`} className={typography.sectionTitle}>
          {title}
        </h2>
        {intro && <p className={`${typography.small} ${surface.muted} md:text-right`}>{intro}</p>}
      </div>
      {children}
    </section>
  );
}

function Signal({ title, body }: { title: string; body: string }) {
  return (
    <li className={cell}>
      <h3 className={typography.sectionTitle}>{title}</h3>
      <p className={`${typography.body} ${surface.muted} mt-2`}>{body}</p>
    </li>
  );
}

/** One row of figures per region the service has backtested, labelled by the API's name. */
function RegionAccuracy() {
  const { data } = useQuery(regionsQuery());
  const rows = (data ?? []).flatMap((region) => {
    const accuracy = regionAccuracy(region.backtest);
    return accuracy ? [{ region, accuracy }] : [];
  });
  if (data && rows.length === 0) {
    return <p className={`${typography.body} ${surface.muted} mt-5`}>{t.accuracyNone}</p>;
  }
  return (
    <div className="mt-5 space-y-6">
      {rows.map(({ region, accuracy }) => (
        <div key={region.id}>
          <div className={dashboard.tileHeader}>
            <h3 className={dashboard.tileTitle}>{region.name}</h3>
            <p className={typography.eyebrow}>{t.accuracyPeriod(accuracy.period)}</p>
          </div>
          <dl className={cells}>
            {accuracy.figures.map((figure) => (
              <div key={figure.key} className={cell}>
                <dd className={dashboard.statValue}>{figure.value}</dd>
                <dt className={typography.eyebrow}>{t.accuracyLabels[figure.key]}</dt>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  );
}

/** Each condition on the left runs into the same neutral, hatched answer on the right. */
function SafetyRules() {
  return (
    <ul>
      {t.safety.map((rule, index) => (
        <li
          key={rule.when}
          className="rise-in grid items-center gap-x-4 gap-y-2 border-t border-hair py-3 first:border-t-0 md:grid-cols-[minmax(0,1fr)_minmax(2rem,6rem)_minmax(0,1fr)]"
          style={stagger(index)}
        >
          <span className={typography.body}>{rule.when}</span>
          <span className="flow-x max-md:hidden" aria-hidden="true" />
          <span className={`hatch border border-dashed border-border px-3 py-2 ${typography.micro}`}>
            {rule.then}
          </span>
        </li>
      ))}
    </ul>
  );
}

function FieldNotes() {
  return (
    <ul className="rise-in grid border border-border md:grid-cols-2">
      {t.notes.map((note) => (
        <li
          key={note.figure}
          className="border-b border-border p-5 last:border-b-0 md:[&:nth-child(odd)]:border-r md:[&:nth-last-child(-n+2)]:border-b-0"
        >
          <p
            className={`font-display text-[clamp(2rem,4.4vw,3.6rem)] font-semibold leading-none tracking-[-0.02em] ${typography.number}`}
          >
            {note.figure}
          </p>
          <p className={`mt-2 normal-case ${typography.eyebrow}`}>{note.unit}</p>
          <p className={`mt-3 ${typography.small} ${surface.muted} leading-relaxed`}>{note.body}</p>
        </li>
      ))}
    </ul>
  );
}

function AboutPage() {
  return (
    <div className={shell.page}>
      <AppHeader />
      <main className={`${shell.main} !max-w-7xl`}>
        <header className="space-y-5">
          <p className={`rise-in ${typography.eyebrow}`}>{strings.app.navAbout}</p>
          <h1 className={typography.mega}>
            <Lines lines={headlineLines(t.title)} />
          </h1>
          <p className={`rise-in ${typography.lead}`}>{t.intro}</p>
          <Link to="/" className={control.buttonPrimary}>
            {t.backHome}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </header>

        <Chapter id="signals" title={t.signalsTitle}>
          <ul className={cells}>
            <Signal title={t.nowTitle} body={t.nowBody} />
            <Signal title={t.outlookTitle} body={t.outlookBody} />
            <Signal title={t.noDataTitle} body={t.noDataBody} />
          </ul>
        </Chapter>

        <Chapter id="pipeline" title={t.pipelineTitle} intro={t.pipelineIntro}>
          <SystemDiagram />
        </Chapter>

        <Chapter id="schedule" title={t.scheduleTitle} intro={t.scheduleIntro}>
          <HourClock />
        </Chapter>

        <Chapter id="example" title={t.exampleTitle} intro={t.exampleIntro}>
          <VerdictExample />
        </Chapter>

        <Chapter id="safety" title={t.safetyTitle} intro={t.safetyIntro}>
          <SafetyRules />
        </Chapter>

        <Chapter id="accuracy" title={t.accuracyTitle}>
          <p className={`${typography.body} max-w-[70ch]`}>{t.accuracyBody}</p>
          <RegionAccuracy />
          <p className={`${typography.body} ${surface.muted} mt-4 max-w-[70ch]`}>{t.accuracyLimits}</p>
          <Link to="/operator/model-health" className={`${dashboard.link} mt-3 inline-block`}>
            {t.operatorLink}
          </Link>
        </Chapter>

        <Chapter id="notes" title={t.notesTitle} intro={t.notesIntro}>
          <FieldNotes />
        </Chapter>

        <div className="grid gap-10 sm:grid-cols-2">
          <Chapter id="stack" title={t.stackTitle}>
            <ul className="flex flex-wrap gap-1.5">
              {t.stack.map((item) => (
                <li key={item} className={`${dashboard.pill} border border-border px-2.5 py-1.5`}>
                  {item}
                </li>
              ))}
            </ul>
          </Chapter>

          <Chapter id="source" title={t.sourceTitle}>
            <ul className="space-y-2">
              {t.sources.map((source) => (
                <li key={source.url}>
                  <a href={source.url} target="_blank" rel="noreferrer" className={dashboard.link}>
                    {source.label}
                  </a>
                </li>
              ))}
            </ul>
          </Chapter>
        </div>
      </main>
    </div>
  );
}
