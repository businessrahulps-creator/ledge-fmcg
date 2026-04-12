

# Add WhatsApp Share for GST Invoices on Billing Page

## Problem

The Orders page has WhatsApp sharing (PDF attachment + text summary), but the Billing page — where GST invoices, estimates, proformas, and credit notes live — has no WhatsApp share option. Indian FMCG billing is heavily WhatsApp-driven.

## Solution

Add a WhatsApp share button next to the existing Download button on every invoice row (desktop table and mobile cards), reusing the same Web Share API + fallback pattern from `shareOrderOnWhatsApp`.

### New utility: `shareInvoiceOnWhatsApp` in `src/utils/shareWhatsApp.ts`

- Accepts an `Invoice` and `CompanyInfo`
- Builds a text summary (invoice number, buyer, date, line items, tax breakdown, grand total)
- Generates a PDF blob via `GstInvoicePdf`
- Uses `navigator.share` with file attachment on supported devices; falls back to `wa.me` text link + PDF download

### UI changes in `src/pages/Billing.tsx`

- Import `WhatsAppIcon` and `shareInvoiceOnWhatsApp`
- Add a green WhatsApp button next to the Download button in both:
  - Desktop table actions (line ~488)
  - Mobile card actions (line ~543)

## Files Changed

| File | Change |
|------|--------|
| `src/utils/shareWhatsApp.ts` | Add `shareInvoiceOnWhatsApp()` function (~50 lines) |
| `src/pages/Billing.tsx` | Import + add WhatsApp share button in desktop & mobile views |

**2 files modified. No new files. No new dependencies. No database changes.**

