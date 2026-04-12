

# Feature #2: Credit Guard + Real-time Outstanding Alert

## Overview
Add credit limit tracking per dealer. Block orders that would exceed a dealer's credit limit (non-paid outstanding), with Super Admin override. Show credit health badges on dealer cards and a "Credit at Risk" widget on Dashboard/Performance.

## Database Changes

### Migration 1: Add columns to `distributors`
```sql
ALTER TABLE distributors
  ADD COLUMN credit_limit numeric NOT NULL DEFAULT 0,
  ADD COLUMN outstanding_amount numeric NOT NULL DEFAULT 0;
```

### Migration 2: Replace `refresh_entity_aggregates` trigger function
Update the existing function to also compute `outstanding_amount` as the sum of `total` from orders where `payment_status IN ('pending', 'partial')` for that distributor. This runs on every order INSERT/UPDATE/DELETE, keeping `outstanding_amount` always current.

### Migration 3: Backfill outstanding amounts
```sql
UPDATE distributors d SET outstanding_amount = COALESCE(sub.amt, 0)
FROM (SELECT distributor_id, SUM(total) amt FROM orders WHERE payment_status IN ('pending','partial') GROUP BY distributor_id) sub
WHERE d.id = sub.distributor_id;
```

## Code Changes

### 1. `src/data/mock-data.ts` — Distributor interface
Add `creditLimit: number` and `outstandingAmount: number` fields.

### 2. `src/context/DataContext.tsx` — Map new columns
In `fetchAll`, map `credit_limit` → `creditLimit` and `outstanding_amount` → `outstandingAmount` when building Distributor objects.

### 3. `src/pages/Distributors.tsx`
- **Add/Edit dialog**: Add a "Credit Limit (₹)" input field (numeric, default 0 = unlimited).
- **Dealer cards**: Show a credit health badge below the order stats:
  - Green: outstanding < 70% of limit (or limit = 0 meaning unlimited)
  - Yellow: 70-100% of limit
  - Red: ≥ 100% of limit
  - Format: "₹X / ₹Y" or "₹X / Unlimited"
- **Dealer profile dialog**: Add an "Outstanding / Credit Limit" stat card with the same color coding.

### 4. `src/pages/NewOrder.tsx` — Credit guard on save
- After dealer is selected, compute `newOutstanding = dealer.outstandingAmount + orderTotal` (only if payment status is pending/partial).
- If `dealer.creditLimit > 0 && newOutstanding > dealer.creditLimit`:
  - Show a warning banner below the dealer selector (yellow/red).
  - On save: block with toast error for non-Super Admin users.
  - For Super Admin: show an AlertDialog confirmation ("This order exceeds credit limit. Proceed?").
- Uses `useAuth().userRole` to check if `super_admin`.

### 5. `src/pages/Orders.tsx` — Credit guard on edit
- When changing `paymentStatus` from `paid` to `pending/partial`, check if updated outstanding would exceed limit.
- Same blocking logic as NewOrder.

### 6. `src/pages/Dashboard.tsx` — "Credit at Risk" widget
- Add a small card showing count of dealers where `outstandingAmount >= creditLimit` (and `creditLimit > 0`).
- Red badge with count. Clicking navigates to `/dealers`.

### 7. `src/pages/Performance.tsx` — "Credit at Risk" widget
- Same widget as Dashboard, placed in the KPI row.

### 8. `src/services/api.ts` — No changes needed
Dealers already pass through DataContext which will carry the new fields.

### 9. Offline behavior
- Credit check is purely client-side (compares in-memory dealer data + order total), so works offline.
- The `credit_limit` field is stored/cached in IDB with the distributor entity.
- `outstanding_amount` updates happen via the DB trigger on sync; offline the client uses optimistic local state.

## Files touched
- 1 migration (add columns + update trigger + backfill)
- `src/data/mock-data.ts` (2 fields)
- `src/context/DataContext.tsx` (map 2 fields)
- `src/pages/Distributors.tsx` (credit limit input + badge)
- `src/pages/NewOrder.tsx` (credit guard)
- `src/pages/Orders.tsx` (credit guard on edit)
- `src/pages/Dashboard.tsx` (at-risk widget)
- `src/pages/Performance.tsx` (at-risk widget)

