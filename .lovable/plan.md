

The screenshot shows the **RefreshAppButton** rendering as a large circular button with a 2-tone refresh icon — it's visually heavy, bigger than the bell, and reads as a primary action rather than a quiet utility. That's the "sync feature UI/UX issue" — not the header `Syncing…` indicator from the last change.

## Fix — make the Refresh button quiet and consistent with the bell

**Single file: `src/components/layout/RefreshAppButton.tsx`**

1. Strip the filled/circular background — render as a plain `ghost` icon button matching `NotificationCenter`'s bell styling (same size box `h-9 w-9`, no background until hover).
2. Use a single-tone `RefreshCw` icon at `h-[18px] w-[18px]` with `text-muted-foreground` (same weight as the bell), not the 2-tone `RefreshCwOff`/colored variant.
3. While checking for updates, animate the icon with `animate-spin` instead of swapping to a different glyph.
4. Keep tooltip "Check for updates" / success + "no update" toasts unchanged.
5. Verify alignment in the header cluster (gap-3 already set in `AppLayout`) so Refresh + Bell sit as a matched pair.

## Out of scope
- No changes to the header `Syncing…` indicator (separate concern, working as designed).
- No changes to `NotificationCenter`, `LiveClock`, role badge, or install button.
- No changes to update-check logic or toasts.

