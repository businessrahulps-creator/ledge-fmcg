

# Fix Bug #16: Stale State in safeRefetchStockItems

## Problem
`safeRefetchStockItems` (line 466-487 in DataContext.tsx) joins stock_items with `rawProducts` and `locations` from React state via closure. During rapid updates, these can be stale, causing missing product names, SKUs, and godown names.

## Fix
Inside `safeRefetchStockItems`, fetch `products` and `godowns` tables fresh from Supabase alongside `stock_items`, then join using the fresh data. Remove `rawProducts` and `locations` from the dependency array.

## Changes

**File: `src/context/DataContext.tsx`** — Edit `safeRefetchStockItems` (lines 466-487):

1. Add parallel fetches for `products` and `godowns` alongside the existing `stock_items` fetch
2. Use the freshly fetched products/godowns arrays for the join mapping instead of `rawProducts`/`locations`
3. Change dependency array to `[companyId]` only

```text
Before:
  const { data } = await supabase.from("stock_items")...
  const prod = rawProducts.find(...)
  const gd = locations.find(...)
  }, [companyId, rawProducts, locations]);

After:
  const [siRes, prodRes, gdRes] = await Promise.all([
    supabase.from("stock_items").select("*").eq(...)...,
    supabase.from("products").select("*").eq(...)...,
    supabase.from("godowns").select("*").eq(...)...,
  ]);
  const prods = prodRes.data || [];
  const gds = gdRes.data || [];
  // join using prods/gds instead of rawProducts/locations
  }, [companyId]);
```

## Scope
- Only `safeRefetchStockItems` in DataContext.tsx is modified
- No UI, no other pages, no other functions changed
- Realtime subscription unchanged
- Health badges, totals, all UI identical

