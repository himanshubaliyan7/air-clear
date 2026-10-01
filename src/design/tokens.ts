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
 * The globe view. Its controls sit on top of dark satellite imagery, so they use
 * their own dark, translucent surfaces instead of the page tokens.
 */
export const globe = {
  page: "relative h-[100dvh] w-full overflow-hidden bg-black text-white",
  stage: "absolute inset-0",
  canvas: "h-full w-full",
  notice:
    "absolute inset-x-4 top-1/2 -translate-y-1/2 rounded-lg bg-black/70 p-4 text-center text-sm",
  chrome: "rounded-lg border border-white/15 bg-black/70 p-3 text-white backdrop-blur",
  muted: "text-white/65",
  label: "text-xs font-semibold uppercase tracking-wide text-white/65",
  header: "absolute left-3 top-3 max-w-[calc(100%-4.5rem)] sm:max-w-sm",
  controls: "absolute right-3 top-3 flex flex-col gap-1",
  controlButton:
    "h-9 w-9 rounded-md border border-white/20 bg-black/70 text-lg leading-none text-white backdrop-blur transition-colors hover:bg-black/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
  timeline:
    "absolute inset-x-3 bottom-10 sm:inset-x-auto sm:left-1/2 sm:w-[36rem] sm:max-w-[calc(100%-1.5rem)] sm:-translate-x-1/2",
  stepButton:
    "min-w-9 rounded-md border border-white/20 px-2 py-1 text-xs font-medium transition-colors hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
  stepButtonActive: "border-white bg-white text-black hover:bg-white",
  textButton:
    "rounded-sm text-sm underline underline-offset-2 hover:text-white/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
  panel:
    "absolute inset-x-0 bottom-0 z-10 max-h-[62dvh] overflow-y-auto rounded-b-none sm:inset-x-auto sm:bottom-auto sm:right-14 sm:top-3 sm:max-h-[calc(100dvh-1.5rem)] sm:w-80 sm:rounded-b-lg",
  swatch: "inline-block h-3 w-3 shrink-0 rounded-full border border-white/50",
  swatchHollow: "inline-block h-3 w-3 shrink-0 rounded-full border-2 bg-black/40",
  dayRow: "flex items-center gap-2 rounded-md px-1 py-0.5 text-sm",
  dayRowShown: "bg-white/15",
} as const;
