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

## QA pass (1 Oct 2026) - fixed
- [x] Salespeople can read dealer unpaid amounts, payments and credit notes straight from the database (screens hide them). Tighten database access? Dealer lists for visits must keep working.
- [x] Buying is open to sales managers too (they have money access). Restrict to owner + accountant?
- [x] Suppliers without GSTIN always get CGST+SGST; add a "State" picker for them?
- [x] Cancel purchase bill checks the supplier's total balance, not payments on that bill
- [x] Order-wide "buy X get Y" offers value free items at the order's priciest product
- [x] Retrying an advance payment after a network drop shows an error (no double payment)
- [x] Old "send" path without stock/credit checks still exists in code (no button uses it)

## Activity final pass (Oct 2026)
- [x] Every recorded action shows in the bell (Important / All tabs, badge for important only)
- [x] Re-check 14 earlier Activity fixes live
- [x] Astra + Fable new-bug review, fix real findings
- [ ] Bell reaching a second team member (needs a second person invited)

## Oct 4 2026 pass
- [x] Repeat order save returns same order
- [x] Order/bill payments lock in one order (incl. payment cancel)
- [x] Today's work: advances subtracted; stock Done returns after 7 days
- [x] Bell cache per person
- [x] Dealer balance lookup faster (identical numbers)
- [x] Paisa rounding alignment
- [ ] Dashboard totals from server (dashboard_summary)
- [ ] After publish: stop signed-in use of old 8-arg order save

## Oct 4 pass: pending fixes, seed to today, Astra
- [x] Payment retry after a lost reply reuses the same save ID (only when nothing changed)
- [x] To-give-back money counts as collected; given back shows as money out (reports, day book, Tally, Activity)
- [x] Dealer credit, kept advances and returns after paying clear oldest bills (no false overdue)
- [x] Seed data 20 Sep to 4 Oct through the app's normal saves, all tagged [seed], every action shows in Activity
- [x] Activity: one entry per action (no ₹0 "created" + "updated" pair, no doubled buying entries)
- [x] Astra pass: retry payload binding, stale panel reload, report ordering, refund day boundary, money-collected helper
- [x] Paisa rounding: one shared rule (roundPaise, same as the database)
- [ ] Server-side dashboard/money totals (speed)
- [x] Payment box and bill chips use dealer credit (Astra #2)
- [x] Unpaid-by-age "oldest" after settling, and refresh at midnight (Astra #8, #9)
