# Fix "View bill" properly, then re-check the whole Money desk

Download works, so the bill itself is fine. The problem is how the new tab is opened: the app opens an empty tab and then tries to hand the finished file to it. Chrome often refuses that hand-off, so you sit on a blank page. Making the hand-off "smarter" has already failed twice — time to stop doing it.

## The fix: a real bill page

Give every bill its own page in the app, opened in a new tab like any normal link:

- Clicking **View bill** opens `/bill/<bill id>` in a new tab. It is a normal link, so no pop-up blocking and no blank tab.
- That page builds the bill itself and shows it full-screen, with **Download**, **Print** and **Share on WhatsApp** buttons at the top and the bill number as the tab title.
- If the browser can't display PDFs inline, the page says so plainly and offers Download instead — never a blank screen.
- The same page is used from the order page, Money to collect and Documents, so there is one behaviour everywhere.
- The old pop-up hand-off is removed entirely; the existing preview window stays only as an in-page peek where it is already used.

## Then verify the rest, one at a time

Working through the Money desk and order page in the browser signed into the demo account, checking each action actually does what its label says:

1. To collect: Record payment, View bill, Download PDF, Open order, Remind on WhatsApp.
2. Documents: View bill, Download PDF, Share on WhatsApp, and the credit-note rows.
3. Payments tab: search, date filter, cancelling a payment.
4. Totals: bill total, received, still due, advance held, returns credited all tie to the database.
5. Order page: Bill / Order confirmation buttons, record payment, dispatch, mark delivered, record return.

Anything found broken gets fixed and re-checked before moving to the next item, and I report each one as it lands.

## Technical notes

- New route `/bill/:invoiceId` (lazy) reusing `buildInvoiceBlob` + `invoiceToPdfData`; loads the invoice by id through the existing invoices query, tenant-scoped by RLS.
- Renders the blob in an `<embed>`/`<iframe>` created inside its own document (same-origin, no cross-window blob transfer), revoking the object URL on unmount.
- Delete `openInvoiceInNewTab`; `viewBill` in `Billing.tsx` and `OrderDetail.tsx` becomes `window.open("/bill/" + inv.id, "_blank")` from the click handler, so the `pendingBillId` spinner and toast fallback are no longer needed.
- Keep the blob cache for downloads; keep `InvoicePreviewDialog` for any in-page preview usage.
- Verification loop: `bunx tsgo --noEmit -p tsconfig.app.json`, `bunx vitest run`, build, then authenticated Playwright passes on `/billing` and one order page (headless Chromium has no PDF viewer, so inline rendering is confirmed via the object URL + download, not a screenshot of the rendered PDF).
