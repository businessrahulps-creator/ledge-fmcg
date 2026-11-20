# Fix the six audited pre-publish findings

Scope: only LEDGE-SEC-01..04, LEDGE-UI-01, LEDGE-DOC-01. No redesign, no record deletion, no publish.

## Permission rule used
- Money figures (revenue, order rupee totals, average order value, targets in rupees, ledger, dues, payments): `useCan("see_money")` — the same check already used by Dashboard, Orders and Order details.
- Godown valuation: shown when the person has `manage_stock` OR `see_money` (both are existing capabilities; stock value is money, and stock managers already see the stock-value tile). Quantities stay visible to everyone who can open Stock today.
- When hidden, show a dash or simply omit the card/column — never a zero (a zero looks like real data).

## Fixes
**SEC-01 Sales Team (/salespersons)** — hide team/individual revenue, average order value and order rupee totals in cards, table and phone list; drop money columns from the CSV export for non-money users. Order counts, shops brought in, visits, assignment stay.

**SEC-02 Salesperson detail (/salespersons/:id)** — hide lifetime and 30-day revenue, rupee target and achievement %, and rupee column in the order list. Keep order counts, shop/attribution counts, profile and login link.

**SEC-03 Targets (/targets)** — hide rupee target and actual values plus revenue progress for non-money users. Non-rupee targets (order count / quantity, if present) and existing manage rights (`manage_schemes`) stay unchanged.

**SEC-04 Dealer detail (/distributors/:id)** — hide Ledger tab, bills, payments, running balance, unpaid amount, credit-limit usage and money summaries for non-money users; a direct `?tab=ledger` link falls back to the profile tab. Profile, visits, assigned salesperson, contact and edit rights remain.

**UI-01 Stock (/stock)** — gate each godown card's total value with the rule above; quantities untouched.

**DOC-01 Returns (/claims)** — confirmed in code: Bills of Supply are saved with `doc_type = 'gst_invoice'` and `supply_type = 'bill_of_supply'`, so the current filter already includes them. Fix: move the eligibility check into a small tested helper that explicitly accepts both kinds of final bill (and still excludes draft/cancelled/unlinked). The return function's server checks (whole units, cumulative limit, money access) are not touched. Then verify with a real BOS order (BOS/2026-27/0023) that it appears in the return picker — no return saved.

## Backend data access
These screens read money from bills/payments that the app already loads for every team member (Orders shows bill totals to all). Tightening the database read rules for those tables would break Orders and Order details for Sales Reps, so this pass is screen-and-export gating only — no migration. I'll flag it as a remaining risk and can plan a server-side money view separately if you want it.

## Tests
- New pure helpers + tests: `canSeeGodownValue(manageStock, seeMoney)`, `isReturnableBill(invoice)` (GST, BOS, draft, cancelled, no order), and CSV column selection for Sales Team with/without money access.
- Page-level tests for Salespersons, SalespersonDetail, Targets, DealerDetail rendering with `see_money` true/false (no rupee text when false).
- Full suite run (currently 536 passing).
- Browser check with the existing Owner, Accountant, Sales Rep and Viewer logins: each of the five pages, direct URLs, the Sales Team CSV download, and the BOS order in the returns picker.

## Final report
Per-finding status (FIXED / NOT FIXED / NEEDS VERIFICATION), files changed, tests, browser results actually run, remaining risks, and confirmation no records were changed.
