---
name: App visual language
description: Primitives, utilities, and composition rules the app actually ships. Mirror these for landing parity.
type: design
---
What the authenticated app looks like in shipped code. The landing page should mirror this list, not invent parallel patterns.

## Promoted-surface primitives (`src/components/ui/`)

All four take a `tier: "destructive" | "warning" | "success" | "neutral"` and resolve to semantic tokens — no raw colors.

- **`SignalCard`** — the page's single "hero" tile. One per page, top of the surface. Used for promoted KPIs (Credit at Risk, expiring schemes, behind-pace salespeople, dispatch breaches, etc.). Composition: tier strip + label + hero number + sub-caption + optional inline action.
- **`KpiStrip`** — 4-cell horizontal strip below the hero. Each cell: label, big number (`.num`), optional `InsightLine`. Hides cells RBAC-conditionally (e.g. value hidden from accountants on Stock).
- **`InsightLine`** — small delta/context line under a KPI (`▲ 12% vs Apr`, `2 over limit`). Three tones: `up` (success), `down` (destructive), `flat` (muted).
- **`StatusBadge`** — pill for order/payment/dispatch state. Uses `.status-*` utilities.

**Composition rule**: at most one `SignalCard` per page, always at the top of the main column. `KpiStrip` sits directly below. Everything else is calm.

## CSS utilities (`src/index.css`)

| Utility            | What it does                                                                          |
| ------------------ | ------------------------------------------------------------------------------------- |
| `.h1-display`      | Playfair, 28px / md:34px, weight 500, tight tracking. Page H1.                        |
| `.h2-display`      | Playfair, 22px, weight 500. Section H2.                                               |
| `.h1-subtitle`     | 13px muted, sits under `.h1-display`.                                                 |
| `.num`             | Tabular numerals + `tnum lnum` — KPIs, money, tables, clocks.                         |
| `.text-link`       | Subtle inline action link (underline on `border`, hover lifts to `foreground`).       |
| `.icon-nav` / `-inline` / `-signal` | Three icon weight tiers: 16/14/20px with stroke 1.5/1.75/2.        |
| `.insight-line` + `.insight-up/-down/-flat` | Small delta line under a KPI.                                |
| `.timeframe-pill`  | Filter chip: uppercase, tracked, muted bg.                                            |
| `.section-divider` | Hairline gradient divider.                                                            |
| `.glass-card`      | **= Fluent surface.** `rounded-md bg-card border depth-2 + inset highlight`. No blur. |
| `.card-hover`      | Press feedback: depth-8 on hover, translate-y 0.5px + depth-2 on active.              |
| `.row-hover`       | Subtle `bg-muted/30` on hover. Table rows, list items.                                |
| `.section-label`   | 11px uppercase muted label above a section.                                           |
| `.status-paid` / `partial` / `pending` / `dispatched` / `delivered` | StatusBadge palette. |

## Composition rules (apply to every new screen)

- Page header: `.h1-display` + `.h1-subtitle`. Always Playfair, never Inter.
- Below: optional `SignalCard` (max one) → `KpiStrip` → main content.
- Cards use `.glass-card` for resting and add `.card-hover` if pressable.
- Tables: `.row-hover` per row, header band uses muted background.
- Money/KPIs: always `.num`. Always tokens — `text-foreground`, `text-muted-foreground`, `text-success`, `text-destructive`.
- Icons: pick the right weight tier; never bare `<Icon size={n}>`.

## Don'ts

- No glassmorphism (blur, transparent over photo) in `/app`. Use `.glass-card` (Fluent surface) instead.
- No raw hex in components. No `text-white`, `bg-black`, `text-emerald-*`, `bg-amber-*`. Migrate to semantic tokens.
- No `font-extrabold` or `font-black`. Max weight is `font-semibold`.
- No two heroes on one page. Pick the most important signal.
- No new primitives without checking this file first.
