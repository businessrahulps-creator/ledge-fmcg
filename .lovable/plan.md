

# Fix: Enrich Order Invoice PDF with Full Details

## Problem
The Order Invoice PDF (exported from the order detail page) only shows basic info. Specifically:
1. **Dispatch details** (vehicle, driver) appear only at the bottom in a small section — easy to miss, and not shown at all for pending orders
2. **Distributor details** — only name is shown, no address or GSTIN
3. **Company details** — no phone, email, PAN, or bank details

The data exists in the database and is correctly mapped. The issue is the PDF template is too minimal compared to the full GST Invoice.

## Solution (2 files)

### 1. `src/components/pdf/OrderInvoicePdf.tsx`
- Add props for distributor details (address, GSTIN) and company info (phone, email, PAN, bank details)
- Show distributor address and GSTIN under "Bill To"
- Move dispatch details (vehicle, driver, dispatch date) into the "Order Details" meta section so they're prominent, not hidden at the bottom
- Add a "Bank Details" section matching the GstInvoicePdf pattern
- Remove the redundant bottom "Dispatch Details" section

### 2. `src/pages/OrderDetail.tsx`
- Look up the distributor from `api.dealers.list()` by `order.distributorId` to get address, GSTIN, state code
- Pass full company info (phone, email, PAN, bank details) and distributor details to the PDF component

### What Changes for Users
- **Before**: Minimal invoice with just distributor name, line items, and a small dispatch section at the bottom
- **After**: Professional invoice with distributor address/GSTIN, company bank details/contact info, and dispatch info prominently displayed in the order metadata section
- Works for all users across the platform — component-level fix

