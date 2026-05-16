## Goal

Split the value emitted by `DataProvider` across two inner contexts (`CatalogContext`, `TransactionalContext`) without changing any consumer, any Supabase query, or any domain hook file. `useData()` keeps returning the exact same merged shape.

This is a **distribution-only split**: the outer `DataProvider` retains all orchestration (auth wiring, `fetchAll`, `loadFromCache`, sync queue, realtime channel, `loading`/`isRefreshing`/`isOfflineData`/`companyInfo`/`refreshAll`/`orderPrefix`/`orderSequence`). The two new contexts are pure value-distribution layers — they receive already-loaded slices via props from `DataProvider` and expose them to future narrow consumers (`useCatalog()`, `useTransactional()`).

No file moves, no rename, no logic change. Zero risk to existing pages.

## File-by-file changes

### 1. New: `src/context/CatalogContext.tsx`

- Defines `CatalogContextType` (subset of `DataContextType`): `products`, `schemes`, `distributors`, plus their CRUD actions (`addDistributor`, `updateDistributor`, `deleteDistributor`, `addProduct`, `updateProduct`, `deleteProduct`, `addScheme`, `updateScheme`, `deleteScheme`).
- Exports `CatalogContext` (default `null`), `CatalogProvider` (thin wrapper: `<CatalogContext.Provider value={value}>{children}</...>`), and `useCatalog()` hook (throws if no provider, mirrors `useData`'s no-provider stub policy with a small catalog-only `NOOP_CATALOG_STUB`).
- Note: dealers are placed in Catalog per the brief ("read-heavy, rarely mutated"). Confirmed acceptable because dealers domain hook has no cross-context dependency.

### 2. New: `src/context/TransactionalContext.tsx`

- Defines `TransactionalContextType` (subset): `orders`, `invoices`, `claims`, `locations`, `stockItems`, `secondarySales`, `targets`, `salespersons` (salespersons stays here — they're tied to orders/targets activity), plus all their CRUD actions and helpers (`addOrder`, `updateOrder`, `deleteOrder`, `addInvoice`, …, `addTarget`, `setStockItems`, `nextOrderNumber`, `previewOrderNumber`).
- Exports `TransactionalContext`, `TransactionalProvider`, `useTransactional()` with the same stub policy.

> Note: I'll flag the salespersons placement in the PR description — the brief lists "products, schemes, dealers" for Catalog and "orders, invoices, claims, stock, targets" for Transactional, but doesn't say where salespersons go. Putting them in Transactional keeps the catalog purely "things you sell" and the transactional context "things that move." If you'd rather they live in Catalog, that's a one-line move.

### 3. Modified: `src/context/DataContext.tsx`

- Keeps every effect, callback, domain-hook call, and state variable exactly as today.
- The final `useMemo` value object is split into two pre-memoized slices:

  ```ts
  const catalogValue = useMemo<CatalogContextType>(() => ({
    products: computedProducts, schemes: catalog.schemes, distributors: computedDistributors,
    addDistributor: dealers.add, updateDistributor: dealers.update, deleteDistributor: dealers.remove,
    addProduct: catalog.addProduct, updateProduct: catalog.updateProduct, deleteProduct: catalog.deleteProduct,
    addScheme: catalog.addScheme, updateScheme: catalog.updateScheme, deleteScheme: catalog.deleteScheme,
  }), [/* only catalog deps */]);

  const transactionalValue = useMemo<TransactionalContextType>(() => ({
    orders: orders.orders, invoices: billing.invoices, claims: billing.claims,
    locations: stock.locations, stockItems: stock.stockItems,
    secondarySales: targets.secondarySales, targets: targets.targets,
    salespersons: computedSalespersons,
    /* ...all transactional CRUD... */
  }), [/* only transactional deps */]);

  const value = useMemo<DataContextType>(() => ({
    ...catalogValue, ...transactionalValue,
    loading, isRefreshing, isOfflineData, companyInfo, updateCompanyInfo,
    orderPrefix: orders.orderPrefix, orderSequence: orders.orderSequence,
    setOrderPrefix: orders.setOrderPrefix, refreshAll,
  }), [catalogValue, transactionalValue, loading, isRefreshing, isOfflineData, companyInfo, updateCompanyInfo, orders.orderPrefix, orders.orderSequence, orders.setOrderPrefix, refreshAll]);
  ```

- Render tree at the bottom of `DataProvider`:

  ```tsx
  return (
    <DataContext.Provider value={value}>
      <CatalogProvider value={catalogValue}>
        <TransactionalProvider value={transactionalValue}>
          {children}
        </TransactionalProvider>
      </CatalogProvider>
    </DataContext.Provider>
  );
  ```

- `useData()` body is **unchanged**. It still reads `DataContext`. Same merged shape, same stub policy, same throw behaviour.

### 4. No change to `AppLayout.tsx` / `App.tsx`

The brief asks for `<CatalogContext> > <TransactionalContext> > {children}` nesting at the app root, but since `DataProvider` is already mounted at the root and now renders both inner providers inside itself, nesting at `App.tsx` would create a double-provider bug. Mounting them inside `DataProvider` is the only correct shape given the shared orchestration. **I'll flag this deviation in the PR.**

### 5. No changes to any domain hook, `data-utils.ts`, `data-types.ts`, or any consumer

`data-types.ts` gets two new exported types (`CatalogContextType`, `TransactionalContextType`) alongside the existing `DataContextType`. No existing exports change.

## What this gives us (and what it doesn't)

- ✅ Zero consumer changes. `useData()` shape and behaviour identical.
- ✅ Future-ready: new code can `useCatalog()` or `useTransactional()` for narrower subscriptions.
- ✅ No risk to fetchAll ordering, realtime channel, sync queue, or cross-domain wiring (orders↔stock, billing↔orders) — all unchanged.
- ⚠️ **No immediate re-render reduction.** Every current consumer calls `useData()`, which subscribes to the merged `DataContext` — so any mutation still re-renders them exactly as today. The split only pays off as consumers migrate to the narrower hooks in follow-up PRs.

## Verification checklist (post-implementation)

1. `useData()` return type literally equals current `DataContextType` (TS compile check).
2. Grep: no consumer file changed.
3. Manual smoke: load `/orders`, create order, dispatch, edit dealer, edit scheme — all behave identically.
4. React DevTools: confirm three providers nested (Data → Catalog → Transactional).
5. Confirm `NOOP_DATA_STUB` still serves transient sign-out (no regression on logout from `/orders`).

## Out of scope (explicitly)

- Migrating any consumer to `useCatalog`/`useTransactional`.
- Splitting `fetchAll` or the realtime channel.
- Moving domain-hook files.
- Touching `data-utils.ts` query logic.
