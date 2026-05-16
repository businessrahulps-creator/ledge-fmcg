
# PR10 — Editorial Composition Pass

PR9 fixed typography and tokens. PR10 fixes **composition**: hierarchy, rhythm, redundancy, and the few surfaces that still feel "templated". Goal: 9.5/10.

## What's still off (from current screenshot)

1. **Dashboard top** — huge dead space above "Good Evening, Asha". The onboarding banner sits as a floating island, disconnected from the page.
2. **KPI duplication** — "This Month" card shows Revenue/Orders/Outstanding/Delivered, then immediately below the day-rail repeats Revenue/Orders/Pending/Dispatched as 4 separate cards. Reads as the same block twice.
3. **Day-rail** — chips look like buttons in a vacuum; no anchoring label, no relation to the KPIs they drive.
4. **"Updated just now · Refresh"** — plain text, no affordance; refresh icon in topbar duplicates it.
5. **Sidebar** — active state (left bar + bold) is good, but section labels (`HOME`, `MANAGE`) feel heavy at current size; footer version string floats.
6. **Topbar** — sidebar toggle, then a wall of empty space, then cluster of 4 controls on the right. No left-side context (page title / breadcrumb).
7. **Tables (Orders etc.)** — row hover is subtle but rows still feel tall; first/last column padding inconsistent with card edge.
8. **Cards globally** — inset highlight from PR9 is good but corners on nested elements (badges, inputs inside cards) still feel slightly mismatched (8px inside 6px).

## Plan (5 themes, single PR)

### 1. Dashboard composition
- **Remove top dead space**: page padding `pt-8` → `pt-5`; banner becomes inline pill at top of content column with `border-l-2 border-success` accent instead of full card.
- **Merge the two KPI blocks** into one composed hero:
  - Greeting + date (left, ~40%)
  - "This Month" KPIs as a **horizontal strip** to the right of greeting on desktop (4 stat cells with hairline dividers, no card border)
  - Sparkline becomes a thin band **directly under** the KPI strip, full width, 56px tall
  - Day-rail moves **below** with label "Daily breakdown" and the today's KPIs render as compact 4-up `text-2xl` values, **not** as 4 separate full cards
- Net result: one continuous editorial block, not three stacked cards.
- "Updated just now" → small `text-[11px] text-muted-foreground` with a real icon button for refresh; remove duplicate refresh icon from topbar.

### 2. Topbar context
- Add page title (same string as sidebar active item) on the left of the topbar in Inter `text-sm font-medium`, after the sidebar toggle. Empty middle gets purpose.
- Tighten right cluster: clock, role, notifications. Drop redundant refresh icon.
- Reduce topbar height 56px → 52px; vertical hairlines already in place.

### 3. Sidebar refinement
- Section labels: `text-[10px]` → `text-[9px]`, `tracking-[0.18em]` → `tracking-[0.22em]`, color `text-muted-foreground/70`.
- Item row height 40px → 36px; icon 18px → 16px for visual lightness.
- Active item: keep 2px Midnight bar, change label weight `font-semibold` → `font-medium` + `text-foreground` (less shouty, the bar carries the signal).
- Footer: pin to bottom with `mt-auto`, single line `Ledge · v26.05`, `text-[10px] opacity-50`.

### 4. Table density + edge alignment
- Row height 52px → 44px on desktop, 52px on touch (mobile keeps tap target).
- First column `pl-5`, last `pr-5` to align with card inner padding.
- Header background: subtle `bg-muted/20` band (currently transparent), so header reads as a distinct zone.
- Sticky first column on horizontal scroll for Orders / Stock tables.

### 5. Nested radius + small details
- All inputs/selects/badges inside cards: `rounded-md` (already 6px) — audit for stragglers still at 8px.
- Replace remaining emoji (🎉 in onboarding banner) with a Lucide `PartyPopper` icon at `text-success`.
- Add `:focus-visible` outline using `--shadow-focus` (added in PR9 but not yet wired into Button/Input — wire it).
- Empty-state illustrations: replace generic gray boxes with a thin Midnight line drawing + one-line copy + single CTA.

## Files touched

- `src/index.css` — focus ring wiring, header band utility
- `src/components/layout/AppLayout.tsx` — topbar height, page title slot, drop refresh
- `src/components/layout/AppSidebar.tsx` — density, label weight, footer
- `src/components/ui/table.tsx` — row height, header band, edge padding
- `src/pages/Dashboard.tsx` — full recomposition (biggest change)
- `src/components/onboarding/*` — banner restyle
- Audit pass on remaining `rounded-lg`/`rounded-xl` inside cards

## Out of scope

- Landing page, auth pages, dark mode
- Any business logic or data changes
- Mobile redesign (PR10 keeps current mobile, only desktop composition changes)

## Verification

Screenshot Dashboard, Orders, Stock, Settings at 1280×800 and 390×844 before/after. Confirm no horizontal scroll, no contrast regressions, focus rings visible on keyboard nav.
