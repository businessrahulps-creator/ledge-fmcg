

# Plan: Vehicle/Driver on Invoices + Billing Pagination + Date Filter

## Three Issues to Address

### 1. Vehicle & Driver Details on Invoices
**Current state**: The `invoices` DB table and `Invoice` TypeScript type have no `vehicle` or `driver_name` fields. The invoice form doesn't capture them. The PDF doesn't render them.

**Fix**:
- **DB migration**: Add `vehicle text NOT NULL DEFAULT ''` and `driver_name text NOT NULL DEFAULT ''` columns to `invoices` table
- **DB migration**: Backfill demo data — update existing invoices by joining on `source_order_id` to pull `vehicle` and `driver_name` from the linked `orders` row
- **TypeScript types**: Add `vehicle` and `driver_name` to `Invoice` interface in `data-types.ts`
- **Billing form**: Auto-populate vehicle/driver from the selected order (read-only, same as buyer name). Show them in Step 2 under a "Transport Details" section. For GST invoices, mark them with a visual indicator that they're required
- **Validation**: On save, if `docType === "gst_invoice"` and vehicle or driver is empty, show toast error and block
- **PDF**: Add vehicle/driver to `InvoicePdfData` interface and render them in `GstInvoicePdf.tsx` in the invoice details section
- **`handleCreate`/`handleEdit`**: Include vehicle/driver in the data payload sent to `api.invoices.create/update`

### 2. Billing List Pagination (252 invoices = endless scroll)
**Current state**: `filtered` array is rendered in full — no pagination. With 252 invoices in demo, this causes massive DOM and poor performance.

**Fix**:
- Import `usePagination` and `ListPagination` (both already exist in the codebase)
- Paginate `filtered` with `usePagination(filtered.length, 15)`
- Slice `filtered` to `filtered.slice(from, to)` for rendering
- Add `<ListPagination>` below the table/cards

### 3. Date Period Filter for Billing History
**Current state**: Only text search and doc-type filter exist. No way to filter by date range.

**Fix**:
- Import `TimePeriodFilter` and `filterByTimePeriod` from `src/components/reports/TimePeriodFilter.tsx`
- Add a `timePeriod` state (default "all" — we'll add an "all" option)
- Apply date filtering to the `filtered` memo, mapping `invoiceDate` to `date` for the filter function
- Add a simple "All Time" + existing period options (Daily/Weekly/Monthly/Yearly) select next to the existing type filter

## Files Changed

| File | Change |
|------|--------|
| `supabase migration` | Add `vehicle`, `driver_name` columns to `invoices`; backfill from orders |
| `src/context/data-types.ts` | Add `vehicle`, `driver_name` to `Invoice` interface |
| `src/pages/Billing.tsx` | Transport fields in form, validation for GST, pagination, date filter |
| `src/components/pdf/GstInvoicePdf.tsx` | Add vehicle/driver to `InvoicePdfData` and render in PDF |
| `src/context/domains/useBillingDomain.ts` | Map new DB columns in fetch/create/update |

~150 lines of changes across 5 files + 1 migration.

