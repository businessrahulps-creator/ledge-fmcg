

## Plan — Ship items 1-8 (skip #9)

Eight tiny polish improvements, sequenced safely. No new features.

### 1. Skeleton loaders on list pages
Replace `Loading...` text in `Orders.tsx`, `Billing.tsx`, `Stock.tsx` with existing `TablePageSkeleton` / `ListPageSkeleton` from `page-skeleton.tsx`.

### 2. Confirm dialogs for destructive actions
Audit delete buttons in `Distributors.tsx`, `Salespersons.tsx`, `Stock.tsx` (warehouses + products). Wrap any raw delete handlers in the existing `AlertDialog` pattern already used elsewhere.

### 3. Auto-focus first input in Create modals
Add `autoFocus` to the first input field of New Dealer, New Salesperson, New Warehouse, New Product, New Scheme, New Target modals.

### 4. Lazy-load PDF components
Wrap `OrderInvoicePdf`, `GstInvoicePdf`, `DealerStatementPdf`, `SalespersonStatementPdf`, `PerformanceReportPdf`, `ReportPdf` imports in `React.lazy()` at their consumer sites (`ExportPdfModal.tsx`, `Billing.tsx`, etc.). Wrap render in `<Suspense>` with a small spinner.

### 5. Guard zero/negative qty & price in NewOrder
In `NewOrder.tsx` save handler, validate every line: `quantity > 0` and `price > 0`. If not, `toast.error` and abort save.

### 6. Persist filters on Orders & Billing
Read/write active filter state (search, status, date range) to `sessionStorage` keyed by page name. Restore on mount.

### 7. Extract row-mappers in `useOrdersDomain` & `useStockDomain`
Mirror the `mapInvoiceRow` / `mapClaimRow` pattern from `useBillingDomain`. Add `mapOrderRow`, `mapStockItemRow`, `mapGodownRow`, `mapProductRow` (where missing) using `Database` row types. Replace inline `(x: any) => ({...})` calls.

### 8. Amount in words on GST invoice PDF
In `GstInvoicePdf.tsx`, import `numberToWords` and render "Rupees X Only" line under the grand total. Already has the helper, just needs wiring.

### Execution order
P0 (visible polish): 1 → 2 → 3 → 8
P1 (perf + reliability): 4 → 5 → 6
P2 (refactor): 7

Will ship sequentially, one consolidated `POLISH PASS COMPLETE` summary at the end.

### Files touched
`Orders.tsx`, `Billing.tsx`, `Stock.tsx`, `Distributors.tsx`, `Salespersons.tsx`, `NewOrder.tsx`, plus relevant New* modal components, `ExportPdfModal.tsx`, `GstInvoicePdf.tsx`, `useOrdersDomain.ts`, `useStockDomain.ts`. No new files, no new deps.

### Stays the same
All business logic, RLS, realtime, validation rules, design tokens, mobile-first layout.

