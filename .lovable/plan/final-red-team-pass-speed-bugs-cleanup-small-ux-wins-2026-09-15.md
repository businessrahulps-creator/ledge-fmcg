# Final red-team pass: speed, bugs, cleanup, small UX wins

One last end-to-end hardening pass. No business rule, formula or number changes — only speed, correctness of what is already intended, dead code removal, and small interface polish.

## 1. Red-team sweep (find first, fix second)

Run a fresh adversarial pass on the money paths with the seeded data, one face at a time, verifying in the signed-in browser:

- Orders: book, edit before dispatch, dispatch and bill, cancel, delete guard.
- Money to collect: record payment, overpay guard, cancel payment, advances on unbilled orders, aging buckets.
- Returns and credit notes: remaining-quantity caps, restock vs no-restock, effect on the bill balance.
- Stock: movements, warehouse transfers, negative-stock guard under a repeated click.
- Schemes, targets, dealers, sales team: totals shown vs totals stored.

Every mismatch found gets logged, fixed, and re-verified against the same row.

Also included: double-submit protection review on every money action (book, dispatch, record payment, record return) — a second click during the request must not create a second row.

## 2. Speed

Current behaviour: on sign-in the app pulls every order, every bill and every bill line for the company before the first screen paints. With the seeded company that is 554 orders and 250+ bills; a real distributor a year in is many times that.

Changes:

- Load the heavy history in the background after the first paint instead of blocking it — dashboards and lists render from the first page of data and fill in.
- Stop fetching bill line items in the app-wide load; lines are only needed when a bill or invoice PDF is opened, so fetch them there.
- Trim `select("*")` on the biggest tables to the columns actually used.
- Split the PDF renderer and the chart library into their own lazy chunks so opening Orders does not pay for them.
- Re-check the slowest database queries and add a targeted index where the plan shows a sequential scan on a filtered column.

Target: first useful screen visibly faster on a phone, and no screen recalculating the whole order history on every keystroke.

## 3. Duplicate code and dead weight

- Six pages each carry their own near-identical PDF export block (Orders, Billing and the five report components). Collapse to one shared export helper; the documents produced stay byte-for-byte the same in layout.
- Consolidate the scattered money and date formatters (`formatCurrency` in `mock-data`, `formatCurrencyCompact`, the PDF variants, `daysOld`) into one place with the same outputs.
- Delete remaining unreachable components, props and imports left over from the report-page removal.

## 4. Small UX and UI fixes

- Consistent empty states and loading skeletons on the lists that still flash blank.
- Disabled buttons explain why on hover and on tap (the "Cannot delete" style already used on order detail).
- Money figures aligned right and in one style everywhere (they currently differ between a few tables).
- Tap targets under 44px on phones fixed on the remaining icon-only rows.
- Long dealer and product names truncate with a tooltip instead of wrapping rows to three lines.
- Toasts for money actions name the amount and the document, so a mis-tap is obvious.

## 5. Verification

After each fix: type check, test suite, build, and a browser check on the affected seeded row. At the end: full suite plus a page-by-page pass over Dashboard, Orders, Money to collect, Returns, Stock, Schemes, Targets, Dealers, Sales team, My Business — on a phone-sized viewport and on desktop.

## Technical notes

- Two-phase load in `DataContext`: critical slices first, `orders`/`invoices` history streamed after paint; keep the existing realtime debounce.
- Drop `invoice_lines(*)` from `useBillingDomain` list fetch; add a per-invoice line fetch used by the bill view and `GstInvoicePdf`.
- New `src/components/pdf/useReportExport.ts` (or similar) wrapping the `pdf()` + blob + download sequence used in seven places.
- `vite.config.ts` `manualChunks`: add `@react-pdf/renderer` and `recharts` alongside the existing icon/date chunks.
- Formatter consolidation into `src/utils/formatCurrency.ts` / `formatDate.ts`, re-exporting where call sites are many, with tests covering the existing outputs.
