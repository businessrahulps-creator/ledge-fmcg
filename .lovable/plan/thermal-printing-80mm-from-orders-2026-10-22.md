# Thermal printing (80mm) from Orders

## Goal
One tap prints a small receipt-style bill on the customer's Coinel Exel Plus (80mm roll printer), straight from the order page and the Orders list.

## What the user will see
- **Order page**: new **Print receipt** button next to "View GST bill" / WhatsApp.
  - Order has a GST bill → prints the **Tax Invoice** in receipt form (same number, lines, GST split, total, words).
  - No bill yet → prints **Order slip (not a bill)**, clearly labelled, so it can't be mistaken for a GST bill.
- **Orders list**: a printer icon on each row (and in the row's menu on phones) doing the same thing.
- **Settings → Printing**: paper width (80mm default, 58mm option), show logo yes/no, show bank/UPI details yes/no, footer note (e.g. "Thank you"), number of copies (1–3). Saved on that device, since each counter has its own printer.
- Opens the normal print window with the Coinel already sized correctly; on Windows the shop can tick "always use this printer" once and then it's one click.

## Receipt layout (80mm, ~48 characters wide)
```text
   [logo]  COMPANY NAME
   Address · Phone · GSTIN
   ------------------------------
   TAX INVOICE      INV-2026-0142
   Date 22 Oct 2026   Order ORD-..
   Bill to: Dealer name, GSTIN
   ------------------------------
   Item            Qty  Rate  Amt
   Atta 10kg        5   420  2100
   ------------------------------
   Taxable                  2100
   CGST 2.5% / SGST 2.5%   52.50 ...
   Offers saved             -50
   TOTAL                ₹2,155
   Rupees two thousand ... only
   Paid ₹1,000  Balance ₹1,155
   ------------------------------
   Bank / UPI · footer note
```
Black text only, bold totals, no shading (thermal can't print grey well), long product names wrap instead of being cut.

## Scope rules
- Printing never changes the order or bill (read-only; GST bills stay immutable).
- Figures come from the saved bill/order, not recalculated, so the receipt always matches the A4 PDF.
- Paid/balance line only shows once payment figures have loaded (same rule as the labels fix).
- Each print is recorded in Activity ("Printed receipt for INV-…") so the owner sees reprints.

## Phase 2 (optional, later)
Direct "silent" printing over USB/Bluetooth from Chrome without the print window. Only worth doing if the print window step is a real complaint; works on Chrome/Android only.

## Technical details
- New `src/components/print/ThermalReceipt.tsx` (pure HTML, monospace-friendly) rendered into a hidden print root; `src/styles/thermal-print.css` with `@page { size: 80mm auto; margin: 0 }`, `print-color-adjust: exact`, hides the app while printing.
- `src/lib/thermal-receipt.ts`: pure function building receipt rows from invoice/order (reuses `invoice-lines.ts`, `numberToWords`, money helpers) + vitest tests for totals, GST split, round-off, order-slip label.
- `useThermalPrintPrefs` hook (localStorage, like `usePrintPreferences`).
- Print logging via a small `log_print_event` RPC writing to activity_log (company-scoped, SECURITY DEFINER).
- Verify with Playwright `page.pdf({ width: '80mm' })` and inspect the image.

## Questions to confirm
1. Which devices print — Windows PC, Android phone, or both? (Decides whether phase 2 matters.)
2. 80mm only, or do some customers use 58mm?
3. Should the receipt be allowed before the GST bill exists (order slip), or only after?
