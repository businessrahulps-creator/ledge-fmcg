

# Add Pagination to Entity Lists (Bug #15)

## Approach
Client-side pagination over the already-loaded data arrays. DataContext remains unchanged — it already fetches all rows (up to 9,999 via bug #14). Each page component manages its own page state, paginates the filtered results, and resets to page 1 when search/filters change.

This is the correct approach because:
- Realtime updates refresh full arrays in DataContext — server-side pagination would conflict
- Datasets in FMCG are typically hundreds, not millions
- Search/filter already operates on full arrays client-side

## Changes

### 1. New reusable hook: `src/hooks/use-pagination.ts`
Simple hook that accepts `totalItems` and `pageSize` (default 10), returns `{ page, totalPages, from, to, setPage, nextPage, prevPage, resetPage }`. Resets page to 1 when totalItems changes.

### 2. New component: `src/components/ui/list-pagination.tsx`
Clean pagination bar using existing `Pagination*` components from `src/components/ui/pagination.tsx`. Shows Previous/Next + up to 5 page number buttons + ellipsis. Mobile-friendly (compact on small screens). Props: `page`, `totalPages`, `onPageChange`.

### 3. Update `src/pages/Orders.tsx`
- Add `usePagination(filtered.length)` after the `filtered` memo
- Slice `filtered` by `[from, to]` for rendering
- Reset page when `debouncedSearch`, `paymentFilter`, or `deliveryFilter` change
- Render `<ListPagination>` after the table/card list, inside the glass-card

### 4. Update `src/pages/Distributors.tsx`
- Add `usePagination(filtered.length)` after the `filtered` memo
- Slice `filtered` for the grid render
- Render `<ListPagination>` after the grid

### 5. Update `src/pages/Salespersons.tsx`
- Same pattern as Distributors

### 6. Update `src/pages/Stock.tsx` (two places)
- **Products tab**: Paginate `filteredProducts`, render `<ListPagination>` after product table
- **Warehouse inventory**: Paginate `warehouseInventory`, render `<ListPagination>` after inventory table. Reset page when `selectedWarehouse` changes.

## Files touched
- `src/hooks/use-pagination.ts` (new)
- `src/components/ui/list-pagination.tsx` (new)
- `src/pages/Orders.tsx`
- `src/pages/Distributors.tsx`
- `src/pages/Salespersons.tsx`
- `src/pages/Stock.tsx`

## Not changed
- DataContext.tsx — no modifications
- Dashboard, Reports, Settings, NewOrder — untouched
- All existing UI (cards, tables, search, filters, badges) — preserved exactly

