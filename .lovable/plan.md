# Audit follow-up: cancelled orders, report windows, exports and speed

Ten findings from the latest audit, in the order they hurt. Each one is a small, self-contained change.

## What gets fixed

### 1. Cancelled orders still counted almost everywhere (P1)
A cancelled order keeps its "pending" delivery state, so every screen except the Dashboard still treats it as live work: Insights order counts and pipeline, the top-dealer leaderboard, average order value, the Dealer/Product/Sales Team reports, and — worst — the dealer statement PDF that gets sent out.
Fix: route every one of those through the existing cancel-aware helpers so a cancelled order disappears from counts, pipeline, revenue and statements.

### 2. Report date caption doesn't match the rows (P1)
Every scoped report prints "Showing 20 Aug – 18 Sep" but selects rows with a different, separately written calculation — so the caption and the table disagree by a day or more, "Today" leaks yesterday's orders before 5:30 am, and a leap year is off by a day.
Fix: one India-clock window calculation used by both the caption and the filtering.

### 3. "Aging Summary" export ignores the filters on screen (P1)
The button promises "current filters" and downloads the whole company's aging.
Fix: build the export from the same filtered rows the screen shows, and make the caption/subtitle name the filters actually applied.

### 4. Clearing a target silently saves zero (P1)
Emptying a target field and clicking away writes 0 and the row reads "No target" — the old number is gone with no Save pressed.
Fix: an emptied field clears the target properly (removing it) instead of writing zero, and the row confirms what happened.

### 5. Dealer list stops at a cap (P1)
The dealer refresh reads at most 10,000 rows in one go and then replaces the whole list. It doesn't break at 1,000 as reported, but a large workspace would still silently lose dealers.
Fix: page the read like collections already does, so the list is always complete.

### 6. Salesperson statement PDF has no letterhead (P2)
It prints with a blank company name and no address, GSTIN or logo, unlike the dealer statement.
Fix: pass the same company details the dealer statement uses.

### 7. "Payment timeliness" uses the wrong source (P2)
The dealer and salesperson statements compute it from the order's payment flag, while the app's money rule says to derive payment state from receipts. A dealer can be told 60% while the app shows them fully paid.
Fix: both scorecards read the receipt-derived payment state.

### 8. Average order value doesn't reconcile (P2)
Insights divides dispatched-only revenue by every order in the period, so the headline number is lower than reality.
Fix: same basis top and bottom — dispatched, non-cancelled orders on both sides.

### 9. Insights loads the same payment history four times (P2)
Four parts of the page each run the same two paginated reads — eight queries per load, all identical. This is why Insights is the slowest screen.
Fix: load it once per page and share the result.

### 10. Number fields only clamp on blur (P2)
Typing 150 into a field capped at 100 feeds 150 into live totals, and pressing Enter can save it.
Fix: clamp as the number is typed, not only when the field loses focus.

## Technical notes

- `src/lib/revenue.ts` already exports `isCancelled`/`isDelivered`/`isBooked`; `isCancelled` is currently used only inside that file. Apply it in `command-signals.ts` (`ordersInPeriod`, `dispatchedRevenue`), `RevenueScopeFilter.tsx`, `PipelineFunnel.tsx`, `OverviewTab.tsx`, `dealerScorecard.ts`, `salespersonScorecard.ts`.
- `TimePeriodFilter.tsx`: `getPeriodRange`/`periodRangeLabel` (rolling, local midnight) and `filterByTimePeriod` (calendar arithmetic off `now`) are two different windows. Keep `getPeriodRange` as the single source, built on `src/utils/dateKey.ts` for IST, and reimplement `filterByTimePeriod` on top of it. Callers: `PaymentReport`, `DispatchReport`, `DistributorReport`, `ProductReport`, `SalesTeamReport`, `Billing`.
- `PaymentReport.tsx` aging export: apply the page's `period`/`filter`/`scope` to `receivableRows` before `agingFromReceivables`, and add the filter subtitle already used by the other exports.
- `Targets.tsx`: keep `revInput`/`ordInput` nullable through `handleSave`; add a delete path in the targets domain for "both cleared", and stop coercing `?? 0` before persisting.
- `useDealersDomain.safeRefetch`: replace `.range(0, 9999)` on `distributors` and `dealer_balances` with the `fetchAllPages` helper pattern from `useCollections.ts`.
- `SalespersonDetail.tsx` statement call: pass `companyName`, `companyAddress`, `gstin`, `logoUrl` as `DealerDetail.tsx` does.
- Scorecards: take the `paymentStatus` map from `useReceivables()` instead of `o.paymentStatus`.
- `Command.tsx`: create a receivables context provider around the Insights tree (or lift the single `useReceivables()` call and pass it down to `OverviewTab`, `AgingStrip`, `CreditAtRiskCard`). AOV numerator/denominator both from dispatched, non-cancelled orders.
- `number-input.tsx`: clamp in `handleChange` against `min`/`max` while keeping the typed draft intact (so a leading "1" of "10" isn't fought), keeping blur clamping as the final commit.
- Tests to add: cancelled order excluded from Insights counts/pipeline/statement, caption range equals filtered range, aging export respects filters, cleared target removes rather than zeroes, AOV reconciles, clamped typing.

## Not covered here

Items already recorded as clean (XLSX injection, XSS, search filters, paged money reads) and the items needing a live app (multi-page PDF layout, ₹ glyph in a downloaded file, offline replay idempotency, service-worker registration in production, print of Insights). Those stay on the pre-release live-check list.
