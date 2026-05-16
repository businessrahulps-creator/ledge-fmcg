# Fill empty cards with product mini-previews

## Diagnosis

Two sections have white "empty" cards that read as placeholders next to their tinted siblings:

- **Features.tsx** (6 cards) — Dealer (Forest tint, has `DealerPreview`) and Returns (Terracotta tint, has `ClaimPreview`) feel rich. The 4 plain cards — **Stock Health, Schemes & Targets, Team Performance, GST Automation** — show only title + description.
- **WhyLedge.tsx** (4 cards) — "Works when the network doesn't" (Midnight tint, has `Field signal` insight). The 3 plain cards — **Mobile-first, Schemes/warehouses/credit, Basics in 30 minutes** — show only title + description with a tiny corner icon.

## Approach

Build **mini product previews** (same pattern as existing `DealerPreview` / `ClaimPreview`), not raster illustrations. Stripe, Linear, Notion, Vercel all use this — it reads as enterprise because it *shows the product*, not abstract art. AI illustrations would push the page toward generic SaaS, opposite of the goal.

All previews are pure JSX + Tailwind reusing existing primitives (`lp-pill`, `lp-pill--success/warn/info/neutral`, `lp-insight`, white inset card with `boxShadow: inset 0 1px 0 hsl(0 0% 100%), 0 1px 2px hsl(220 30% 15% / 0.05)`, `num-tabular`). No new dependencies, no images.

## What ships

### `Features.tsx` — 4 new mini-previews

1. **Stock Health** — three-row SKU list with status dots and stock counts:
   ```text
   Surf Excel 1kg     ●  48 in stock
   Maggi 70g          ●  12 — reorder
   Dabur Honey 250g   ●  Out of stock
   ```
   Green/amber/red dot = `lp-pill` micro-variant; counts in `num-tabular`.

2. **Schemes & Targets** — single goal card with progress bar:
   ```text
   Monsoon Scheme · July
   ▓▓▓▓▓▓▓░░░  ₹1.24L / ₹2.00L
   62% complete · 8 days left
   ```
   Bar fills with `bg-foreground/80` against `bg-muted` track.

3. **Team Performance** — top-3 reps leaderboard:
   ```text
   1  Anjali R.   42 orders   ↑ on target
   2  Vikram S.   38 orders   ↑ on target
   3  Meera K.    24 orders   ◐ catching up
   ```
   Rank number in Playfair, name in Inter, status pill on right.

4. **GST Automation** — mini invoice receipt:
   ```text
   INV-2641 · Aryan Beverages
   ─────────────────────────
   Subtotal              ₹42,500
   CGST 9%   ₹3,825
   SGST 9%   ₹3,825
   ─────────────────────────
   Total                 ₹50,150
   ```
   Receipt styled as an inner white card with dashed dividers, tabular nums.

### `WhyLedge.tsx` — 3 new mini-previews

Add to the three non-Midnight cards (replace the bottom-right corner icon):

1. **Mobile-first. Any phone.** — small "install card": rounded chip showing `📱 Install Ledge · 12 MB · 89s` with a thin progress line. Communicates "PWA from a link in 90s" visually.

2. **Schemes, warehouses, credit control.** — three stacked tiles, each a tiny module chip with check + label: `Schemes ✓` / `Warehouses ✓` / `Credit limits ✓`. Visualises "whole distribution layer — built in."

3. **Basics in 30 minutes. No trainer.** — three-step micro-timeline (vertical):
   ```text
   ● Sign up         · 2 min
   ● Add your team   · 8 min
   ● First order     · by lunch
   ```
   Connector line between dots.

Each preview anchored at the bottom of the card via `mt-auto pt-6` so card heights stay balanced.

## Visual rules

- All previews use the existing white inset card pattern (no new shadow tokens).
- Numbers use `num-tabular`.
- Status colors come from `lp-pill--success/warn/neutral/info` only — no raw hex.
- Heights tuned so the 6-card Features grid and 4-card WhyLedge grid maintain `auto-rows-fr` parity.
- `prefers-reduced-motion`: previews are static — no new animation.

## Out of scope

- No changes to tinted Dealer / Returns / "Network" cards (they already work).
- No copy, headline, eyebrow, or grid changes.
- No raster illustrations or AI imagery.
- No changes to icon set or section padding.

## Verification

- Visit `/#features` — 6 cards equal height, each communicating its function visually.
- Visit `/#why-ledge` (or equivalent anchor) — 4 cards equal height, no "empty" cards.
- At 1202px viewport (current) cards remain 3-up and 4-up respectively; at md (768) they're 2-up; at sm single column with previews intact.
- `rg "ledge-mark|illustration" src/components/landing` shows no new image imports.
