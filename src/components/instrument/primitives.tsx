/**
 * Small pieces every instrument screen shares: headline lines, ruled section
 * headings, square swatches and the verdict mark.
 */
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { RecommendationView } from "@/lib/recommendation";
import { rgbCss, swatchStyle, type Rgb } from "@/lib/category-color";
import { dashboard, surface, typography, verdictChip, verdictFill } from "@/design/tokens";

/** A stagger position for the mount animations in src/styles.css. */
export function stagger(index: number): CSSProperties {
  return { "--i": index } as CSSProperties;
}

/** A headline set as lines that slide up one after another. Later lines are dimmer. */
export function Lines({ lines, className }: { lines: readonly string[]; className?: string }) {
  return (
    <span className={className}>
      {lines.map((line, index) => (
        <span key={`${index}${line}`} className="ln" style={stagger(index)}>
          <span className={index > 0 ? surface.muted : undefined}>{line}</span>
        </span>
      ))}
    </span>
  );
}

/** A section: a small label, an optional note or control, a rule, then the content. */
export function Section({
  title,
  note,
  action,
  className,
  children,
}: {
  title: string;
  note?: ReactNode;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={`${dashboard.tile} ${className ?? ""}`} aria-label={title}>
      <div className={dashboard.tileHeader}>
        <h2 className={dashboard.tileTitle}>{title}</h2>
        {note && <span className={`${typography.micro} ${surface.muted}`}>{note}</span>}
        {action}
      </div>
      {children}
    </section>
  );
}

export function Square({ color, className }: { color: Rgb; className?: string }) {
  return (
    <span
      className={`${dashboard.swatch} ${className ?? ""}`}
      style={swatchStyle(color)}
      aria-hidden="true"
    />
  );
}

/** The mark for "no data": hollow and dashed, never a colour from the scale. */
export function HollowSquare({ color, className }: { color: Rgb; className?: string }) {
  return (
    <span
      className={`${dashboard.swatchHollow} ${className ?? ""}`}
      style={{ borderColor: rgbCss(color) }}
      aria-hidden="true"
    />
  );
}

/** A verdict as a square and its label. The label is written out; colour is never the only signal. */
export function VerdictMark({ view, prefix }: { view: RecommendationView; prefix?: string }) {
  return (
    <span className={`${dashboard.pill} ${verdictChip[view.tone]}`}>
      <span className={`${dashboard.pillDot} ${verdictFill[view.tone]}`} aria-hidden="true" />
      {prefix && <span className="sr-only">{prefix}: </span>}
      {view.label}
    </span>
  );
}

function prefersReducedMotion(): boolean {
  return (
    typeof window === "undefined" ||
    typeof window.matchMedia !== "function" ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * A number that counts from the value shown before to the new one. The server
 * and the first client render show the final value; reduced motion never counts.
 */
export function useCountUp(target: number, durationMs = 900): number {
  const [shown, setShown] = useState(target);
  const from = useRef(target);
  const mounted = useRef(false);

  useEffect(() => {
    const start = mounted.current ? from.current : 0;
    mounted.current = true;
    from.current = target;
    if (prefersReducedMotion() || start === target) {
      setShown(target);
      return;
    }
    let frame = 0;
    const t0 = performance.now();
    const step = (now: number) => {
      const progress = Math.min(1, (now - t0) / durationMs);
      const eased = 1 - (1 - progress) ** 4;
      setShown(Math.round(start + (target - start) * eased));
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs]);

  return shown;
}

export { prefersReducedMotion };
