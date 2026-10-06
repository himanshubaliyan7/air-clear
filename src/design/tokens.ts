/**
 * Presentation tokens, isolated so a supplied design can replace them without
 * touching any screen. Components reference these names, never raw colours.
 *
 * The look is an instrument log: hairline frames, square corners, large
 * uppercase headlines, small monospace labels, and no accent hue. Colours are
 * the semantic CSS variables of src/styles.css, so light and dark themes need
 * no change here.
 */
import type { RecommendationTone } from "@/lib/recommendation";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

/** The small monospace label used for every caption, axis and control. */
const micro = "font-mono text-[0.66rem] font-medium uppercase leading-normal tracking-[0.12em]";

export const surface = {
  page: "bg-background text-foreground",
  card: "border border-border bg-card text-card-foreground p-4",
  section: "space-y-4",
  muted: "text-muted-foreground",
  /** A dashed box for "nothing to show here". */
  empty: "border border-dashed border-border p-5",
} as const;

export const typography = {
  pageTitle:
    "font-display text-4xl font-semibold uppercase leading-[0.9] tracking-tight [overflow-wrap:anywhere] sm:text-6xl",
  /** The headline of the two dashboards. */
  mega: "font-display text-[clamp(2.75rem,9.5vw,9rem)] font-semibold uppercase leading-[0.84] tracking-[-0.02em] [overflow-wrap:anywhere]",
  /** A station's name: the same headline, sized for longer text. */
  megaName: "font-display text-[clamp(2.25rem,6vw,6rem)] font-semibold uppercase leading-[0.86] tracking-[-0.02em] [overflow-wrap:anywhere]",
  sectionTitle: "font-display text-xl font-semibold uppercase leading-tight tracking-tight",
  lead: "max-w-[54ch] text-[clamp(1rem,1.35vw,1.3rem)] leading-snug",
  body: "text-[0.95rem] leading-relaxed",
  small: "text-xs",
  micro,
  eyebrow: `${micro} text-muted-foreground`,
  number: "tabular-nums",
} as const;

const buttonBase = `inline-flex items-center justify-center gap-2 border px-3.5 py-2 ${micro} transition-colors ${focusRing}`;

export const control = {
  button: `${buttonBase} border-border hover:border-foreground hover:bg-foreground hover:text-background`,
  buttonPrimary: `${buttonBase} border-foreground bg-foreground text-background hover:bg-transparent hover:text-foreground`,
  iconButton: `inline-flex h-9 w-9 items-center justify-center border border-border text-foreground transition-colors hover:border-foreground hover:bg-foreground hover:text-background ${focusRing}`,
  input: `w-full rounded-none border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground ${focusRing}`,
  /** A native select drawn as a mono label; the chevron is laid over it by its wrapper. */
  select: `w-full min-w-0 appearance-none truncate rounded-none border border-border bg-background py-2 pl-3 pr-8 text-foreground transition-colors hover:border-foreground ${micro} ${focusRing}`,
  chip: `inline-flex items-center gap-2 border border-border px-3 py-1.5 ${micro} transition-colors hover:border-foreground ${focusRing}`,
  chipActive: `inline-flex items-center gap-2 border border-foreground bg-foreground px-3 py-1.5 text-background ${micro} ${focusRing}`,
} as const;

/** The page frame shared by every screen. */
export const shell = {
  page: "grain min-h-screen bg-background pb-14 text-foreground",
  header: "sticky top-0 z-30 border-b border-hair bg-background",
  headerInner: "mx-auto flex w-full max-w-[115rem] flex-wrap items-center gap-x-8 gap-y-2 px-4 py-3.5 sm:px-8 lg:px-12",
  brand: `mr-auto flex min-w-0 items-baseline gap-4 ${focusRing}`,
  brandMark: "hidden",
  brandName: "whitespace-nowrap font-display text-[0.8rem] font-semibold uppercase tracking-[0.34em]",
  brandTagline: `hidden truncate text-muted-foreground lg:block ${micro}`,
  nav: "flex items-center gap-2 sm:gap-6",
  navLink: `relative py-2 text-muted-foreground transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-left after:scale-x-0 after:bg-foreground after:transition-transform after:duration-300 hover:text-foreground ${micro} ${focusRing}`,
  navLinkActive: "!text-foreground after:!scale-x-100",
  navWide: "hidden items-center gap-6 sm:flex",
  navPhone: "mx-auto flex w-full justify-between gap-2 px-4 pb-2 sm:hidden",
  navPhoneLink: `relative py-2 text-muted-foreground after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-left after:scale-x-0 after:bg-foreground after:transition-transform after:duration-300 ${micro} ${focusRing}`,
  main: "relative mx-auto w-full max-w-[115rem] space-y-8 px-4 py-8 sm:space-y-12 sm:px-8 sm:py-12 lg:px-12",
  mainNarrow: "relative mx-auto max-w-2xl space-y-6 px-4 py-8 sm:px-8 sm:py-12",
  footer: "mx-auto w-full max-w-[115rem] border-t border-hair px-4 py-8 sm:px-8 lg:px-12",
  /** The strip fixed to the foot of the window: what is live, and how fresh. */
  status: `fixed inset-x-0 bottom-0 z-30 flex items-center gap-x-6 overflow-hidden whitespace-nowrap border-t border-hair bg-background px-4 py-3 text-muted-foreground sm:px-8 lg:px-12 ${micro}`,
  statusValue: "text-foreground",
  liveDot: "blink mr-2 inline-block h-[0.45rem] w-[0.45rem] bg-foreground align-[0.02rem]",
} as const;

/**
 * Tone styling for the outlook recommendation.
 * "unknown" (no-data) is deliberately neutral: never green, never reassuring.
 */
