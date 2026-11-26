# Money to Collect — Pick dates (custom range)

## What you will see
- The date dropdown keeps All time, Today, Last 7 days, Last 30 days, Last 365 days, and gains **Pick dates**.
- Choosing Pick dates shows **From** and **To** calendars. Same day in both = that single day. From can never be after To (later From dates are greyed out in To and vice versa); future To dates are allowed, matching Reports.
- The caption "Showing ..." prints the exact chosen window; the choice is remembered when you come back to the page, like the other filters.

## How each tab and total uses the dates
| Item | Date used |
|---|---|
| To collect list | Bill date |
| Advance held (orders not billed yet) | Order date |
| Payments tab | Payment date (new — today this tab ignores the period) |
| Documents tab | Bill date for bills, note date for credit notes |
| Billed | Total of bills dated in the window |
| Collected | Money received against those bills + advances in the window (unchanged rule) |
| Returns credited | Credit against those bills (unchanged rule) |
| Still to collect / Over 30 days | What is still owed **on bills dated in the window**, as of today — not the dealer's total balance |

No total changes its formula; only the window changes. To avoid a misleading reading, when a period is active the caption under the totals says "Totals for bills dated in this period; amounts owed are as of today."

Date edges: every comparison uses the business calendar day (India time) of the record, so anything stamped late on the To date is included and nothing slips a day due to time zones.

Exports: Excel and PDF for To collect and Payments already use the on-screen rows; they will carry the new window and print the chosen range as the subtitle.

## Not changed
Permissions, payment/bill/credit maths, how money is saved, bill numbers, the other filters.

## Technical details
- Extend `timePeriod` state in `src/pages/Billing.tsx` with `"custom"` plus `customFrom`/`customTo` date keys (persisted in the existing sessionStorage filter key).
- New small pure helper `src/lib/billing-period.ts`: `resolveWindow(period, from, to) -> {fromKey,toKey}|null` and `inWindow(dateValue, window)` converting timestamps to Asia/Kolkata day keys via existing `utils/dateKey`; plus `windowLabel`. `inPeriod`/`inPeriodBy` call it; `paymentRows` gets `inPeriodBy(r => r.paidAt/date)`.
- Shadcn Popover + Calendar date pickers (pattern from Activity/Reports), `pointer-events-auto`.
- Tests `src/lib/billing-period.test.ts`: single day; range inclusive of end-day 23:59 IST timestamp; UTC timestamp near midnight lands on correct IST day; From > To rejected; presets unchanged.
- Run the build log check and full test suite; browser check of Pick dates on all three tabs. No publish.
