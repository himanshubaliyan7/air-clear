# Design Tokens

Token reference for **Air Clear**. Use utility classes and CSS variables — never raw values.

## Colors

Apply with any color utility: `bg-<name>`, `text-<name>`, `border-<name>`, `ring-<name>`, `divide-<name>`, etc.

| Name | CSS variable |
|---|---|
| `surface.card` | `surface.card` |
| `surface.muted` | `surface.muted` |
| `chart.focus` | `chart.focus` |
| `chart.grid` | `chart.grid` |
| `chart.tick` | `chart.tick` |
| `chart.cursor` | `chart.cursor` |
| `chart.band` | `chart.band` |
| `chart.threshold` | `chart.threshold` |
| `chart.bandSwatch` | `chart.bandSwatch` |
| `chart.thresholdSwatch` | `chart.thresholdSwatch` |

## Typography

Typography classes (`font-*` for families, `text-*` for sizes):

| Class | CSS variable |
|---|---|
| — | `typography.body` |

## Other

Reference via `var(--name)` in inline styles or CSS.

| CSS variable |
|---|
| `surface.page` |
| `surface.section` |
| `typography.pageTitle` |
| `typography.sectionTitle` |
| `typography.small` |
| `control.button` |
| `control.input` |
| `recommendationTone.positive` |
| `recommendationTone.warning` |
| `recommendationTone.critical` |
| `recommendationTone.unknown` |
| `statusTone.neutral` |
| `statusTone.alert` |

