# Fix Astra's findings on My Business charts

Astra reviewed the five new charts. It found no money miscalculations: "Who owes us the most?" uses the same bill balances as the Unpaid figure. The page is already limited to people allowed to see money. The real issues it found are listed below, all fixable without touching saved data.

## What changes for the owner

1. **Honest sales range.** The "likely between X and Y" range will be worked out by checking how well the same 4-week estimate did in past months. With too little history to check, the range is hidden and only "About ₹X" is shown.
2. **No false "Out of stock".** A product with a few units left that would last less than a day will say "Less than 1 day", not "Out of stock".
3. **No false comfort on stock.** If the business has less than 30 days of sending history, the chart says "Not enough history yet" instead of "Nothing is likely to run out". When there is enough history, the speed of sending is based on the real number of days.
4. **Fair "Who is buying less?".** It compares two complete 30-day periods ending yesterday, so a half-finished today can't look like a drop. The dates are shown under the title.
5. **Future dates ignored.** Returns or sends dated after today are left out of every chart.
6. **Fresh after midnight.** The forecast and all charts recalculate when the day changes (Indian time).
7. **Names readable on phones.** Long dealer or product names wrap onto their own line, with the amount underneath, instead of being cut off.
8. **Zero shows as zero.** A dealer who bought nothing recently shows an empty bar labelled "No orders", not a sliver.
9. **Clear "why not yet" on the forecast.** The empty message names what's actually missing, for example "Sales in 3 of the 5 weeks needed".
10. **Weekly numbers without the chart.** A "Show weekly numbers" toggle opens a simple table of weeks with real sales, likely sales and range. Screen readers can use it, and it's easier for anyone who doesn't read charts.

## Checks
- Unit tests for each fix: under-1-day stock, short history, future dates, complete windows, zero bars, forecast eligibility reasons, and a range check against past data.
- Full test suite and error check.
- Browser check of My Business in the demo business on computer and phone.
- A short follow-up Astra pass to confirm the fixes.

## Technical details
- `forecastNext4Weeks`: rolling backtest of the 4-week total forecast (train on 8 weeks, compare with the next 4). Use the 80th-percentile error once there are at least 3 backtests; otherwise `range: null`. Return `{ ok: false, reason, have, need }` for ineligible cases.
- `stockRunway` (shared with Today's work): upper-bound windows at `today`, `perDay = sold / min(30, historyDays)`. Return `days` as fractional and `qty`. UI shows "Out of stock" only when `qty <= 0`, and "Less than 1 day" when `days < 1`. Add a `historyDays` output so the chart can tell "no risk" from "not enough data". Today's cards keep their current wording apart from the under-1-day fix.
- `buyingLessPairs`: windows `(y-60, y-30]` and `(y-30, y]` with `y = today - 1`. Return the window dates.
- `topReturnedProducts`: also exclude dates after today.
- `BusinessCharts`: one shared `today` from a small `useBusinessDay()` hook that ticks at IST midnight, passed to every memo. Rows use a stacked layout under `sm`. Bar width is `0` when the value is `0`.
