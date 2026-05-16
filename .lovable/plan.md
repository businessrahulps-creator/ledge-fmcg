
# Auto stock deduction on dispatch

## Current state
- `useStockDomain.deductStockForOrder` already deducts client-side when an order transitions `pending → dispatched | delivered` (called from `useOrdersDomain.addOrder/updateOrder`).
- Limitations: client-side (not atomic), no `source` column, no idempotency guard, no preview UI, no return reversal, no error_log on missing godown.
- `stock_deductions` has a `restore_stock_on_deduction_delete` trigger that adds back on row delete — useful for our reversal model.

## Approach
Move deduction to the **database** for correctness + auditability, and replace the client deduction helper with a single RPC. Keep the existing dispatch UI flow, but add a **dispatch preview modal** that previews stock impact before confirm.

### 1. Schema migration
- `ALTER TABLE stock_deductions ADD COLUMN source text NOT NULL DEFAULT 'manual'` — values: `manual | auto_dispatch | return_reversal`.
- Add **partial unique index** on `stock_deductions(order_id, product_id) WHERE source = 'auto_dispatch'` — prevents duplicate auto deductions for the same order/line.
- Backfill existing rows: rows tied to an `order_id` get `source = 'auto_dispatch'`; rows without an order stay `manual` (no such rows expected today, but safe).

### 2. RPC: `dispatch_order_atomic(p_order_id uuid)`
- `SECURITY DEFINER`, validates `company_id = get_company_id()` (RBAC inherited from RLS).
- Idempotent: if any `auto_dispatch` row exists for this order, skip deduction and just set status — prevents double-deduct on retries.
- Loops `order_lines`:
  - Inserts `stock_deductions { source: 'auto_dispatch', ... }` per line.
  - `UPDATE stock_items SET quantity = quantity - line.qty` (or inserts a negative row if missing). Negative allowed.
- Sets `orders.delivery_status = 'dispatched'`, `dispatch_date = COALESCE(passed_date, current_date)`, plus vehicle/driver/remarks passed in.
- Returns `{ ok, warnings: [{product_id, before, after, required}] }` for UI logging.
- If `godown_id IS NULL`: writes to `error_log` (source `dispatch_order_atomic.no_godown`) and skips deduction but still flips status (matches "skip auto-deduction and log a warning" spec).

### 3. RPC: `reverse_dispatch_for_order(p_order_id uuid)`
- Called when `delivery_status` moves away from `dispatched/delivered` back to `pending`, or when a return claim runs with `restore_stock = true`, or when status moves to `returned`.
- Deletes `stock_deductions` rows where `order_id = p_order_id AND source = 'auto_dispatch'` — the existing `restore_stock_on_deduction_delete` trigger restores `stock_items.quantity` automatically.
- Inserts mirror `stock_deductions { source: 'return_reversal', quantity_deducted: -qty }` rows for audit trail (so the log shows the reversal). These have `order_id = NULL` to avoid tripping the unique index and the auto-restore trigger.

### 4. Preview RPC: `preview_dispatch_impact(p_order_id uuid)`
- Returns rows: `{ product_id, product_name, required_qty, current_qty, after_qty, will_go_negative }`.
- Used by the new confirm modal — no writes.

### 5. Client wiring
- `useOrdersDomain.updateOrder`: when `pending → dispatched`, call `supabase.rpc('dispatch_order_atomic', ...)` instead of the current `deductStockForOrder`. On failure: surface error, leave order pending. On success: refetch stock + log activity ("Dispatched. Stock updated for N products.").
- When status moves to `returned` OR from `dispatched/delivered → pending`: call `reverse_dispatch_for_order`.
- `useClaimsDomain` (return + `restoreStock`): call `reverse_dispatch_for_order` (replace any existing manual restore).
- Delete `useStockDomain.deductStockForOrder` (or keep as thin wrapper that just calls the RPC — pick wrapper to avoid touching `addOrder` callers).

### 6. UI — OrderDetail dispatch confirm modal
- When user changes delivery status to `dispatched` (or saves with that change) AND previous status was `pending` AND a godown is selected:
  - Call `preview_dispatch_impact`.
  - Show modal listing each line: `Product · need X · in stock Y · after Y−X`. Rows where `will_go_negative` get a terracotta highlight + warning icon + sentence: "⚠️ {Product} will go below zero. Current X, Required Y."
  - CTA: **"Confirm dispatch & deduct stock"** (or Cancel).
  - On confirm → call the RPC. Show toast `Dispatched. Stock updated for N products.` On error → toast + status stays `pending`.
- Accountant role: hide the confirm button (already pattern in app for RBAC) — view-only access to status.

### 7. Stock page — deduction log surfacing
- On Stock page (or a per-product drawer), add a small "Recent deductions" panel showing last 20 `stock_deductions` rows with source badge (`manual` / `auto_dispatch` / `return_reversal`). Source is the only new UI affordance; quantities and dates already exist.

### 8. Edge cases handled
- **Idempotency**: partial unique index + RPC short-circuit.
- **Missing godown**: skip + error_log.
- **Negative stock**: allowed, surfaced both in preview and post-toast warning.
- **Multi-godown**: out of scope, RPC assumes one `godown_id` per order (matches schema).
- **Existing manual deductions before this feature**: backfill stamps them as `auto_dispatch` since they came from the existing client-side deducter — keeps the unique index honest.

## Technical notes
- All deduction logic is `SECURITY DEFINER` with `search_path = public` and an explicit `company_id` ownership check.
- Existing `restore_stock_on_deduction_delete` trigger is the cleanest reversal lever — we lean on it instead of writing a parallel "add back" path.
- The dispatch RPC composes status update + deductions in a single transaction → atomic, eliminates the "half-dispatched" risk called out in the brief.
- Tests to add: `useOrdersDomain.test.ts` — RPC-mock for `dispatch_order_atomic` (success, idempotent re-call, missing godown, reversal on status revert).

## Files touched
- New migration: `add stock_deductions.source + dispatch RPCs + reverse RPC + preview RPC`
- `src/context/domains/useOrdersDomain.ts` — switch to RPC + reversal call
- `src/context/domains/useStockDomain.ts` — slim `deductStockForOrder` to RPC wrapper (or remove)
- `src/context/domains/useClaimsDomain.ts` — call reverse RPC on return-with-restore
- `src/pages/OrderDetail.tsx` — dispatch preview modal
- `src/pages/Stock.tsx` (or a small drawer) — recent deductions w/ source badge
- Tests: `src/context/domains/__tests__/useOrdersDomain.test.ts`
