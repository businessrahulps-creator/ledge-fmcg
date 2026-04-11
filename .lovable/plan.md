

# Fix: Duplicate stock_items + Remove seed data from new signups

## Changes

### 1. Database migration: Add unique constraint on stock_items
```sql
ALTER TABLE stock_items
ADD CONSTRAINT stock_items_company_product_godown_unique
UNIQUE (company_id, product_id, godown_id);
```

### 2. Update `addStockItem` in `src/context/DataContext.tsx` (lines 481-489)
Change `.insert()` to `.upsert()` with `onConflict: "company_id,product_id,godown_id"`. On conflict, the upserted row replaces quantity and threshold with the new values. The caller (`handleAddStock` in Stock.tsx) already computes `existing.quantity + addStockQty` before calling this, so the upsert value is correct.

### 3. Database migration: Remove seed data from `setup_new_company` RPC
Replace the `setup_new_company` function to remove the `PERFORM seed_company_data(p_company_id)` call. The function will still create the company, link the profile, and assign super_admin — just no demo data.

### Files changed
| File | Change |
|------|--------|
| Migration SQL | Add unique constraint + replace `setup_new_company` without seed call |
| `src/context/DataContext.tsx` | `addStockItem`: `.insert()` → `.upsert()` with `onConflict` |

### What stays untouched
- `handleAddStock` in Stock.tsx — no change
- `updateStockItem` — no change
- Health badges, realtime, UI — no change
- Existing accounts with data — unaffected

