# Fix bugs found in receipt printing

## Bugs found (from reading the new code and the sample print)

1. **Item maths doesn't add up on the bill.** Each row shows Rate before GST but Amount after GST (5 x 420 shows 2,205). The items then don't add up to "Taxable value". Fix: row Amount = taxable value; show the GST % per row.
2. **Not a complete GST bill.** The receipt drops HSN code, GST % per item, buyer address/state and place of supply, all of which the A4 Tax Invoice shows. Fix: add HSN + GST % under each item name, buyer address + state, "Place of supply", and an "Authorised signatory" line.
3. **Empty bill can print.** If the bill's items fail to load (weak internet), it silently prints a bill with no items. Fix: refuse and show "Couldn't load the bill items, try again".
4. **Dates print raw** (2026-10-22). Fix: use the app's Indian date format (22 Oct 2026).
5. **Cancelled orders still print an order slip.** Fix: hide the button on cancelled orders that have no bill, or print a clear "CANCELLED" heading.
6. **Double tap prints twice** and leaves extra hidden print frames behind. Fix: ignore taps while one print is opening.
7. **iPhone/iPad Safari can print the whole app page** instead of the receipt when printing from a hidden frame. Fix: on Apple touch devices, open the receipt in its own tab and print from there.
8. **Balance on the bill receipt**: confirm it uses the same figure as the order page after credit notes and dealer credit. Today it reuses the page's balance; add a test so a credit note can't make the receipt disagree with the page.

## Not bugs, still missing from the earlier plan
- Printer icon on the Orders list rows.
- Prints recorded in Activity.
- Logo option.
These stay open unless you want them in this round.

## Technical details
- `src/lib/thermal-receipt.ts`: rows use `taxableValue`, add `hsn`, `gstRate`; add buyer address/state, place of supply; format dates with `formatIndianDate`; `receiptFromOrder` takes `cancelled`.
- `ThermalPrintButton.tsx`: throw when a GST bill has 0 lines after `withInvoiceLines`; busy flag; hide for cancelled order slips.
- `printThermal.ts`: iOS path (`window.open` synchronously in click, then write HTML); remove old frames before adding a new one.
- Extend `thermal-receipt.test.ts`: rows add up to taxable value, empty-lines refusal, inter-state place of supply, cancelled slip label.
- Re-render the sample 80mm and 58mm receipts and check the images.
