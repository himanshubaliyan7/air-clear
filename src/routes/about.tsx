import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CalendarDays, Gauge, ShieldQuestion } from "lucide-react";
import type { ReactNode } from "react";
import { AppHeader } from "@/components/AppHeader";
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

function Signal({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <li className={dashboard.stat}>
      <span className={dashboard.statIcon} aria-hidden="true">
        {icon}
      </span>
      <h3 className="mt-3 text-sm font-semibold">{title}</h3>
      <p className={`${typography.body} ${surface.muted} mt-1`}>{body}</p>
    </li>
  );
}

function AboutPage() {
  return (
    <div className={shell.page}>
      <AppHeader />
      <main className={`${shell.main} max-w-4xl`}>
        <header className="space-y-3">
          <p className={typography.eyebrow}>{strings.app.navAbout}</p>
          <h1 className={typography.pageTitle}>{t.title}</h1>
          <p className={`${typography.body} ${surface.muted} max-w-2xl text-base`}>{t.intro}</p>
          <Link to="/" className={control.buttonPrimary}>
            {t.backHome}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </header>

        <section className="space-y-3" aria-labelledby="signals-heading">
          <h2 id="signals-heading" className={typography.sectionTitle}>
            {t.signalsTitle}
          </h2>
          <ul className="grid gap-3 sm:grid-cols-3">
            <Signal icon={<Gauge className="h-4 w-4" />} title={t.nowTitle} body={t.nowBody} />
            <Signal
              icon={<CalendarDays className="h-4 w-4" />}
              title={t.outlookTitle}
              body={t.outlookBody}
            />
            <Signal
              icon={<ShieldQuestion className="h-4 w-4" />}
              title={t.noDataTitle}
              body={t.noDataBody}
            />
          </ul>
        </section>

        <section className={dashboard.tile} aria-labelledby="pipeline-heading">
          <h2 id="pipeline-heading" className={typography.sectionTitle}>
            {t.pipelineTitle}
          </h2>
          <ol className="mt-4 grid gap-4 sm:grid-cols-5">
            {t.pipeline.map((step, index) => (
              <li key={step.title} className="relative">
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full bg-brand text-xs font-semibold text-brand-foreground ${typography.number}`}
                  aria-hidden="true"
                >
                  {index + 1}
                </span>
                <h3 className="mt-2 text-sm font-semibold">{step.title}</h3>
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
          <dl className="mt-4 grid gap-3 sm:grid-cols-3">
            {t.accuracyStats.map((stat) => (
              <div key={stat.label} className={dashboard.pollutantTile}>
                <dd className={dashboard.statValue}>{stat.value}</dd>
                <dt className={`${typography.small} ${surface.muted}`}>{stat.label}</dt>
              </div>
            ))}
          </dl>
          <p className={`${typography.body} mt-4`}>{t.accuracyBody}</p>
          <p className={`${typography.body} ${surface.muted} mt-2`}>{t.accuracyLimits}</p>
          <Link to="/operator/model-health" className={`${dashboard.link} mt-3 inline-block`}>
            {t.operatorLink}
          </Link>
        </section>

        <div className="grid gap-4 sm:grid-cols-2">
          <section className={dashboard.tile} aria-labelledby="stack-heading">
            <h2 id="stack-heading" className={typography.sectionTitle}>
              {t.stackTitle}
            </h2>
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {t.stack.map((item) => (
                <li key={item} className={`${dashboard.pill} bg-surface`}>
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
