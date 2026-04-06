

# Fix: "duplicate key violates unique constraint orders_order_number_key"

## Root Cause

The `orders` table has a `UNIQUE (order_number)` constraint that is **global** — not scoped per company. Since all companies use the same prefix format (`ORD-2026-XXXX`), when two companies reach the same sequence number, the insert fails.

## Fix

One migration with two changes:

1. **Drop** the global `orders_order_number_key` unique constraint
2. **Add** a compound unique constraint on `(company_id, order_number)` — order numbers only need to be unique within a company

```sql
ALTER TABLE orders DROP CONSTRAINT orders_order_number_key;
ALTER TABLE orders ADD CONSTRAINT orders_company_order_number_key UNIQUE (company_id, order_number);
```

No code changes needed — the `addOrder` logic in `DataContext.tsx` already scopes order number generation per company via `get_next_order_number(target_company_id)`.

## Files Changed
| Action | File |
|--------|------|
| Create | Migration SQL (one file) |

## Result
Order creation will work for all companies independently, even when they share the same prefix/sequence range.

