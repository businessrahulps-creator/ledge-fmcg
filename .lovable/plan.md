

## Match LiveClock + role badge to quiet utility style

Goal: make `LiveClock` and the role `Badge` feel like peers of the bell/refresh icons — same muted weight, consistent spacing, no visual heaviness.

### Current state
- `LiveClock`: `font-mono text-[10px] sm:text-xs text-muted-foreground` with an "IST" suffix at `text-[8px]` — already muted but the mono font + IST tag makes it noisier than the icons.
- Role `Badge`: uses `variant="secondary"` which renders a filled pill background — visually heavier than the ghost icons next to it.
- Header cluster uses `gap-3`.

### Changes — single file: `src/components/layout/AppLayout.tsx`

1. **Role badge** — drop the filled `Badge` component; replace with a plain inline `<span>`:
   - `hidden sm:inline-flex items-center text-[11px] font-medium text-muted-foreground capitalize`
   - No background, no border — reads as quiet metadata, matching icon color weight.
   - Remove the `Badge` import if no longer used.

2. **LiveClock** — minor refinements in `src/components/layout/LiveClock.tsx`:
   - Keep mono font (time still benefits from tabular alignment) but bump to `text-[11px]` to match the new badge.
   - Use `text-muted-foreground` (drop the `/60` variants if any) at the same opacity as the bell icon's default state.
   - Tighten the IST suffix: `text-[9px] font-medium opacity-70` and `ml-0.5` for cleaner spacing.

3. **Header cluster spacing** — change `gap-3` to `gap-2` so the icons + clock + role text sit as a tight, balanced row (icons themselves have internal `h-9 w-9` padding, so `gap-2` gives ~8px breathing room which matches Apple-style toolbars).

### Out of scope
- No changes to `RefreshAppButton`, `NotificationCenter`, syncing indicator, install button, or sidebar trigger.
- No changes to mobile bottom nav.
- No color token changes.

### Files
1. `src/components/layout/AppLayout.tsx` — replace Badge with span, adjust gap
2. `src/components/layout/LiveClock.tsx` — refine sizing/opacity

