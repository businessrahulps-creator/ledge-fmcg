

# Fix: "More" Navigation Sheet Getting Cropped on Mobile

## Problem
The bottom sheet has `max-h-[70vh]` but the content (3 groups: Manage with 5 items, Analyze with 4 items, Settings with 2 items) exceeds this height on smaller phones. There's no `overflow-y-auto` on the content area, so the bottom items get clipped.

## Fix
In `src/components/layout/AppLayout.tsx` line 266:
- Add `overflow-y-auto` to the `SheetContent` or wrap the content `div` in a scrollable container
- Change `max-h-[70vh]` to `max-h-[80vh]` for more breathing room
- Add `overflow-y-auto` to the `div.space-y-6` content wrapper so it scrolls naturally within the sheet

## Files Changed
- `src/components/layout/AppLayout.tsx` — add scroll to More sheet content, increase max height

