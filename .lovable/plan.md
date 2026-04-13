

# Harden Data Strategy & Offline Queue Replay

## Problems Identified

After reviewing all domain hooks, `offline-store.ts`, `DataContext.tsx`, and `data-utils.ts`, here are the concrete issues:

### 1. Inconsistent offline support across domains
- **Orders, Dealers, Salespersons, Products, Schemes, Stock, Godowns**: Full offline CRUD (queue + optimistic state)
- **Billing (Invoices, Claims)**: Zero offline support — `addInvoice`, `deleteInvoice`, `addClaim`, `updateClaim`, `updateInvoice` all call Supabase directly with no `navigator.onLine` check. They silently fail offline.
- **Targets, Secondary Sales**: Zero offline support — same issue.

### 2. Replay logic is fragile
- **No idempotency**: If replay of an `insert` succeeds on the server but the `removeFromQueue` call fails (e.g. IDB write error), the mutation stays in the queue and gets replayed again, creating a duplicate row.
- **No conflict detection for updates**: An update replayed after a refetch may overwrite newer server-side data. No `updated_at` check.
- **Race condition in `reconcileTempId`**: Only checks `payload.id` — misses references to temp IDs in other payload fields (e.g. `distributor_id`, `order_id` in related mutations).
- **Stock deduction in replay is non-transactional**: The `insert_order_atomic` replay manually inserts stock deductions line-by-line. If it fails partway, you get partial deductions with no rollback.
- **Silent swallow in `syncQueue`**: Failed mutations after MAX_RETRIES are silently marked done. The user gets a generic "failed to sync" toast but no way to inspect or retry individual mutations.

### 3. State divergence after sync
- After replay, `fetchAll` is called to refresh — but the optimistic state may have accumulated changes that the refetch overwrites. This is mostly fine, but during the sync window, UI flickers and computed values (computed distributors/salespersons/products) briefly show stale data.

### 4. Delete operations blocked offline (orders) but allowed offline (dealers, stock)
- `deleteOrder` explicitly blocks offline deletion and returns false
- `makeOfflineCrud.remove` queues offline deletions for dealers/products/etc.
- This inconsistency means offline-deleted dealers can still appear in order forms, but offline-deleted orders cannot happen. Reasonable for orders, but the user gets no warning for dealers.

---

## Fix Plan

### Fix 1: Add offline guards to Billing & Targets domains
**Files**: `useBillingDomain.ts`, `useTargetsDomain.ts`

Add `navigator.onLine` checks + `enqueueMutation` for:
- `addInvoice` — queue as `insert` type with table `invoices` + separate `invoice_lines` insert
- `deleteInvoice` — block offline (same as deleteOrder — finalized docs shouldn't be queued)
- `addClaim` — queue as `insert` with stock restore deferred to replay
- `updateClaim` / `updateInvoice` — queue as `update`
- `addTarget`, `addSecondarySale` — already use `makeOfflineCrud` pattern? No — targets domain does direct Supabase calls. Add offline CRUD.

### Fix 2: Make replay idempotent
**File**: `offline-store.ts`

- For `insert` type: Add an `idempotency_key` field (the mutation `id`) to the payload. Before inserting, check if a row with that idempotency key already exists. For orders, the `insert_order_atomic` RPC already handles uniqueness via `order_number`, but for dealers/products, duplicates are possible.
- For `insert_order_atomic`: Wrap the post-RPC steps (lines + stock deductions) so that if the order already exists (from a prior partial replay), skip the RPC and just insert missing lines.
- For `update` type: Add `updated_at` comparison — only apply if the row hasn't been modified since the mutation was queued.

### Fix 3: Broader temp ID reconciliation
**File**: `offline-store.ts`

Update `reconcileTempId` to scan all payload fields (not just `payload.id`) for the temp UUID string, replacing any occurrence. This handles cases like an offline-created dealer whose ID appears in a subsequently queued order's `distributorId`.

### Fix 4: Make stock deduction in replay safer
**File**: `offline-store.ts`

Move the stock deduction logic for `insert_order_atomic` replay into a single RPC call or at minimum wrap it in a try-catch that records partial progress, so a retry doesn't double-deduct.

### Fix 5: Add retry UI for stuck mutations
**File**: `src/pages/Settings.tsx` (existing)

Add a "Pending Changes" section that shows:
- Count of queued mutations
- Each mutation: type, table, timestamp, attempts, lastError
- "Retry" button per mutation and "Retry All" button
- "Discard" button for permanently failed mutations

### Fix 6: Unify the offline delete policy
**Files**: `data-utils.ts` (makeOfflineCrud)

Add an option `allowOfflineDelete` (default: true for simple entities, false for orders/invoices). When false, show the same blocking toast as `deleteOrder`.

---

## Files Changed

| File | Change | ~Lines |
|------|--------|--------|
| `src/lib/offline-store.ts` | Idempotency keys, broader reconciliation, safer stock replay | ~80 added |
| `src/context/domains/useBillingDomain.ts` | Offline guards for all 5 operations | ~60 added |
| `src/context/domains/useTargetsDomain.ts` | Offline guards for targets + secondary sales | ~30 added |
| `src/context/data-utils.ts` | `allowOfflineDelete` option in makeOfflineCrud | ~10 changed |
| `src/pages/Settings.tsx` | "Pending Changes" UI section | ~80 added |
| `src/context/DataContext.tsx` | Pass queue inspection to Settings via context | ~5 added |

Total: 6 files, ~265 lines of changes. Zero breaking changes to existing API.

## Execution Order
1. `offline-store.ts` — idempotency + reconciliation hardening
2. `useBillingDomain.ts` — offline support
3. `useTargetsDomain.ts` — offline support
4. `data-utils.ts` — delete policy flag
5. `Settings.tsx` — retry UI
6. `DataContext.tsx` — wire up queue state

