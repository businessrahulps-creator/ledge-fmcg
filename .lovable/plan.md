

# Refactor: Split DataContext into Domain-Specific Contexts

## Problem
`DataContext.tsx` is 1,648 lines managing 10+ entity domains (orders, dealers, salespersons, products, stock, schemes, invoices, claims, targets, secondary sales) plus infrastructure (offline queue, realtime, caching). This makes it hard to maintain, test, and reason about.

## Key Insight
All 23 consumer files use `useApi()` from `src/services/api.ts`, which wraps `useData()`. None call `useData()` directly. This means we can restructure the internals without touching any page or component.

## Architecture

```text
DataProvider (orchestrator)
├── CoreDataProvider     (fetchAll, realtime, offline sync, companyInfo)
│   ├── OrdersProvider   (orders, order lines, order schemes, stock deduction)
│   ├── DealersProvider  (distributors CRUD)
│   ├── SalesProvider    (salespersons CRUD)
│   ├── CatalogProvider  (products, schemes)
│   ├── StockProvider    (stock items, locations/godowns)
│   ├── BillingProvider  (invoices, claims)
│   └── TargetsProvider  (targets, secondary sales)
└── useData() — composes all sub-contexts into one object (unchanged interface)
```

## Approach

### Phase 1: Extract types (no behavior change)
Create `src/context/data-types.ts` with all interfaces (`CompanyInfo`, `Invoice`, `SecondarySale`, `Target`, `Claim`, `ClaimLine`, `InvoiceLine`, `AddOrderResult`). Currently these are exported from DataContext — re-export them from the same path for backward compat.

### Phase 2: Extract shared utilities
Create `src/context/data-utils.ts` with:
- `mapOrders()` helper
- `persistAllToCache()` / `persistEntityToCache()`
- `makeOfflineCrud()` generic factory
- `batchIn()` batch query helper

### Phase 3: Split into domain contexts
Each file ~100-200 lines, following the same pattern:
- `src/context/domains/OrdersContext.tsx` — addOrder, updateOrder, deleteOrder, orderPrefix, orderSequence, nextOrderNumber, previewOrderNumber, deductStockForOrder
- `src/context/domains/DealersContext.tsx` — distributors CRUD via makeOfflineCrud
- `src/context/domains/SalespersonsContext.tsx` — salespersons CRUD
- `src/context/domains/CatalogContext.tsx` — products + schemes CRUD
- `src/context/domains/StockContext.tsx` — stockItems, locations, godowns CRUD
- `src/context/domains/BillingContext.tsx` — invoices + claims CRUD
- `src/context/domains/TargetsContext.tsx` — targets + secondary sales CRUD

### Phase 4: Core data provider
`src/context/CoreDataContext.tsx` handles:
- `fetchAll()` — loads all entities from DB, distributes to sub-contexts via shared setters
- Realtime subscriptions (one channel, dispatches to domain refetch functions)
- Offline queue sync on reconnect
- IDB cache loading
- `companyInfo` state
- `loading` / `isOfflineData` flags

### Phase 5: Compose in DataContext
`DataContext.tsx` shrinks to ~50 lines — just nests providers and re-exports `useData()` with the exact same `DataContextType` interface. `useApi()` and all 23 consumers remain untouched.

### Phase 6: Computed values
Move `computedDistributors`, `computedSalespersons`, `computedProducts` into their respective domain contexts (they depend on orders, so they'll receive orders as a prop/context value).

## Files Created/Modified

| File | Action | ~Lines |
|------|--------|--------|
| `src/context/data-types.ts` | Create | ~130 |
| `src/context/data-utils.ts` | Create | ~120 |
| `src/context/domains/OrdersContext.tsx` | Create | ~200 |
| `src/context/domains/DealersContext.tsx` | Create | ~80 |
| `src/context/domains/SalespersonsContext.tsx` | Create | ~60 |
| `src/context/domains/CatalogContext.tsx` | Create | ~120 |
| `src/context/domains/StockContext.tsx` | Create | ~150 |
| `src/context/domains/BillingContext.tsx` | Create | ~200 |
| `src/context/domains/TargetsContext.tsx` | Create | ~100 |
| `src/context/CoreDataContext.tsx` | Create | ~250 |
| `src/context/DataContext.tsx` | Rewrite | ~80 |

## What stays the same
- `useData()` return type — identical `DataContextType`
- `useApi()` in `src/services/api.ts` — zero changes
- All 23 consumer pages/components — zero changes
- Offline queue, realtime, caching behavior — identical
- Type exports from `@/context/DataContext` — re-exported

## Risk mitigation
- Exact same `DataContextType` interface ensures compile-time safety
- Each domain context is independently testable
- If any sub-context breaks, the error boundary catches it at the same level as today

