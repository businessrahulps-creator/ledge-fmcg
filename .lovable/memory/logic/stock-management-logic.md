---
name: Stock management logic
description: Auto-deduction on dispatch is now LIVE — handled by dispatch_order_atomic RPC with idempotency, preview, and return reversal
type: feature
---
- Stock auto-deducts when an order transitions `pending → dispatched`, via Postgres RPC `dispatch_order_atomic(p_order_id, ...)`. Atomic + idempotent (partial unique index on `stock_deductions(order_id, product_id) WHERE source='auto_dispatch'`).
- `stock_deductions.source ∈ {manual, auto_dispatch, return_reversal}`.
- Reversal: `reverse_dispatch_for_order(p_order_id)` deletes auto-dispatch rows (existing `restore_stock_on_deduction_delete` trigger adds qty back) and writes mirror `return_reversal` audit rows with `order_id = NULL` (the delete-trigger skips reversal rows).
- Called from `useOrdersDomain.updateOrder` on `pending → dispatched` (forward) and on `dispatched|delivered → pending` (reverse), and from `useBillingDomain.addClaim` when `restoreStock = true`.
- UI: OrderDetail shows a "Confirm dispatch & deduct stock" modal sourced from `preview_dispatch_impact` RPC. Rows that will go below zero are highlighted in destructive color; dispatch is still allowed.
- Missing `godown_id`: dispatch proceeds, deduction is skipped, and a warning row is written to `error_log` (`dispatch_order_atomic.no_godown`).
- Accountant role does not see the confirm dispatch UI.
- Multi-godown per order: NOT supported; one `godown_id` per order.
