# Fix: Notification panel scrolling (Option A)

## What changes
In the bell's notification panel, the list will scroll on its own. The title bar with "Mark all read", the Important / All activity tabs and the "See all activity" link stay fixed while the list scrolls. You can now reach older and unread alerts.

## Scope (one file only)
- `src/components/layout/NotificationCenter.tsx`: replace the list wrapper `<ScrollArea className="max-h-[420px]">` with `<div className="max-h-[min(420px,65vh)] overflow-y-auto overscroll-contain">`, and remove the unused `ScrollArea` import.

## Not changed
- How alerts are created or delivered, read/unread logic, permissions, database
- Panel design, unread dots/tints, coloured edges
- The shared `scroll-area.tsx` component

## Checks
- Browser check on computer and phone sizes: with 30+ alerts, scroll by mouse wheel/swipe to the last one; header, tabs and footer stay put; page behind does not scroll.
- Confirm unread markers still show and "Mark all read" still works.
- Build log clean; existing tests still pass.
