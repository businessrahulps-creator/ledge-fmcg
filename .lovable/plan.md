

# Surgical Fix: Offline Mutation Queue

## Root Cause

The offline order creation queues a payload with `{ _offlineOrder: true, order: {...} }` (line 576-578), but the sync replay loop (lines 300-308) does a raw `supabase.from(mutation.table).insert(mutation.payload)`. This sends the `_offlineOrder` wrapper object directly to the `orders` table, which fails because the columns don't match. The order gets stuck in the queue forever.

Additionally, order lines are never queued separately, so even if the order insert succeeded, the lines would be lost.

## Fix (2 files, surgical)

### 1. `src/lib/offline-store.ts` — Add order-aware replay

Add a new mutation type `"insert_order_atomic"` to `replaySingleMutation` that:
- Calls the `insert_order_atomic` RPC (same as online path)
- Inserts order lines after getting the real order ID
- Handles stock deduction if the order was dispatched/delivered
- Retries up to 3 times on failure

### 2. `src/context/DataContext.tsx` — Fix queue + replay

**Enqueue fix (line 575-578):**
- Change the queued mutation type from `"insert"` to `"insert_order_atomic"`
- Store the full order object (with lines, godownId, delivery status) as the payload instead of the broken `_offlineOrder` wrapper

**Sync replay (lines 288-336):**
- Detect `"insert_order_atomic"` mutations and call the proper RPC + lines insert + stock deduction
- Add retry logic (max 3 attempts per mutation)
- After full replay, call `safeRefetchOrders()` and `safeRefetchStockItems()` explicitly

### Files Changed

| File | Change |
|------|--------|
| `src/context/DataContext.tsx` | Fix enqueue payload format for orders; add order-specific replay in syncQueue with retry (3 attempts); call safeRefetch after sync |
| `src/lib/offline-store.ts` | Add `"insert_order_atomic"` type to `QueuedMutation` union |

### What Does NOT Change
- All UI, buttons, modals, visual elements
- Online mutation paths (already working)
- Generic CRUD offline queue (distributors, salespersons, etc. — already correct)
- Design tokens, routing, components

