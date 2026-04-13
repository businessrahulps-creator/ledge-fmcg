

# Fix GST Invoice Account Holder Name + WhatsApp Share

## Issues Found

**1. Account Holder Name missing from GST Invoice PDF**
- The `invoices` table has no `seller_bank_account_name` column
- The `InvoicePdfData` interface lacks the field
- The PDF template's Bank Details section only shows Bank, Account No, IFSC — no account holder name
- The company table _does_ have `bank_account_name`, but it's never propagated to invoices

**2. WhatsApp share not working in Billing**
- `shareInvoiceOnWhatsApp(inv)` passes an `Invoice` object directly, but the function expects `InvoiceShareData`
- The `Invoice` interface is missing a `sellerBankAccountName` field (needed for the PDF generation inside the share function)
- The `GstInvoicePdf` component also needs the new field to render the account holder name

## Plan

### 1. Database migration — Add `seller_bank_account_name` to `invoices`
```sql
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS seller_bank_account_name TEXT NOT NULL DEFAULT '';
```

### 2. Update `InvoicePdfData` interface + PDF template
- Add `sellerBankAccountName` to `GstInvoicePdf`'s `InvoicePdfData` interface
- Render "A/c Holder" card in the Bank Details section alongside Bank, Account No, IFSC

### 3. Update `Invoice` interface in DataContext
- Add `sellerBankAccountName: string` to the `Invoice` interface
- Map `seller_bank_account_name` when fetching invoices
- Include it when inserting/updating invoices (populate from company's `bankAccountName`)

### 4. Update `InvoiceShareData` + share function
- Add `sellerBankAccountName` to `InvoiceShareData` interface
- Pass it through to `GstInvoicePdf` in the `shareInvoiceOnWhatsApp` function

### 5. Update Billing page
- Pass `sellerBankAccountName` when creating invoice PDF data for download and WhatsApp share
- Ensure the field is populated from company info when creating new invoices

## Files Changed
- `supabase/migrations/` — new migration for `seller_bank_account_name` column
- `src/components/pdf/GstInvoicePdf.tsx` — add field to interface + render in Bank Details
- `src/context/DataContext.tsx` — add to Invoice interface + fetch/save mapping
- `src/utils/shareWhatsApp.ts` — add to InvoiceShareData + pass to PDF
- `src/pages/Billing.tsx` — propagate field when creating/editing invoices

