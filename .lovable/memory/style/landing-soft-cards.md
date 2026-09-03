---
name: Landing soft-surface card system
description: Landing-only large-radius tokens (12/18/24/32px), borderless pillowy shadows, softer tonal gradients, and the visual-first LandingCard primitive
type: design
---
Landing page only — `/app` keeps the 6px Fluent radius. Never reuse `lp-*` soft
surfaces inside the product.

## Tokens (src/index.css)
`--lp-r-sm 12px`, `--lp-r-md 18px`, `--lp-r-lg 24px`, `--lp-r-xl 32px`.
`--lp-shadow-soft` / `--lp-shadow-lift` (light) and `--lp-shadow-soft-dark` /
`--lp-shadow-lift-dark` (tinted). Cards are **borderless** — depth comes from a
layered warm shadow plus a white inset highlight.

Existing shells (`.lp-card`, `.lp-card-dark`, `.lp-card-tinted`, `.lp-card-glass`,
`.lp-icon-tile`) were retrofitted with these radii/shadows, so every landing
section softened automatically. Tinted gradients are now three-stop and gentler.

## LandingCard primitive
`src/components/landing/LandingCard.tsx` — visual-first card:
`lp-vcard` shell (32px) → `lp-well` (18px rounded graphic well, warm
`hsl(34 34% 95%)` on light variants, white/10 on tinted) → `lp-caption`
(bold lede + muted continuation, reference-style).
Variants: `neutral | midnight | forest | terracotta | bone`, resolved through an
explicit `variantClass` map — Tailwind tree-shakes `@layer components` rules, so
template-literal class names silently drop the styles.
`.lp-well-meta` styles small meta lines so they invert on tinted cards.

## Visuals
`src/components/landing/visuals/FeatureVisuals.tsx`: DealerRoster, StockHealth,
SchemeArc (SVG half-donut), TeamBars, GstInvoice, ClaimTimeline, RevenueChart
(SVG area chart, used in Outcome's forest hero card).

## Features bento
lg 6-col grid: dealers (forest, 3) + stock (neutral, 3) / schemes (bone, 2) +
team (neutral, 2) + GST (neutral, 2) / claims (terracotta, full width).
`src/test/brand-placement.test.ts` asserts Features tints via `variant: "..."`.
