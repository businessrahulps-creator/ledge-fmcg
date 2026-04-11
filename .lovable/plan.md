

# Fix Bug #14: Handle Supabase 1,000-Row Query Limit

## Problem
All list queries in `DataContext.tsx` rely on the Supabase default 1,000-row limit. Large datasets will be silently truncated.

## Changes

### 1. `src/context/DataContext.tsx` — `fetchAll` function (lines 189-196)
Add `.range(0, 9999)` and `.order()` to every list query:

```
distributors  → .order("name").range(0, 9999)
salespersons  → .order("name").range(0, 9999)
products      → .order("name").range(0, 9999)
godowns       → .order("name").range(0, 9999)
stock_items   → .order("created_at", { ascending: false }).range(0, 9999)
orders        → already has .order() → add .range(0, 9999)
```

### 2. `src/context/DataContext.tsx` — `order_lines` query (lines 236-237)
Add `.range(0, 9999)` to the order_lines `.in()` query.

### 3. `src/context/DataContext.tsx` — All `safeRefetch*` functions (lines 394-479)
Apply matching `.order()` and `.range(0, 9999)` to each:
- `safeRefetchOrders` (line 397): add `.range(0, 9999)` to orders query; add `.range(0, 9999)` to order_lines query (line 402)
- `safeRefetchDistributors` (line 414): add `.order("name").range(0, 9999)`
- `safeRefetchSalespersons` (line 426): add `.order("name").range(0, 9999)`
- `safeRefetchProducts` (line 438): add `.order("name").range(0, 9999)`
- `safeRefetchGodowns` (line 450): add `.order("name").range(0, 9999)`
- `safeRefetchStockItems` (line 462): add `.order("created_at", { ascending: false }).range(0, 9999)`

### 4. `src/hooks/use-notifications.tsx` — Already handled
Already uses `.limit(50)` — no change needed.

### Files touched
- `src/context/DataContext.tsx` only

### Not changed
- No UI changes, no pagination, no new features
- All realtime subscriptions, filters, and search logic remain unchanged

