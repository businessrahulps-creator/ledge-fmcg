

# Live Computed Data from Orders

## Problem
Dashboard "Top Dealers" and "Top Products", plus the Distributors, Salespersons, and Stock pages all read hardcoded `totalOrders`, `totalValue`, and `totalSold` from mock data. These never update when new orders are created.

## Approach
Add `useMemo` computations inside `DataProvider` that enrich each entity with order-derived totals before exposing them via context. All consumers already read from `useData()`, so they'll get live values automatically — no UI changes needed.

## Changes

### 1. `src/context/DataContext.tsx`
- Add three `useMemo` blocks that compute enriched versions of distributors, salespersons, and products:
  - **distributors**: for each distributor, count orders and sum `order.total` where `distributorId` matches → override `totalOrders` and `totalValue`
  - **salespersons**: same pattern using `salespersonId`
  - **products**: for each product, sum `quantity` across all order lines where `productId` matches → override `totalSold`
- Expose the computed arrays (not the raw state) as `distributors`, `salespersons`, `products` in the context value
- Keep raw state setters for CRUD operations unchanged

### 2. No other files change
All consumers (Dashboard, Distributors page, Salespersons page, Stock page, all 5 report components) already read `.totalValue`, `.totalOrders`, `.totalSold` from context — they'll automatically reflect live data.

## Technical Detail
```
const computedDistributors = useMemo(() =>
  rawDistributors.map(d => {
    const dOrders = orders.filter(o => o.distributorId === d.id);
    return { ...d, totalOrders: dOrders.length, totalValue: dOrders.reduce((s,o) => s + o.total, 0) };
  }), [rawDistributors, orders]);
```
Same pattern for salespersons and products. Single file edit, ~20 lines added.

