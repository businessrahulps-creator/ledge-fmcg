# Targets & Achievements – pickers and trustworthy achievement numbers (revised)

## What changes for the user
- Daily, Weekly and Monthly tabs get real pickers (any day, any Monday–Sunday week, any month/year) with previous/next buttons, replacing the short fixed lists.
- Each target shows: Gross sales, Returns deducted, Net achievement, Delivered orders, and (separately) Fully returned orders.
- Status colours (Achieved / On track / Behind / At risk) come from one shared rule.

## Confirmed rules

1. Returns deducted
   - Only accepted returns count: the value comes from issued credit notes only.
   - Claims are never deducted on their own. A claim that produced a credit note is counted once, through that credit note. Open or pending claims deduct nothing.
   - Partial returns deduct only the value on the credit note (the accepted part), not the order value.
   - Credit notes cannot be cancelled or reversed in Ledge (bills change only through credit notes, and a credit note is final). There is no cancelled state to exclude today; the rule still filters to issued notes so a future cancel state stays excluded.
2. Delivered orders
   - An order counts once, in the period it was delivered, when it is delivered and not cancelled.
   - Partial or full returns never reduce this count. Orders fully returned are shown as their own number ("Fully returned: N") and never subtract from delivered orders.
3. Status thresholds
   - 100% Achieved, 70% On track, 40% Behind, below At risk, kept as named constants in the shared calculation file and used by Targets, salesperson pages and tests. No copies in screens.
4. Returns against an earlier delivery
   - A return is deducted in the period of its credit note date (when it was accepted), not back-dated into the original sale's period, so past results don't silently change.
   - The card shows Gross sales and Returns deducted as separate lines, and a short note when a deduction relates to an order delivered in an earlier period ("includes ₹X returns on earlier orders").
5. Weekly compatibility (checked against live data)
   - Live targets: 64 monthly on the 1st, 2 monthly on the 31st, 35 quarterly, 1 daily, and 2 weekly.
   - Both weekly targets start on a Sunday (12 Apr 2026), not Monday. This looks like the old date conversion shifting by a day.
   - Plan: no data is changed. When looking up a week, a target starting on the Sunday just before that Monday is treated as that week's target, so these 2 still show. New weekly targets always save on Monday.
   - The 2 monthly targets on the 31st are treated the same way (they belong to the following month). The 35 quarterly targets are left untouched and keep their current behaviour; the new pickers don't change them.

## Database
No change and no migration needed. Existing tables already hold what's needed: credit notes (with note date, total and link to the bill and order), credit note lines, the return ledger linking claim lines to credit note lines (used to make sure each return counts once), orders with delivery status and delivery date, and targets with period type and start date. No records are rewritten.

## Technical details
- New pure module `src/lib/target-achievement.ts`: `TARGET_STATUS_THRESHOLDS`, `statusFor(pct)`, `periodWindow(type, start)` (IST day keys, inclusive), `normalizeTargetStart(type, start)` (Sunday→next Monday for weekly, last-day→next 1st for monthly), `computeAchievement({orders, creditNotes, window})` returning `{gross, returnsDeducted, returnsOnEarlierOrders, net, deliveredCount, fullyReturnedCount}`.
  - gross = sum of delivered, non-cancelled orders with delivered date in window (existing order-total convention: scheme savings subtracted once).
  - returnsDeducted = sum of credit note grand totals with note_date in window, deduplicated by credit note id; claims' total_claim_value never used.
  - fullyReturned = order whose credit-noted quantity covers all billed quantity.
- `Targets.tsx`: replace fixed `<select>` with Day/Week/Month pickers (existing Popover + Calendar); use the module above; money figures stay behind see_money (non-money users keep order counts only).
- `SalespersonDetail.tsx` target progress switches to the shared status rule.
- Tests (`src/lib/target-achievement.test.ts`): claim + credit note for the same return counted once; open claim deducts nothing; partial return deducts only credit-note value; full return keeps delivered count and adds to fully-returned; cancelled order not counted; earlier-period return deducted in credit-note period and reported as earlier-order return; delivered order counted once; Sunday-start weekly and 31st monthly records map to the right period; thresholds at 100/70/40 edges.
- Then run build and all tests; no publishing.

## Final clarifications (approved)
- Dealer and salesperson pages: DealerDetail.tsx and SalespersonDetail.tsx both use the full shared calculation (gross, returns, net, delivered orders, fully returned orders, status), not just the status rule.
- Return ownership: each credit-note deduction belongs to the original order's salesperson and dealer (credit note → bill → order), never the dealer's current assigned salesperson. Credit note lines are deduplicated by id, and the return ledger is used to check that a claim line and credit-note line for the same return count once.
- Historical records: Sunday-start weekly and 31st-stored monthly targets are recognised by lookup only; no production record is rewritten. New weekly targets save on Monday, new monthly on the 1st.
- Quarterly targets: left exactly as they are; never shown in Daily, Weekly or Monthly views.
- Permissions: see_money, manage_schemes, company isolation and RLS unchanged.
- Navigation is read-only: moving between days/weeks/months never saves; saving happens only on the existing Save action.
- Extra tests: dealer calculation; return attributed to original salesperson/dealer after reassignment; duplicate return prevention; historical lookup; navigation performs no target write.
- Delivery after build approval: full test suite, new tests, clean build, changed-file list, limitations. No publishing.

## Server-side financial summary (approved, in this build)
- New database function `target_achievement_summary(period_type, period_start, scope, scope_id)`: SECURITY DEFINER, fixed search path, execute revoked from public/anon, granted to signed-in users only.
- Inside it: company comes from the caller's own membership (get_company_id), never from input; see_money checked with has_capability for the caller; no permission flag is accepted from the app.
- Returns only aggregates for the requested period and scope (business, salesperson or dealer): delivered orders, fully returned orders, achievement %/status for order targets. Gross, returns deducted, returns on earlier orders, net and revenue % are returned only with see_money; otherwise those fields are null. No order, bill or credit-note rows are returned.
- Same rules as the shared app calculation (accepted credit notes only, deduplicated lines, original order's salesperson/dealer, period of credit note date); tests check both give the same numbers.
- Targets, Salesperson, Dealer, Command Centre and Reports target figures read from this function, so non-money users never receive revenue in the response.
- No table changes; existing RLS and role permissions untouched; no target record is written.
- Tests: money role and non-money role through the app and by calling the function directly; other business's ids return nothing.

## Build phases
1. Shared calculation module + tests. 2. Server summary function + direct-call tests. 3. Targets pickers and read-only navigation. 4. Salesperson, Dealer, Command Centre and Reports alignment. 5. Full test suite, clean build, browser check, report. No publishing.
