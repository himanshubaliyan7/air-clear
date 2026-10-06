import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { regionsQuery } from "@/api/queries";
import { AppHeader } from "@/components/AppHeader";
import { Lines } from "@/components/instrument/primitives";
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

function AboutPage() {
  return (
    <div className={shell.page}>
      <AppHeader />
      <main className={`${shell.main} !max-w-5xl`}>
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

        <section className="space-y-4" aria-labelledby="signals-heading">
          <h2 id="signals-heading" className={typography.sectionTitle}>
            {t.signalsTitle}
          </h2>
          <ul className={cells}>
            <Signal title={t.nowTitle} body={t.nowBody} />
            <Signal title={t.outlookTitle} body={t.outlookBody} />
            <Signal title={t.noDataTitle} body={t.noDataBody} />
          </ul>
        </section>

        <section className={dashboard.tile} aria-labelledby="pipeline-heading">
          <h2 id="pipeline-heading" className={typography.sectionTitle}>
            {t.pipelineTitle}
          </h2>
          <ol className="mt-5 grid gap-x-6 gap-y-6 sm:grid-cols-5">
            {t.pipeline.map((step, index) => (
              <li key={step.title} className="border-t border-foreground pt-3">
                <span className={`${typography.eyebrow} ${typography.number}`} aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-1 font-display text-lg font-semibold uppercase">{step.title}</h3>
                <p className={`${typography.small} ${surface.muted} mt-1 leading-relaxed`}>
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <section className={dashboard.tile} aria-labelledby="accuracy-heading">
          <h2 id="accuracy-heading" className={typography.sectionTitle}>
            {t.accuracyTitle}
          </h2>
          <p className={`${typography.body} mt-4`}>{t.accuracyBody}</p>
          <RegionAccuracy />
          <p className={`${typography.body} ${surface.muted} mt-2`}>{t.accuracyLimits}</p>
          <Link to="/operator/model-health" className={`${dashboard.link} mt-3 inline-block`}>
            {t.operatorLink}
          </Link>
        </section>

        <div className="grid gap-10 sm:grid-cols-2">
          <section className={dashboard.tile} aria-labelledby="stack-heading">
            <h2 id="stack-heading" className={typography.sectionTitle}>
              {t.stackTitle}
            </h2>
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {t.stack.map((item) => (
                <li key={item} className={`${dashboard.pill} border border-border px-2.5 py-1.5`}>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section className={dashboard.tile} aria-labelledby="source-heading">
            <h2 id="source-heading" className={typography.sectionTitle}>
              {t.sourceTitle}
            </h2>
            <ul className="mt-3 space-y-2">
              {t.sources.map((source) => (
                <li key={source.url}>
                  <a href={source.url} target="_blank" rel="noreferrer" className={dashboard.link}>
                    {source.label}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}
