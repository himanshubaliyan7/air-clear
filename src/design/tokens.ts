/**
 * Presentation tokens, isolated so a supplied design can replace them without
 * touching any screen. Components reference these names, never raw colours.
 *
 * Until brand material arrives these are plain, high-contrast defaults built on the
 * existing semantic CSS variables (see src/styles.css).
 */
import type { RecommendationTone } from "@/lib/recommendation";

export const surface = {
  page: "bg-background text-foreground",
  card: "rounded-lg border border-border bg-card text-card-foreground p-4",
  section: "space-y-3",
  muted: "text-muted-foreground",
} as const;

export const typography = {
  pageTitle: "text-2xl font-semibold tracking-tight",
  sectionTitle: "text-lg font-semibold",
  body: "text-sm leading-relaxed",
  small: "text-xs",
} as const;

export const control = {
  button:
    "inline-flex items-center justify-center rounded-md border border-border bg-background px-3 py-2 text-sm font-medium transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
  input:
    "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
} as const;

/**
 * Tone styling for the outlook recommendation.
 * "unknown" (no-data) is deliberately neutral: never green, never reassuring.
 */
export const recommendationTone: Record<RecommendationTone, string> = {
  positive: "border-l-4 border-l-[--color-chart-2] bg-card",
  warning: "border-l-4 border-l-[--color-chart-5] bg-card",
  critical: "border-l-4 border-l-destructive bg-card",
  unknown: "border-l-4 border-l-muted-foreground bg-muted",
};

/**
 * Chart presentation. Lines are distinguished by dash pattern as well as colour,
 * so nothing relies on colour alone. No series implies "safe".
 */
export const chart = {
  focus:
    "rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
  grid: "stroke-border",
  tick: "fill-muted-foreground text-[10px]",
  cursor: "stroke-foreground/40",
  band: "fill-foreground/10",
  threshold: "stroke-destructive [stroke-dasharray:6_4] stroke-[1.5]",
  line: {
    primary: "fill-none stroke-foreground stroke-2",
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
  bandSwatch: "inline-block h-3 w-5 bg-foreground/10",
  thresholdSwatch: "inline-block w-5 border-t-2 border-dashed border-destructive",
} as const;

export const statusTone = {
  neutral: "border border-border bg-muted text-foreground",
  alert: "border border-destructive bg-card text-foreground",
} as const;

/**
 * The station dashboard: a grid of tiles that collapses to one column on a phone.
 */
export const dashboard = {
  grid: "grid grid-cols-1 gap-4 md:grid-cols-12",
  tile: "rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm",
  hero: "md:col-span-7",
  outlook: "md:col-span-5 md:row-span-2",
  pollutants: "md:col-span-7",
  history: "md:col-span-7",
  nearby: "md:col-span-5",
  map: "md:col-span-12",
  tileHeader: "mb-3 flex flex-wrap items-center justify-between gap-2",
  tileTitle: "text-xs font-semibold uppercase tracking-wide text-muted-foreground",
  heroBar: "mb-3 h-2 w-full rounded-full",
  heroValue: "text-3xl font-semibold tracking-tight sm:text-4xl",
  swatch: "inline-block h-3 w-3 shrink-0 rounded-full border border-black/20",
  swatchHollow: "inline-block h-3 w-3 shrink-0 rounded-full border-2 border-dashed bg-transparent",
  pollutantGrid: "grid grid-cols-2 gap-2 sm:grid-cols-4",
  pollutantTile: "rounded-lg border border-border bg-background p-2",
  pollutantValue: "text-xl font-semibold",
  row: "flex items-center gap-2 rounded-md px-1 py-1.5 text-sm",
  rowLink:
    "flex items-center gap-2 rounded-md px-1 py-1.5 text-sm transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
  link: "text-sm underline underline-offset-2 hover:text-foreground/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
  mapFrame: "relative isolate overflow-hidden rounded-lg border border-border",
  mapCanvas: "h-80 w-full sm:h-96",
  mapNotice: "p-4 text-sm",
} as const;
