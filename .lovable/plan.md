

# Fix Bug #20: Eliminate Order-Number Sequence Gaps

## Problem
The current flow calls `get_next_order_number` (which increments `companies.next_order_sequence`) in a **separate** RPC from the order insert. If the insert fails, the sequence is already consumed, creating gaps.

## Approach
Replace the two-step flow (get number → insert) with a single atomic RPC that increments the sequence AND inserts the order in one transaction. On failure, the entire transaction rolls back — no gap.

## Changes

### 1. New DB Migration: Create `insert_order_atomic` RPC
A `SECURITY DEFINER` PL/pgSQL function that:
- Accepts all order fields as parameters
- Increments `companies.next_order_sequence` and formats `{prefix}-{year}-{seq}`
- Inserts the order row with the generated number
- Returns the inserted row (id, order_number)
- On unique constraint violation on `order_number`, retries up to 3 times (re-fetching sequence)
- All in one transaction — rollback on any failure means no gap

```sql
CREATE OR REPLACE FUNCTION public.insert_order_atomic(
  p_company_id uuid, p_date date, p_distributor_id uuid, p_distributor_name text,
  p_salesperson_id uuid, p_salesperson_name text, p_total numeric,
  p_payment_mode payment_mode, p_payment_status payment_status,
  p_dispatch_date date, p_vehicle text, p_driver_name text,
  p_delivery_status delivery_status, p_dispatch_remarks text,
  p_godown_id uuid
) RETURNS TABLE(id uuid, order_number text) ...
```

The existing `get_next_order_number` RPC is kept for backward compatibility (preview number display) but is no longer called during order creation.

### 2. Edit `src/context/DataContext.tsx` — Use atomic RPC
In `addOrder`:
- Remove the `get_next_order_number` RPC call
- Replace the separate `.insert("orders")` with a single `supabase.rpc("insert_order_atomic", {...})` call
- The RPC returns `{id, order_number}` — use those for the order lines insert and local state update
- Update `setOrderSequence` from the returned sequence number

### 3. Preview number stays unchanged
`previewOrderNumber` and `nextOrderNumber` still read from local `orderPrefix`/`orderSequence` state, which is synced on data load. No changes needed.

## Scope
- New migration: `insert_order_atomic` function
- Modified: `src/context/DataContext.tsx` (addOrder function, ~15 lines changed)
- No UI changes, no other files touched

