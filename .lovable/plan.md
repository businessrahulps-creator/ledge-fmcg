

# Fix Stock Quantity Persistence Bug

## Problem
In `src/pages/Stock.tsx`, the `handleAddStock` function (line 224-229) handles the case where a product already exists in a warehouse by calling `setStockItems()` — a local React state setter. This never writes to the database, so changes are lost on refresh.

The Edit Inventory dialog's save handler (`saveStockItemFn`) already correctly calls `updateStockItem()`, which persists to Supabase. No change needed there.

## Fix — Single surgical edit in `src/pages/Stock.tsx`

Replace lines 224-229 in `handleAddStock`:

**Before (broken):**
```tsx
if (existing) {
  setStockItems((prev) =>
    prev.map((si) =>
      si.id === existing.id ? { ...si, quantity: si.quantity + addStockQty } : si
    )
  );
}
```

**After (persisted):**
```tsx
if (existing) {
  updateStockItem({ ...existing, quantity: existing.quantity + addStockQty });
}
```

That's it. `updateStockItem` in DataContext already:
1. Writes to Supabase (`stock_items.update`)
2. Updates local state optimistically
3. Shows error toast on failure
4. Triggers realtime subscription which calls `safeRefetchStockItems` for multi-tab sync

## What stays untouched
- Edit Inventory dialog (`saveStockItemFn`) — already correct
- Health badges, realtime subscriptions, UI layout — no changes
- `addStockItem` path for new items — already correct (line 231-248)
- Validation (lines 213-220) — already correct
- Success toast (line 250) — already in place

## Files changed
| File | Change |
|------|--------|
| `src/pages/Stock.tsx` | Replace `setStockItems` with `updateStockItem` call (lines 224-229) |

