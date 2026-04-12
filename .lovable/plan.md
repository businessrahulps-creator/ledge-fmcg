

# Accounting → Billing Implementation Plan

## Analysis of Previous Plan

The previously proposed plan is well-aligned with all user constraints. Key confirmations:
- **Order PDF untouched**: `OrderInvoicePdf.tsx`, `ExportPdfModal.tsx`, and Orders page PDF flow will not be modified.
- **No order creation from Billing**: Only pull from existing orders or create standalone documents.
- **Multi-document types**: GST Invoice, Invoice, Estimate, Proforma, Credit Note — differentiated by `doc_type` field.
- **Company Settings**: Missing fields (phone, email, PAN, state_code, bank details) will be added to `companies` table and Settings UI.
- **Immutability**: Invoices snapshot all data at creation. Final documents are locked.
- **Precision**: All monetary columns use `numeric`; JS uses `Math.round(value * 100) / 100`.

No gaps found. Proceeding with implementation as planned.

## Implementation Steps

### 1. Database Migration
- Add columns to `companies`: `phone`, `email`, `pan`, `state_code`, `bank_name`, `bank_account`, `bank_ifsc`, `invoice_prefix`, `next_invoice_sequence`
- Add `hsn_code` to `products`
- Create `invoices` table (with doc_type, buyer/seller snapshots, GST fields, status)
- Create `invoice_lines` table
- Create atomic `get_next_invoice_number()` function
- Add `updated_at` trigger on invoices
- Company-scoped RLS on both tables

### 2. Settings Page — Add Company Fields
Add Phone, Email, PAN, State Code, Bank Name, Account Number, IFSC, Invoice Prefix fields to the Company tab. Save alongside existing fields.

### 3. DataContext — Extend CompanyInfo + Add Invoices
- Extend `CompanyInfo` with new fields
- Add `Invoice` and `InvoiceLine` interfaces
- Add `invoices` state, `addInvoice`, `updateInvoice` functions
- Fetch invoices and invoice_lines on load

### 4. Sidebar — "Accounting" Section
New section between "Manage" and "Analyze" with `Receipt` icon → "Billing" link.

### 5. New Page: `src/pages/Billing.tsx`
- Invoice list with doc type badge, number, date, buyer, amount, status
- "New Document" dialog: type selector, optional order pull, buyer details, GST config, line items, auto-calculated totals
- Download PDF per document
- Only drafts can be edited/deleted; final documents locked

### 6. New PDF: `src/components/pdf/GstInvoicePdf.tsx`
Separate from OrderInvoicePdf. Full GST-compliant layout with seller/buyer blocks, HSN codes, tax breakdown, bank details, amount in words.

### 7. Utility: `src/utils/numberToWords.ts`
Indian currency number-to-words converter.

### 8. Route + API
- `/billing` protected route in App.tsx
- Expose invoices CRUD via `useApi()`

## Files Modified/Created

| Action | File |
|--------|------|
| Migration | companies columns + hsn_code + invoices + invoice_lines + function + RLS |
| Modify | `src/pages/Settings.tsx` — new company fields |
| Modify | `src/components/layout/AppSidebar.tsx` — Accounting section |
| Modify | `src/App.tsx` — /billing route |
| Modify | `src/context/DataContext.tsx` — CompanyInfo + invoices state |
| Modify | `src/services/api.ts` — invoices API |
| New | `src/pages/Billing.tsx` |
| New | `src/components/pdf/GstInvoicePdf.tsx` |
| New | `src/utils/numberToWords.ts` |

**Untouched**: OrderInvoicePdf.tsx, ExportPdfModal.tsx, Orders.tsx PDF flow, all existing features.

