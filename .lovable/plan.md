

# Add Pending Sync Badge Indicator

## Overview
Show a small badge count on the offline banner indicating how many mutations are queued for sync. When offline with pending changes, users see "Offline — 3 changes pending sync".

## Changes

### `src/components/layout/AppLayout.tsx`
- Import `getQueue` from `offline-store.ts`
- Add a `pendingCount` state, polled every 2 seconds (via `setInterval`) when offline
- Also refresh count on mount and when `online` status changes
- Update the offline banner to show the count: `"Offline — using cached data"` becomes `"Offline — using cached data · 3 pending"` when count > 0
- Show the count as a small pill/badge inline in the banner text
- When back online and count was > 0, briefly show "Syncing..." before the banner disappears

### No other files changed
The `getQueue()` function already exists in `offline-store.ts` — just need to call it from the layout.

## Technical Notes
- Polling every 2s is lightweight since `getQueue` is a single IDB read
- Count resets naturally when sync clears the queue on reconnect
- Badge disappears with the banner when back online

