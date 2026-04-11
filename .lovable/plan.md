

# Add Individual Delete to Sync Queue Viewer

## Overview
Add a delete button to each row in the sync queue table, allowing users to remove individual pending mutations.

## Changes

### `src/pages/Settings.tsx`
1. **Import `removeFromQueue`** — add it to the existing import from `@/lib/offline-store` (line 6).
2. **Add delete handler** — async function that calls `removeFromQueue(id)` then refreshes the queue state.
3. **Add delete column** — new table header + a small icon button (Trash2, already imported) in each row that calls the handler. No confirmation dialog needed for single items — the "Clear All" already has one.

### No other files changed
`removeFromQueue` already exists in `offline-store.ts`.

## Technical Details
- The delete button uses `variant="ghost"` + `size="icon"` with the existing `Trash2` icon at `h-3.5 w-3.5`.
- After removing, re-fetch via `getQueue()` to update state immediately (no need to wait for the 3s poll).
- Column header labeled "Action", right-aligned, always visible.

