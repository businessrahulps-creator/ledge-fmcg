

# Fix: "1 open" badge clipping on mobile Claims header

## Problem

On a 390px viewport, the header row crams three elements side-by-side: the long title "Returns & Claims", the "1 open" badge, and the "+ New Claim" button. The badge gets visually broken/clipped.

## Fix

Move the badge below the title on mobile, placing it next to the subtitle text, so the header row only has the title vs the button competing for width. The badge naturally fits under the title.

**Specifically** (lines 427-442 of `src/pages/Claims.tsx`):

- Keep the `h1` title alone in its row (remove the badge from the `flex items-center gap-3` wrapper around the title)
- Place the badge inline after the subtitle `<p>` tag, or on a new line between title and subtitle using `flex-wrap`

Simplest approach: make the title+badge wrapper `flex-wrap` so the badge wraps to a new line on narrow screens:

```tsx
<div className="flex flex-wrap items-center gap-2">
  <h1 className="text-xl font-bold tracking-tight md:text-2xl">Returns & Claims</h1>
  {openCount > 0 && (
    <Badge ...>{openCount} open</Badge>
  )}
</div>
```

This single CSS change (`gap-3` → `gap-2`, add `flex-wrap`) fixes the layout without touching any logic.

**1 line changed in 1 file. No new files. No database changes.**

