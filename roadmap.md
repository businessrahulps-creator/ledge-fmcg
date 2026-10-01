# Roadmap

## Arc free components rollout (no paid/Pro parts; built into Ledge's own primitives)
- [x] Button: press scale + `loading` spinner
- [x] UsageMeter on dealer page (credit limit used)
- [x] New primitives: CopyButton, HoldToConfirm, Sparkline, UsageMeter, SegmentedControl, AnimatedCounter (existing animated-number)
- [x] CopyButton on dealer phone
- [ ] CopyButton on GSTIN / bill numbers
- [x] `loading` on Save order
- [x] `loading` on Record payment, Cancel payment, and every "Saving…" button (dealers, team, products, godowns, stock, order edit)
- [x] Send on WhatsApp is instant — no spinner needed
- [ ] HoldToConfirm on Cancel order / Void bill (reason + audit stay)
- [ ] My Business metrics-dashboard style top (tile tabs + chart + compare)
- [ ] Phone forms: combobox, date range, bottom sheet, swipe actions
- [ ] Desktop filter toolbar + sortable tables (Orders, Bills, Dealers, Stock)
- [x] Verified dealer page (copy + credit bar) in demo business (signed in as asha@getledge.in)
- [ ] Astra review per phase

## Plain language
- [ ] Empty screens, error/success messages, "?" hints

## Calculation integrity (Astra deep review, Oct 2026)
- [x] Stock low count per product; Reference hidden on Cash; clearer sort arrows; unpaid-by-age gap explained
- [x] Returns: same bill line twice rejected
- [x] Sales trend excludes cancelled, subtracts offers
- [x] New-order offer preview must match server (non-combinable pick, repeated product lines)
- [x] Product-specific discounts spread across other GST rates on bill
- [x] Credit check / advance cap use pre-GST value
- [ ] Split returns can leave ₹1 rounding owed
- [ ] Custom date range starts 05:30 IST; comparison windows overlap
- [ ] 192 legacy 13-Apr bills: header tax rounded to rupee (grand totals correct; bills immutable — leave)
- [ ] 225 stock rows: opening stock never recorded in history (add opening entries, quantities unchanged)

## Reports (one place to download anything)
- [x] /reports screen: grouped catalogue, search, favourites, dates (IST), compare, live preview, recent downloads
- [x] PDF (existing letterhead pipeline + sections/subtotals/totals/note/landscape), Excel (typed, multi-sheet, info sheet), CSV (UTF-8), WhatsApp share
- [x] Reports: Sales x5, Money x4, Stock x3, Buying x3, GST x4, Shop visits
- [x] Tally: ledger names, checks, XML + Excel, only-new tracking, export history
- [x] Added: money by age, dealer account summary, day book, slow-moving stock, salesperson vs target; Tally XML checked (174 vouchers, all balance)
- [x] Area filter (money reports), dealer statement with running balance; money-by-age + dealer summary now use GST bills (app rule)
- [ ] Background PDF for huge reports (only needed past ~5,000 rows)
- [ ] Import sample XML into a real TallyPrime (needs the user's accountant)

## Vyapar ideas (plan declined — waiting for user's choice)
- [ ] WhatsApp reminders + UPI link, Vyapar import, quotations, challans, expenses, small-printer bills

## QA pass (1 Oct 2026) - needs owner decision
- [ ] Salespeople can read dealer unpaid amounts, payments and credit notes straight from the database (screens hide them). Tighten database access? Dealer lists for visits must keep working.
- [ ] Buying is open to sales managers too (they have money access). Restrict to owner + accountant?
- [ ] Suppliers without GSTIN always get CGST+SGST; add a "State" picker for them?
- [ ] Cancel purchase bill checks the supplier's total balance, not payments on that bill
- [ ] Order-wide "buy X get Y" offers value free items at the order's priciest product
- [ ] Retrying an advance payment after a network drop shows an error (no double payment)
- [ ] Old "send" path without stock/credit checks still exists in code (no button uses it)
