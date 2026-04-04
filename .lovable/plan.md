

# API Service Layer + Dynamic Year Fix

## Overview
Create `src/services/api.ts` as an abstraction layer over DataContext, structured like future Supabase calls. Fix `nextOrderNumber` to use the current year dynamically. Update all 10 consumer components to use the API functions.

## Changes

### 1. Fix `nextOrderNumber` in `src/context/DataContext.tsx`
Replace hardcoded `ORD-2026-` with `ORD-${new Date().getFullYear()}-`.

### 2. Create `src/services/api.ts`
A hook-based API module that wraps `useData()` and returns namespaced functions:

```ts
export function useApi() {
  const data = useData();
  return {
    orders: {
      list: () => data.orders,
      create: (order: Order) => data.addOrder(order),
      updateStatus: (id, status) => data.updateOrder(id, { status }),
      update: (id, updates) => data.updateOrder(id, updates),
      nextNumber: () => data.nextOrderNumber(),
    },
    dealers: {
      list: () => data.distributors,
      create: (d) => data.addDistributor(d),
      update: (d) => data.updateDistributor(d),
      remove: (id) => data.deleteDistributor(id),
    },
    salespersons: { /* same pattern */ },
    products: { /* same pattern */ },
    stock: {
      items: { list, create, update, remove, setAll },
      locations: { list, create, update, remove },
    },
  };
}
```

### 3. Update all consumer components (10 files)
Replace `useData()` with `useApi()` and update call sites:

| File | Current | New |
|------|---------|-----|
| `Dashboard.tsx` | `useData()` → orders, distributors, products | `useApi()` → orders.list(), dealers.list(), products.list() |
| `Orders.tsx` | orders, updateOrder | orders.list(), orders.update() |
| `NewOrder.tsx` | products, distributors, salespersons, addOrder, nextOrderNumber | products.list(), dealers.list(), etc. |
| `Distributors.tsx` | distributors, addDistributor, etc. | dealers.list(), dealers.create(), etc. |
| `Salespersons.tsx` | salespersons, addSalesperson, etc. | salespersons.list(), etc. |
| `Stock.tsx` | locations, stockItems, add/update/delete | stock.items.list(), stock.locations.list(), etc. |
| 5 Report components | orders, distributors, etc. | orders.list(), dealers.list(), etc. |

### 4. Keep DataContext intact
`useData()` remains available internally. `useApi()` is the public-facing hook. When Supabase is connected later, only `api.ts` internals change — zero component edits needed.

## File count
- 1 new file: `src/services/api.ts`
- 1 edit: `src/context/DataContext.tsx` (year fix)
- 10 edits: all consumer components (swap `useData` → `useApi`)

