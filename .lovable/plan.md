

# Add Sync Queue Viewer Tab in Settings

## Overview
Add a new "Sync Queue" tab to the Settings page that displays all pending offline mutations from IndexedDB, showing their type, table, timestamp, and payload summary.

## Changes

### `src/pages/Settings.tsx`
- Import `getQueue`, `clearQueue`, `QueuedMutation` from `@/lib/offline-store`
- Import `Clock`, `Database`, `Trash2` (reuse existing) icons
- Add state: `queuedMutations` array, loaded on mount and refreshed every 3 seconds
- Add a new `TabsTrigger` value `"sync"` labeled "Sync Queue" with a badge showing count when > 0
- Add corresponding `TabsContent` with a card containing:
  - A table listing each queued mutation: **Type** (insert/update/delete badge), **Table** name, **Timestamp** (formatted with Indian locale `toLocaleString("en-IN")`), and a truncated **Payload** preview
  - A "Clear Queue" button (with confirmation) that calls `clearQueue()` and refreshes
  - Empty state: "No pending changes" message when queue is empty
- Polling `useEffect` that calls `getQueue()` every 3s to stay current

### No other files changed
All queue utilities already exist in `offline-store.ts`.

## Technical Notes
- Uses existing `getQueue`/`clearQueue` from offline-store — no new dependencies
- Timestamps rendered via `new Date(ts).toLocaleString("en-IN")` for Indian locale
- Payload shown as truncated `JSON.stringify` (first 80 chars) to keep rows compact
- Badge on tab trigger uses the same pill style as the offline banner pending count

