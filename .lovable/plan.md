# Mobile Bottom Nav Polish

## Problem

In `src/components/layout/AppLayout.tsx`:

1. **Duplication** — `/command` appears as a primary slot ("My Business") AND inside the More-sheet "Insights" group. Both can light up "active" at once, and the same destination has two different names.
2. **Label drift** — Home / Orders / Stock are one word; "My Business" is two words and visually heavier than its neighbors, so the 4th slot looks cramped on 320–375 px widths.
3. **Optical polish** — 2 px top-bar active indicator sits flush against the border-t (hard to read), tap row is only ~52 px (below 44 px guideline once safe-area is small), stroke weights jump 1.6 → 2 on activation (jitter), and there's no press feedback beyond a CSS `active:scale`.

## Decision

- **Rename** the 4th bottom-bar slot from "My Business" → **Insights**. This matches the existing group name and uses the same one-word rhythm as Home/Orders/Stock/Menu.
- **Remove** the now-redundant "Insights" group from `moreGroups` (its only item was `/command`). The More sheet keeps Work / Catalog / Relationships / Account.
- Update `ROUTE_TITLES["/command"]` from "My Business" to "Insights" so the header title matches.

## Refit (bottom nav only)

- Replace the 2 px top hairline indicator with a **soft pill behind the icon** (rounded-full `bg-primary/10`, height 32 px, width 44 px) plus the existing top hairline kept as a 1.5 px Midnight accent that sits just inside the border. Active label switches to `text-primary` semibold; inactive stays `text-foreground/60`.
- **Tap target** raised to **56 px** (`min-h-[56px]`) per slot, with the icon+label group vertically centered. Keeps `safe-area-inset-bottom` padding.
- **Unified stroke** at 1.75 for all states (no jitter on activation; weight shift comes from the pill, not the glyph).
- **Press feedback** via Framer Motion: `whileTap={{ scale: 0.94 }}` with `ease-fluent` spring, respecting `useReducedMotion` (already imported).
- **Equal width** slots using `grid grid-cols-5` instead of `flex justify-around` — guarantees mathematically equal columns at every viewport so "Insights" can never push neighbors.
- **Icon size** standardized to 22 px; label `text-[10.5px]` with `tracking-[-0.005em]` and `tabular-nums` removed (not numeric).
- The Menu slot uses the same pill treatment when its corresponding routes are active.

## Files

- `src/components/layout/AppLayout.tsx` — only file touched. Edits:
  - `primaryMobileNav[3].title`: "My Business" → "Insights".
  - Delete the `Insights` entry from `moreGroups`.
  - `ROUTE_TITLES["/command"]`: "My Business" → "Insights".
  - Rewrite the `<nav data-mobile-nav>` block (lines 348–395) to the grid-5 + pill + motion treatment above. Sheet body untouched.

No tokens added; reuses `bg-primary/10`, `text-primary`, `ease-fluent`, `shadow-depth-2`. No business-logic or routing changes.

## Verification

- Visual check at 320, 375, 414, 768 widths via preview.
- Confirm `tsc --noEmit` clean.
- Confirm More sheet no longer shows the redundant Insights group.
