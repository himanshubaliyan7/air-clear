/**
 * Presentation tokens, isolated so a supplied design can replace them without
 * touching any screen. Components reference these names, never raw colours.
 *
 * Colours are the semantic CSS variables of src/styles.css, so light and dark
 * themes need no change here.
 */
import type { RecommendationTone } from "@/lib/recommendation";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

export const surface = {
  page: "bg-background text-foreground",
  card: "rounded-2xl border border-border bg-card text-card-foreground p-4 shadow-xs",
  section: "space-y-4",
  muted: "text-muted-foreground",
} as const;

export const typography = {
  pageTitle: "text-2xl font-semibold tracking-tight sm:text-3xl",
  sectionTitle: "text-lg font-semibold tracking-tight",
  body: "text-sm leading-relaxed",
  small: "text-xs",
  eyebrow: "text-xs font-semibold uppercase tracking-wider text-brand",
  number: "tabular-nums",
} as const;

export const control = {
  button: `inline-flex items-center justify-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 text-sm font-medium shadow-xs transition-colors hover:bg-accent ${focusRing}`,
  buttonPrimary: `inline-flex items-center justify-center gap-1.5 rounded-full bg-brand px-4 py-2 text-sm font-medium text-brand-foreground shadow-xs transition-opacity hover:opacity-90 ${focusRing}`,
  iconButton: `inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-xs transition-colors hover:bg-accent ${focusRing}`,
  input: `w-full rounded-xl border border-input bg-card px-3 py-2 text-sm shadow-xs ${focusRing}`,
  chip: `inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent ${focusRing}`,
  chipActive: `inline-flex items-center gap-1.5 rounded-full border border-foreground bg-foreground px-3 py-1.5 text-xs font-medium text-background ${focusRing}`,
} as const;

/** The page frame shared by every screen. */
export const shell = {
  page: "page-wash min-h-screen bg-background text-foreground",
  header: "sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur",
  headerInner: "mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6",
  brand: `flex min-w-0 items-center gap-2.5 rounded-lg ${focusRing}`,
  brandMark:
    "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand text-brand-foreground shadow-xs",
  brandName: "truncate text-sm font-semibold leading-tight sm:text-base",
  brandTagline: "hidden truncate text-xs text-muted-foreground sm:block",
  nav: "ml-auto flex items-center gap-1 sm:gap-2",
  navLink: `rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground ${focusRing}`,
  navLinkActive: "bg-accent text-foreground",
  main: "mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8",
  mainNarrow: "mx-auto max-w-2xl space-y-4 px-4 py-6 sm:px-6 sm:py-8",
  footer: "mx-auto max-w-6xl border-t border-border px-4 py-6 sm:px-6",
} as const;

/**
 * Tone styling for the outlook recommendation.
 * "unknown" (no-data) is deliberately neutral: never green, never reassuring.
 */
export const recommendationTone: Record<RecommendationTone, string> = {
  positive: "border border-tone-positive/30 bg-tone-positive/10",
  warning: "border border-tone-warning/40 bg-tone-warning/10",
  critical: "border border-tone-critical/30 bg-tone-critical/10",
  unknown: "border border-dashed border-border bg-muted",
};

/** A small pill carrying a verdict's label. The label is always written out. */
export const verdictChip: Record<RecommendationTone, string> = {
  positive: "bg-tone-positive/15 text-foreground ring-1 ring-inset ring-tone-positive/40",
  warning: "bg-tone-warning/20 text-foreground ring-1 ring-inset ring-tone-warning/50",
  critical: "bg-tone-critical/15 text-foreground ring-1 ring-inset ring-tone-critical/40",
  unknown: "bg-muted text-muted-foreground ring-1 ring-inset ring-border",
};

/** The dot inside a verdict pill and the fill of a verdict bar segment. */
export const verdictFill: Record<RecommendationTone, string> = {
  positive: "bg-tone-positive",
  warning: "bg-tone-warning",
  critical: "bg-tone-critical",
  unknown: "bg-muted-foreground/40",
};

/**
 * Chart presentation. Lines are distinguished by dash pattern as well as colour,
 * so nothing relies on colour alone. No series implies "safe".
 */
export const chart = {
  focus: `rounded-md ${focusRing}`,
  grid: "stroke-border",
  tick: "fill-muted-foreground text-[10px]",
  cursor: "stroke-foreground/40",
  band: "fill-brand/15",
  area: "fill-brand/10",
  threshold: "stroke-tone-critical [stroke-dasharray:6_4] stroke-[1.5]",
  line: {
    primary: "fill-none stroke-brand stroke-2 [stroke-linejoin:round] [stroke-linecap:round]",
    secondary: "fill-none stroke-muted-foreground stroke-2 [stroke-dasharray:4_3]",
  },
  dot: {
    primary: "fill-brand",
    secondary: "fill-muted-foreground",
  },
  swatch: {
    primary: "inline-block h-0.5 w-5 bg-brand",
    secondary: "inline-block w-5 border-t-2 border-dashed border-muted-foreground",
  },
  bandSwatch: "inline-block h-3 w-5 bg-brand/15",
  thresholdSwatch: "inline-block w-5 border-t-2 border-dashed border-tone-critical",
} as const;

