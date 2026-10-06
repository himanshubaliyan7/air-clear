/**
 * The path from a sensor to a verdict, as a row of framed steps joined by
 * marching dashes, with the checking loop running back underneath. On a narrow
 * screen the steps stack and the connectors run downwards.
 */
import { stagger } from "@/components/instrument/primitives";
import { strings } from "@/i18n/strings";
import { surface, typography } from "@/design/tokens";

const t = strings.about;

export function SystemDiagram() {
  return (
    <div>
      <ol className="flex flex-col xl:flex-row xl:items-stretch">
        {t.pipeline.map((step, index) => (
          <li key={step.title} className="flex min-w-0 flex-col xl:flex-1 xl:flex-row xl:items-center">
            {index > 0 && (
              <>
                <span className="flow-y ml-6 h-6 xl:hidden" aria-hidden="true" />
                <span className="flow-x w-5 max-xl:hidden" aria-hidden="true" />
              </>
            )}
            <div
              className="rise-in flex min-w-0 flex-1 flex-col border border-border p-4 xl:self-stretch"
              style={stagger(index * 2)}
            >
              <span className={`${typography.eyebrow} ${typography.number}`} aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-2 font-display text-lg font-semibold uppercase leading-tight">
                {step.title}
              </h3>
              <p className={`mt-1 ${typography.eyebrow}`}>{step.meta}</p>
              <p className={`mt-2 ${typography.small} ${surface.muted} leading-relaxed`}>
                {step.body}
              </p>
              {step.items.length > 0 && (
                <ul className={`mt-auto space-y-1 border-t border-hair pt-3 ${typography.micro}`}>
                  {step.items.map((item) => (
                    <li key={item} className="mt-3 first:mt-0">
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </li>
        ))}
      </ol>

      {/* The checking loop: it reads every step and reports back, so its dashes run the other way. */}
      <span className="flow-y ml-6 block h-6" aria-hidden="true" />
      <div className="rise-in border border-dashed border-border" style={stagger(12)}>
        <span className="flow-x flow-back block w-full" aria-hidden="true" />
        <div className="grid gap-x-8 gap-y-2 p-4 md:grid-cols-[14rem_minmax(0,1fr)]">
          <div>
            <p className={typography.eyebrow}>{t.checkMeta}</p>
            <h3 className="mt-2 font-display text-lg font-semibold uppercase leading-tight">
              {t.checkTitle}
            </h3>
          </div>
          <p className={`${typography.small} ${surface.muted} leading-relaxed md:pt-1`}>{t.checkBody}</p>
        </div>
      </div>
    </div>
  );
}