export const recommendationTone: Record<RecommendationTone, string> = {
  positive: "border border-tone-positive/50 bg-tone-positive/10",
  warning: "border border-tone-warning/55 bg-tone-warning/10",
  critical: "border border-tone-critical/50 bg-tone-critical/10",
  unknown: "hatch border border-dashed border-border",
};

/** A small mark carrying a verdict's label. The label is always written out. */
export const verdictChip: Record<RecommendationTone, string> = {
  positive: "text-foreground",
  warning: "text-foreground",
  critical: "text-foreground",
  unknown: "text-muted-foreground",
};

/** The square beside a verdict's label and the fill of a verdict bar segment. */
export const verdictFill: Record<RecommendationTone, string> = {
  positive: "bg-tone-positive",
  warning: "bg-tone-warning",
  critical: "bg-tone-critical",
  unknown: "hatch outline outline-1 -outline-offset-1 outline-dashed outline-border",
};

/** The same tones as a text colour, for marks drawn in SVG or as borders. */
export const verdictText: Record<RecommendationTone, string> = {
  positive: "text-tone-positive",
  warning: "text-tone-warning",
  critical: "text-tone-critical",
  unknown: "text-muted-foreground",
};

/**
 * Chart presentation. Lines are distinguished by dash pattern as well as colour,
 * so nothing relies on colour alone. No series implies "safe".
 */
export const chart = {
  focus: focusRing,
  grid: "stroke-hair",
  tick: "fill-muted-foreground font-mono text-[10px] uppercase tracking-[0.1em]",
  cursor: "stroke-foreground",
  band: "fill-foreground/12",
  area: "fill-foreground/8",
  threshold: "stroke-foreground/75 [stroke-dasharray:5_4]",
  line: {
    primary: "fill-none stroke-foreground stroke-2 [stroke-linejoin:round] [stroke-linecap:round]",
    secondary: "fill-none stroke-muted-foreground stroke-2 [stroke-dasharray:4_3]",
  },
  dot: {
    primary: "fill-foreground",
    secondary: "fill-muted-foreground",
  },
  swatch: {
    primary: "inline-block h-0.5 w-5 bg-foreground",
    secondary: "inline-block w-5 border-t-2 border-dashed border-muted-foreground",
  },
  bandSwatch: "inline-block h-3 w-5 bg-foreground/12",
  thresholdSwatch: "inline-block w-5 border-t border-dashed border-foreground",
} as const;

export const statusTone = {
  neutral: "border border-border bg-muted text-foreground",
  alert: "border border-tone-critical bg-card text-foreground",
} as const;

/** A block that stands in for content while it loads. */
export const skeleton = "animate-pulse bg-muted";

/**
 * The dashboards. Sections sit on the page with a ruled heading; a frame is
 * drawn only around a plot or a group of cells.
 */
export const dashboard = {
  /** The vertical rhythm between the sections of a dashboard. */
  stack: "space-y-10 sm:space-y-14",
  grid: "grid grid-cols-1 gap-x-10 gap-y-10 lg:grid-cols-12",
  tile: "rise-in min-w-0",
  half: "lg:col-span-6",
  full: "lg:col-span-12",
  /** A section heading: a label on the left, a note on the right, a rule below. */
  tileHeader: "mb-4 flex flex-wrap items-center justify-between gap-x-5 gap-y-1 border-b border-border pb-2.5",
  tileTitle: micro,

  swatch: "inline-block h-2.5 w-2.5 shrink-0",
  swatchHollow: "inline-block h-2.5 w-2.5 shrink-0 border border-dashed bg-transparent",
  pill: `inline-flex items-center gap-2 ${micro}`,
  pillDot: "h-2.5 w-2.5 shrink-0",

  /* Region overview. */
  statGrid: "rise-in grid grid-cols-2 border border-border lg:grid-cols-4",
  stat: "border-b border-r border-border p-4 transition-colors hover:bg-foreground hover:text-background sm:p-5 [&:nth-child(2n)]:border-r-0 [&:nth-last-child(-n+2)]:border-b-0 lg:border-b-0 lg:[&:nth-child(2n)]:border-r lg:last:!border-r-0",
  statValue: "my-1 font-display text-[clamp(2.4rem,5vw,4.4rem)] font-semibold leading-[0.95] tracking-[-0.02em] tabular-nums",
  statIcon: "hidden",
  barTrack: "flex h-9 w-full gap-0.5",
  barLegend: `mt-3 flex flex-wrap gap-x-6 gap-y-1.5 text-muted-foreground ${micro}`,

  row: "flex items-center gap-3 border-t border-hair px-1.5 py-2.5 text-sm",
  rowLink: `flex items-center gap-3 border-t border-hair px-1.5 py-2.5 text-sm transition-[background-color,padding] duration-200 hover:bg-muted hover:pl-4 ${focusRing}`,
  link: `border-b border-foreground/40 pb-0.5 transition-colors hover:border-foreground ${micro} ${focusRing}`,
  /* Home page: one ruled row per region. */
  regionList: "border-b border-hair",
  regionRow: `group grid items-center gap-x-10 gap-y-5 border-t border-hair px-1.5 py-7 transition-[background-color,padding] duration-200 hover:bg-muted hover:pl-4 sm:py-9 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_auto] ${focusRing}`,
  regionName: "font-display text-[clamp(2.4rem,6vw,5.5rem)] font-semibold uppercase leading-[0.88] tracking-[-0.02em] [overflow-wrap:anywhere]",
  mapFrame: "relative isolate overflow-hidden border border-border",
  mapCanvas: "h-80 w-full sm:h-[28rem]",
  mapNotice: "p-4 text-sm",
} as const;
