

# Add HSN Code to Product Management

## Problem
The `products` database table already has an `hsn_code` column, but it's completely ignored throughout the application — the Product interface, data mapping, CRUD operations, and the product form all skip it. Users must manually enter HSN codes later in the billing section, which is redundant and error-prone.

## Root Cause
The `Product` TypeScript interface in `mock-data.ts` was never updated to include `hsnCode`, so the entire chain (mapping, form, insert/update) ignores the existing DB column.

## Changes (5 files, ~15 lines each)

### 1. `src/data/mock-data.ts` — Add `hsnCode` to Product interface
Add `hsnCode: string` field to the `Product` interface.

### 2. `src/context/data-utils.ts` — Map `hsn_code` in `mapProduct`
Include `hsnCode: p.hsn_code || ""` in the mapping function.

### 3. `src/context/domains/useCatalogDomain.ts` — Persist `hsn_code` on insert/update
Add `hsn_code: sanitizeInput(p.hsnCode)` to the product CRUD column mapper.

### 4. `src/pages/Stock.tsx` — Add HSN Code field to product form
- Update `openNewProduct` default to include `hsnCode: ""`.
- Add an HSN Code input field in the product dialog (between SKU/Unit row and Base Price).
- Show HSN code in the product list/table where relevant.

### 5. `src/pages/Billing.tsx` — Auto-populate HSN from product catalogue
When generating an invoice from an order, look up each line's product in the catalogue and pre-fill `hsnCode` from the product record instead of requiring manual entry.

### Downstream benefit
Once HSN codes are stored on products, every invoice and PDF generated from orders will automatically carry the correct HSN — no manual re-entry needed.

