# My Business: real-data charts and sales forecast

## Recommendation (agreed with Astra)
Yes, put it in My Business — no new screen. My Business stays the "what is happening" page; Today's work stays the "what to do" page. Add a short set of charts that each answer one plain question, with big rupee amounts, product/dealer names written on the bars, and a one-line takeaway under each. No pies, no legends, no colour-only meaning (fits the black/white look).

## What gets added (in this order on the page)

1. **Sales likely in the next 4 weeks** — replaces the current small forecast card. Line of the last 8 weeks of real sales, then a dashed line for the next 4 weeks with a light grey "likely range". Headline: "About ₹X in the next 4 weeks". Hidden with a friendly note if there is less than ~6 weeks of history; marked "Uncertain" when sales jump around a lot. Always labelled as an estimate.
2. **Who owes us the most?** — top 5 dealers by unpaid amount as horizontal bars, tapping a bar opens that dealer. Money received but not yet matched to a bill shown on its own line, never guessed.
3. **Who is buying less?** — paired bars per dealer: previous 30 days vs last 30 days, ranked by rupee drop. New dealers excluded. Tap opens order history.
4. **What may run out soon?** — top 5 products by estimated days of stock left. "No recent orders" instead of a fake big number.
5. **Which products come back most?** — top 5 by returned quantity in the chosen period.

Each section: a "See all" link to the full list, and a plain empty message when there is no data.

## What we will NOT add
Profit/margin (we don't record purchase cost), another sales-over-time chart, pie/donut charts, salesperson rankings (Targets already does this), payment-method charts, cash forecasts.

## How it stays correct
- All numbers come from the same calculation rules already used for Today's work and My Business — no AI for numbers.
- Sales = billed sales excluding cancelled orders, returns subtracted once; unpaid uses the existing canonical balances so totals match the Unpaid tile.
- Dates in Indian time.
- Charts respect the period buttons where it makes sense (returns); "owes", "running out" and forecast are always "as of now".

## Technical details
- Extend `src/lib/intelligence.ts` with pure functions: `weeklySales`, `forecastNext4Weeks` (mean weekly net sales + range from backtested absolute error over prior weeks; min-history + volatility flags), `topUnpaidDealers`, `buyingLessPairs`, `topReturnedProducts`; reuse existing stock-runway and declining-dealer rules.
- New components in `src/components/intelligence/`: `ForecastChart`, `RankedBars`, `PairedBars` (Recharts, greyscale tokens, direct labels).
- Wire into the My Business overview tab, lazy-loaded below the existing tiles so first paint stays fast.
- Unit tests for each function (empty, small, demo-sized data) and a reconciliation test: top-unpaid sums match canonical balances.
- Browser check on desktop and phone in the demo business; Astra reviews the finished page for clarity.
