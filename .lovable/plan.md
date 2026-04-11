

# Add Retry Single Mutation Button to Sync Queue

## Overview
Add a retry button next to each delete button in the sync queue table, allowing users to manually retry individual failed mutations without waiting for the automatic sync cycle.

## Changes

### `src/lib/offline-store.ts`
- Export a new `replaySingleMutation` async function that:
  1. Takes a `QueuedMutation`
  2. Executes the appropriate Supabase call (insert/update/delete) — same logic as the flush loop in DataContext (lines 286-294)
  3. On success: removes from queue via `removeFromQueue`, returns `{ ok: true }`
  4. On failure: returns `{ ok: false, error }` (keeps mutation in queue)

### `src/pages/Settings.tsx`
- Import `replaySingleMutation` and `RotateCw` icon from lucide-react
- Add a retry button (ghost, icon, `h-7 w-7`) with the `RotateCw` icon next to each delete button in the Action column
- On click: call `replaySingleMutation(m)`, show success/error toast, refresh queue state
- Wrap both buttons in a `flex gap-1` container

## Technical Notes
- The replay function imports `supabase` directly from `@/integrations/supabase/client` to keep it self-contained
- Only works when online — button checks `navigator.onLine` and shows a toast if offline
- No spinner needed — the operation is fast (single DB call)

