

# Fix: Activity Link in Mobile Nav Goes to 404

## Problem
On mobile, the "More" sheet lists "Activity" as a `<Link to="/activity">`, but there is no `/activity` route — the Activity Log is a Sheet/drawer component, not a page. On desktop, the sidebar correctly opens the `<ActivityLog>` sheet via `onClick`. On mobile, tapping it navigates to a nonexistent route, showing 404.

## Fix
In `src/components/layout/AppLayout.tsx`:

1. Import the `ActivityLog` component
2. Add `activityOpen` state
3. In the `moreGroups` rendering (line ~288), intercept the Activity item: instead of rendering a `<Link>`, render a `<button>` that opens the ActivityLog sheet and closes the More sheet
4. Render the `<ActivityLog>` sheet alongside the More sheet

This keeps the Activity item visually identical in the grid but opens the sheet drawer instead of navigating.

## Files Changed
- `src/components/layout/AppLayout.tsx` — special-case the Activity item to open the sheet instead of navigating to `/activity`

