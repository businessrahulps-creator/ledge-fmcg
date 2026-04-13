

# Fix: Invoice Shows Gross Total Instead of Net Total After Scheme Savings

## Root Cause

The `insert_order_atomic` database function creates orders with `scheme_savings = 0` (column default). The actual scheme savings value is written in a **separate UPDATE** call immediately after. However, a **realtime subscription** on the `orders` table triggers `safeRefetch()` when the INSERT fires — this refetch can read the order **before** the savings UPDATE commits, overwriting the correct local state (`schemeSavings: 1000`) with stale DB data (`scheme_savings: 0`).

When the user then opens the billing form, it sees `order.schemeSavings = 0`, discount ratio = 0, and shows the gross total (₹45,000) instead of the effective total (₹44,000).

```text
Timeline:
  addOrder() ──► RPC INSERT (savings=0) ──► Realtime fires ──► safeRefetch() reads savings=0
                                            │
                                            ├──► UPDATE savings=1000 (may not have committed yet)
                                            ├──► INSERT order_schemes
                                            └──► setOrders(schemeSavings:1000) ← gets overwritten by safeRefetch
```

## Fix (3 changes)

### 1. Update `insert_order_atomic` RPC to accept `p_scheme_savings`
Add the parameter to the function signature and include it in the INSERT statement. This makes the order atomically correct on first write — no separate UPDATE needed.

### 2. Update `useOrdersDomain.ts` — pass `scheme_savings` to RPC, remove separate UPDATE
- Add `p_scheme_savings: order.schemeSavings` to the RPC call
- Remove the separate `supabase.from("orders").update({ scheme_savings })` call (lines 107-109)

### 3. Add debounce guard to `safeRefetch` to prevent stale overwrites
Add a short debounce (~500ms) so rapid realtime events (INSERT + UPDATE in quick succession) are collapsed into a single refetch that reads the final committed state.

## Files Changed
| File | Change |
|------|--------|
| Migration SQL | ALTER `insert_order_atomic` to add `p_scheme_savings` parameter |
| `src/context/domains/useOrdersDomain.ts` | Pass savings to RPC, remove separate UPDATE |

No UI changes. No new features. All existing behavior preserved.