export const statusTone = {
  neutral: "border border-border bg-muted text-foreground",
  alert: "border border-tone-critical bg-card text-foreground",
} as const;

/** A block that stands in for content while it loads. */
export const skeleton = "animate-pulse rounded-xl bg-muted";

/**
 * The dashboards: a grid of tiles that collapses to one column on a phone.
 */
export const dashboard = {
  grid: "grid grid-cols-1 gap-4 lg:grid-cols-12",
  tile: "rise-in rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-xs sm:p-5",
  hero: "lg:col-span-5",
  outlook: "lg:col-span-7",
  pollutants: "lg:col-span-12",
  history: "lg:col-span-7",
  nearby: "lg:col-span-5",
  map: "lg:col-span-12",
  half: "lg:col-span-6",
  full: "lg:col-span-12",
  tileHeader: "mb-3 flex flex-wrap items-center justify-between gap-2",
  tileTitle: "text-xs font-semibold uppercase tracking-wider text-muted-foreground",

  /* The current reading. */
  heroPanel: "rounded-xl border p-4",
  heroIndex: "text-6xl font-semibold leading-none tracking-tight tabular-nums sm:text-7xl",
  heroValue: "text-xl font-semibold tracking-tight sm:text-2xl",
  scale: "mt-4 flex items-end gap-1",
  scaleSegment: "h-1.5 flex-1 rounded-full opacity-35",
  scaleSegmentActive: "h-3 flex-1 rounded-full ring-2 ring-foreground/70 ring-offset-2 ring-offset-card",
  scaleLabels: "mt-1.5 flex justify-between text-[10px] text-muted-foreground",

  swatch: "inline-block h-3 w-3 shrink-0 rounded-full border border-black/15",
  swatchHollow: "inline-block h-3 w-3 shrink-0 rounded-full border-2 border-dashed bg-transparent",
  badge:
    "inline-flex h-11 min-w-11 shrink-0 items-center justify-center rounded-xl px-2 text-base font-semibold tabular-nums",
  badgeHollow:
    "inline-flex h-11 min-w-11 shrink-0 items-center justify-center rounded-xl border-2 border-dashed px-2 text-xs font-medium text-muted-foreground",
  pill: "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
  pillDot: "h-1.5 w-1.5 shrink-0 rounded-full",

  /* The days of the outlook, laid out like a weather forecast. */
  dayStrip: "grid grid-cols-1 gap-2 sm:grid-cols-5",
  dayCard:
    "flex items-center gap-3 overflow-hidden rounded-xl border border-border bg-background p-3 sm:flex-col sm:items-stretch sm:gap-2",
  dayBar: "h-10 w-1.5 shrink-0 rounded-full sm:h-1.5 sm:w-full",
  dayName: "text-sm font-semibold",
  dayValue: "text-lg font-semibold leading-tight tabular-nums",

  pollutantGrid: "grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7",
  pollutantTile: "rounded-xl border border-border bg-background p-3",
  pollutantValue: "text-2xl font-semibold tabular-nums",
  rangeTrack: "relative mt-2 h-1.5 w-full rounded-full bg-muted",
  rangeFill: "absolute inset-y-0 rounded-full",

  /* Region overview. */
  statGrid: "grid grid-cols-2 gap-3 lg:grid-cols-4",
  stat: "rise-in rounded-2xl border border-border bg-card p-4 shadow-xs",
  statValue: "mt-1 text-3xl font-semibold tracking-tight tabular-nums",
  statIcon: "flex h-8 w-8 items-center justify-center rounded-lg bg-surface text-brand",
  barTrack: "flex h-3 w-full overflow-hidden rounded-full bg-muted",
  barLegend: "mt-3 flex flex-wrap gap-x-4 gap-y-1.5",
  stationGrid: "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3",
  stationCard: `group flex h-full items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-xs transition hover:-translate-y-0.5 hover:border-brand/50 hover:shadow-md ${focusRing}`,

  row: "flex items-center gap-2 rounded-lg px-1.5 py-2 text-sm",
  rowLink: `flex items-center gap-2 rounded-lg px-1.5 py-2 text-sm transition-colors hover:bg-accent ${focusRing}`,
  link: `text-sm font-medium text-brand underline-offset-4 hover:underline ${focusRing}`,
  mapFrame: "relative isolate overflow-hidden rounded-xl border border-border",
  mapCanvas: "h-80 w-full sm:h-[28rem]",
  mapNotice: "p-4 text-sm",
} as const;
