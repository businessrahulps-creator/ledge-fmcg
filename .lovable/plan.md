

## Fix: Sticky action bar covers Driver/Vehicle fields on mobile

### Root cause
In `src/pages/OrderDetail.tsx` (line 663–726), the action bar is `fixed bottom-24` on mobile. The form ends right before it with no bottom padding, so the bar floats over the last row (Dispatch Date / Vehicle / Driver). User cannot see/tap the Driver field — exactly what the screenshot shows.

### Fix (one file, minimal)
**`src/pages/OrderDetail.tsx`** — add bottom padding to the scrollable form container on mobile so the last row clears the floating bar (~80px bar + 96px bottom offset + safe area). Use `pb-48 md:pb-0` on the form wrapper that holds the dispatch/vehicle/driver block (or on the outer page container).

Simplest, safest change: add `pb-48 md:pb-0` to the parent wrapper of the form section ending at line 661, so on mobile there's enough space below the Driver field for the floating action bar to sit without overlapping. Desktop is unaffected (bar is static there).

### Why this is the right fix
- Doesn't change layout/behaviour of the action bar (which users like floating).
- Pure spacing fix — no risk to save/delete/claim handlers.
- Matches the same pattern used elsewhere in the app for sticky bottom bars.

### Out of scope
- No changes to action bar contents, order, or styling.
- No changes to History accordion or other sections.

