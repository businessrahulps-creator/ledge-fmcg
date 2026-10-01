# Reports: one place to download any data (CSV, Excel, PDF, Tally)

## What you get
A new **Reports** screen (menu item under My Business, at `/reports`). Today `/reports` only redirects into My Business. You pick a report, pick dates, pick a format, and download it.

```text
[ Pick a report ]  ->  [ Dates + filters ]  ->  [ Preview first 20 rows ]  ->  [ CSV | Excel | PDF | Tally ]
```

### Screen layout
- **Left (on phone: top):** reports grouped into Sales, Money, Stock, Buying, GST, Team, and Tally. Each report has a one-line plain description and a search box.
- **Right:** a date range (This month / Last month / This year (Apr–Mar) / Custom, in Indian time), simple filters (dealer, salesperson, godown, product), a live preview table with row count and totals, and download buttons.
- **Recent downloads:** the last 10 reports you made, with one tap to make them again for new dates.
- **Favourites:** star the reports you use often so they show at the top.

### Reports included (v1)
| Group | Reports |
|---|---|
| Sales | Orders list, Order lines by product, Sales by dealer, Sales by product, Sales by salesperson, Offers given |
| Money | Money to collect (by age), Dealer statement (ledger), Payments received, Credit notes, Cancelled payments |
| Stock | Stock now (by godown), Stock movements, Low stock, Stock value |
| Buying | Purchase bills, Supplier balances, Supplier statement, Supplier payments, Returns to supplier |
| GST | Sales register (GSTR-1 style: B2B / B2C / HSN summary), Purchase register, GST summary (GSTR-3B style) |
| Team | Salesperson performance vs target, Shop visits and promises |
| Tally | Tally export (see below) |

### Formats
- **CSV:** plain, opens anywhere.
- **Excel:** proper number and date cells, ₹ format, a totals row, frozen header, one sheet per section (for example GST: B2B, B2C and HSN on separate sheets).
- **PDF:** company letterhead, period, filters used, table, totals, and page numbers. Uses the same look as your current bills.
- **Tally:** a file TallyPrime can import directly.

### Tally export
- Choose what to send: **Sales bills, Credit notes, Payments received, Purchase bills, Supplier payments**, plus **Party and stock-item masters** (dealers, suppliers, products, with GSTIN, state, HSN and GST rate).
- Output: a Tally XML file (the format TallyPrime imports via *Import > Vouchers / Masters*). An Excel version of the same data is also available for accountants who map columns themselves.
- **Ledger names screen** (one-time setup): match your accountant's Tally ledger names, for example Sales ledger "Sales @18%", CGST/SGST/IGST output ledgers, Round off, Cash/Bank. Ledge suggests the standard names.
- Before downloading, a check shows problems in plain words, for example: "3 dealers have no GSTIN — they'll go in as unregistered", or "1 product has no HSN code".
- Each export remembers what was sent, so "Only new since last export" avoids duplicate entries in Tally.

## Rules this keeps
- Nothing is changed by exporting; it is read-only. Bills stay locked.
- People only see what their role allows. For example, a salesperson can't download money reports, and Tally/GST is for the owner and accountant only.
- Numbers come from the same calculations the app already uses, so a report total always matches the screen.
- Plain words throughout (15-year-old test). The look stays black, white and grey.

## Build order
1. Reports screen, the report catalogue, preview, CSV/Excel/PDF. Starts with Sales, Money and Stock.
2. Buying, GST and Team reports.
3. Tally: ledger-name setup, checks, XML and Excel export, "only new" tracking.
4. Astra/Claude review of every report total against the app screens. A sample Tally XML gets checked against TallyPrime's import format before release.

## Technical details
- Route `/reports` (replaces the redirect) with lazy loading and prefetch, plus a sidebar item; gated by a new `see_reports`-style check using existing capabilities (`see_money` for money/GST/Tally reports).
- `src/lib/reports/registry.ts`: each report is `{ id, group, title, description, capability, filters, columns, fetch(params) -> rows, totals }`. All reports share one renderer.
- Data: reuse existing hooks/selectors (receivables, payables, `dealer_outstanding`, `supplier_balance`). Large ranges load in pages from the database, not from session state.
- Exporters: extend `exportXlsx` (multi-sheet, typed cells), add `exportCsv`, and add a generic `ReportPdf` document reusing `downloadPdf`. Export libraries are loaded only when needed.
- Tally: `src/lib/reports/tally.ts` builds TallyPrime XML (`ENVELOPE/IMPORTDATA/TALLYMESSAGE` with `VOUCHER` and `LEDGER`/`STOCKITEM` masters), with unit tests on sample bills. New table `tally_settings` (ledger-name mapping, per company) and `export_log` (who exported what, when, and which document IDs). Both use company RLS and GRANTs. Exports are also written to activity_log.
- Recent downloads/favourites: local per user (no new table).
- Tests: registry totals vs existing calculations, CSV/Excel round-trip, Tally XML snapshot tests.
