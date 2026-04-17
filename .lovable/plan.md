

## Problem

Looking at the screenshot vs the code (`src/pages/OrderDetail.tsx` lines 663–728):

1. **Empty gap between Driver field and the action bar** — caused by `<div className="pb-48 md:pb-0" />` (line 663). This 192px spacer was added so the **fixed** action bar wouldn't overlap form fields when scrolling. But on this short form, the spacer creates a large empty band between Driver and the floating bar.
2. **"Save Changes" wraps to its own row inside the bar** — `flex-wrap` + `mr-auto` on the icon group forces Save below when 4 icon buttons + Save can't fit on a 390px iPhone. That's why the bar looks tall and awkward.
3. The bar is `fixed bottom-24` on mobile, floating above the bottom tab nav, which combined with the spacer makes the page feel disconnected.

## Fix (surgical, mobile-only)

**File: `src/pages/OrderDetail.tsx`**

**Change 1 — Tighten the bottom spacer (line 663)**
Replace `pb-48 md:pb-0` with `pb-32 md:pb-0`. The fixed bar is ~64px tall + sits at `bottom-24` (96px), so 128px of bottom padding is enough clearance — not 192px. This removes ~64px of dead space.

**Change 2 — Stop "Save Changes" from wrapping (lines 667–668)**
- Remove `flex-wrap` from the outer flex container so children stay on one row.
- Keep `gap-2` for spacing.
- The inner icon group keeps `mr-auto` to push Save to the right.
- Add `min-w-0` and `flex-shrink` behaviors so icon buttons can compress instead of wrapping.

Result: one clean row — `[🗑] [📄] [💬] [↻] ……… [Save Changes]` — matching the original design intent.

**Change 3 — No other changes.** Activity History card, sticky positioning, bottom tab nav all stay as-is.

## Files touched
- `src/pages/OrderDetail.tsx` — 2 small edits (lines 663, 667)

## What stays the same
- Sticky-on-mobile, inline-on-desktop behavior
- All button styles, colors, icons, handlers
- Delete confirmation flow
- Activity History section

