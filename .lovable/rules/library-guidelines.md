# Air Clear — Guidelines

## Components

The design system exports these components — import them from `@ws-ed9eed168582a2e366e4/a1f3ffc5-e558-4b94-9ebd-516a4db7ade1` and compose them before building anything from scratch:

`ApiError`, `Attribution`, `AttributionsFooter`, `AvailabilityMarker`, `EmptyState`, `ErrorState`, `LoadingState`, `RegionProvider`, `TimeChart`

Per-component details (import stanzas, props, variants, examples) live in `.lovable/rules/libraries/{slug}/components.md` — on disk, not auto-loaded. Read that file or the component source when the name alone isn't enough.

## Theme Files

The design system's theme is delivered through the following files. The author's original source files carry the full wiring the design system needs — variable declarations, framework-specific directives, provider objects, etc. — and are the canonical import target.

- `@ws-ed9eed168582a2e366e4/a1f3ffc5-e558-4b94-9ebd-516a4db7ade1/design/tokens` (source — preferred import)

