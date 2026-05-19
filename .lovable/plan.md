
## Goal

Lift the three list cards from generic "avatar + stats grid" tiles to **editorial, KPI-led cards** that match the promoted surfaces already shipped on Dashboard / My Business (SignalCard, KpiStrip, CreditAtRiskCard).

Brand taste is locked (Midnight/Forest/Terracotta/Bone, Playfair H1/H2 + Inter, Fluent 2 depth & motion). We are changing **composition, hierarchy, density, and visual emphasis** — not tokens.

## Diagnosis (what's wrong today)

All three cards share the same flat pattern: small bold name → tiny stat grid → faint divider. No hero number, no Playfair moment, no visual story. Targets card is the weakest — raw `NumberInput` rows dominate the surface. Action buttons (Pencil/Trash/WhatsApp) crowd the header and steal attention from the data.

## One direction, three surfaces

### Shared anatomy ("Editorial KPI Card")

```text
┌─────────────────────────────────────────────────┐
│ ▌ AVATAR  Name                       ··· menu  │   ← header rail (3px brand left bar)
│           secondary line · tertiary line        │
│                                                  │
│  ₹ 12,34,567               +12%  vs last week   │   ← hero: Playfair 26px num + InsightLine
│  Total revenue                                   │
│                                                  │
│ ───────────────────────────────────────────────  │   ← hairline
│  Orders   Avg    Outstanding ▓▓▓▓▓░░░  62%      │   ← KpiStrip-style footer row
└─────────────────────────────────────────────────┘
```

Key moves:
- **Left brand bar** (3px Midnight/Forest/Terracotta) — encodes status at a glance (healthy / watch / at-risk). Reuses the SignalCard tier system.
- **One hero number** in Playfair 26px with `tabular-nums` — the card finally has a focal point.
- **InsightLine** under the hero (delta vs previous period, same primitive used on Dashboard).
- **Hairline-separated KpiStrip footer** (2–3 cells max) — same primitive used on Command, gives instant family resemblance.
- **Action cluster moves to a `···` overflow menu** (DropdownMenu) — removes 2–3 icon buttons from the header. Only the highest-intent action (WhatsApp reminder on overdue dealers) stays as a chip in the footer.
- **`card-hover` + `depth-2 → depth-8`** translate-y press already in tokens; reused, not re-derived.
- **Compact density toggle** respected: padding drops `p-5 md:p-6` → `p-4` in compact, hero shrinks 26→22px.

### Per-surface specialization

**Dealers (`Distributors.tsx`)**
- Hero number: **Outstanding** if `> 0`, else **Total revenue** (the number the user actually opens this card to see).
- Left bar tier: `destructive` if util ≥ 100%, `warning` ≥ 70%, `success` if active with low util, `muted` if no credit set.
- Footer KpiStrip cells: **Orders** · **Lifetime value** · **Utilization bar** (the existing % bar, promoted into the strip with `dpo` chip when overdue).
- WhatsApp reminder chip surfaces in the footer (not header) when `outstanding > 0`, mirroring CreditAtRiskCard's hover-revealed "Remind" pattern.

**Sales Team (`Salespersons.tsx`)**
- Hero number: **Revenue this period** (current filter window — wire to the existing period selector if present, else lifetime).
- Region pill moves into the header sub-line as a small `timeframe-pill`-style chip (already tokenized).
- Left bar tier: derived from pace vs target (`success` ≥ 100%, `warning` ≥ 70%, `destructive` < 50%, `muted` no target).
- Footer KpiStrip: **Orders** · **Avg order** · **Dealers served** (new — derived from `orders.distinctBy(dealerId)`; falls back to "—" when zero).

**Targets (`Targets.tsx` — `TargetCard`)**
- Hardest refit. Today the card *is* a form; we keep it editable but reframe it as a **progress card with inline edit**, not a form with progress strapped on.
- Hero number: **% to target** in Playfair (e.g. `82%`), color-tinted by `STATUS_CONFIG[overallStatus]`, with subtitle `₹4.1L of ₹5L · 6 days left`.
- Status pill stays top-right but uses StatusBadge tokens (left-bar variant from PR11).
- Revenue + Orders rows collapse into a **two-row mini-table** under the hero: each row = label · actual / target · progress bar · % chip. NumberInputs become inline-edit (click value to swap to input), which removes the "two big input boxes" visual weight.
- Save button stays inline on dirty, but as a quiet primary chip (h-7, secondary visual weight) so it doesn't compete with the hero.

## New primitive (small, shared)

Add `src/components/ui/entity-card.tsx`:

```tsx
<EntityCard
  tier="success" | "warning" | "destructive" | "muted"
  avatar={<EntityAvatar name={…} />}
  title={…} subtitle={…} tertiary={…}
  hero={{ value, label, insight }}        // Playfair num + InsightLine
  cells={[{label, value}, …]}             // KpiStrip-style footer (max 3)
  primaryAction={…}                       // optional footer chip (WhatsApp)
  menu={[{label, onClick, icon}, …]}      // DropdownMenu overflow
  onClick={…}                             // whole-card navigation
/>
```

Internally composes `Card` (depth-2) + `EntityAvatar` + `KpiStrip` + `InsightLine` — zero new tokens, all existing primitives. The three pages map their domain data into this one shape.

## Files touched

- **New** `src/components/ui/entity-card.tsx` — the shared composition.
- **Edit** `src/pages/Distributors.tsx` — replace lines 250–321 card body with `<EntityCard …>`.
- **Edit** `src/pages/Salespersons.tsx` — replace lines 162–203 card body with `<EntityCard …>`.
- **Edit** `src/pages/Targets.tsx` — refactor `TargetCard` (lines 166–230) around `EntityCard` + inline-edit rows.
- **No** changes to `index.css`, tokens, or `tailwind.config.ts`.

## Out of scope

- Page-level header/filter/pagination changes.
- Dealer/Salesperson detail pages.
- Any business-logic shifts (totals, formulas, RBAC).
- New tokens, gradients, or animation primitives beyond what `card-hover` / `ease-fluent` already ship.

## Acceptance

- All three pages render the same `EntityCard` primitive — one visual family.
- Each card has exactly one Playfair hero number, one secondary insight, ≤3 footer cells.
- No more than one icon-button visible in the header (the `···` menu); destructive actions live inside the menu.
- Compact density and mobile (360px) viewports: hero never clips, footer cells stay on one row, `tabular-nums` everywhere.
- Targets card is editable without showing a single visible `<input>` until the user clicks a value.
