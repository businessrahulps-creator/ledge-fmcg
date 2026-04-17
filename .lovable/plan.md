

## Two issues, both rooted in the same structural bug

Looking at both screenshots:

**Issue 1 — uneven padding inside the Save bar**
The bar has `px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]`. On iPhone the safe-area inset adds ~34px to the bottom only — so top padding is 12px but bottom is ~46px. That's the visible asymmetry.

**Issue 2 — Save bar overlaps the History card when expanded**
The Save bar is `fixed bottom-24` on mobile, so it floats over everything below it. The History card sits in normal flow underneath, so when you expand it, the bar covers the top of it. Also, the History card is currently rendered **outside** the main container `</div>` on line 729 (a stray closing div) — a structural bug.

## Root cause

The sticky/fixed action bar pattern is fighting the page. On a short form (390px viewport), there's plenty of room to just let the action bar **flow inline** above History — no need for it to float. Floating only made sense when the form was tall enough to scroll.

## Fix — make the action bar inline on mobile too (drop the `fixed` behavior)

**File: `src/pages/OrderDetail.tsx`**

**Change 1 (line 663)** — Remove the spacer div entirely. Not needed once the bar is inline.

**Change 2 (line 666)** — Change the bar wrapper from `fixed bottom-24 left-4 right-4 z-40 ... md:static ...` to a simple inline card: `rounded-xl border border-border bg-background/80 backdrop-blur-xl px-4 py-3 shadow-sm md:border-0 md:bg-transparent md:backdrop-blur-none md:p-0 md:shadow-none`.
- Removes the asymmetric `pb-[calc(...)]` → top and bottom padding now both `py-3` (equal).
- Removes `fixed` → bar no longer overlaps History.
- Keeps the glass card look on mobile, keeps desktop unchanged.

**Change 3 (line 729)** — Fix the stray `</div>`. The History card should sit inside the main page container, not outside it. Move the closing div to after the History card so structure is: `[form] [action bar] [History] </container>`.

## Result

- Save bar has equal top/bottom padding (no safe-area asymmetry, since it's no longer floating above the home indicator).
- Expanding History pushes content naturally — no overlap.
- Page scrolls as one continuous flow: form → actions → history.
- Desktop layout unchanged.

## Files touched
- `src/pages/OrderDetail.tsx` — 3 small edits in lines 663–734.

## What stays the same
- All buttons, icons, handlers, styles, delete confirmation
- Desktop inline behavior
- History component itself
- Bottom tab nav (sits below page content as always)

