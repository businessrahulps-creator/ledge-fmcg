# Ledge Intelligence: a "What should I do today?" screen

## The idea (reviewed with Astra)
My Business shows **what happened**. Ledge Intelligence tells the owner **what to do next**: whom to call, which order to move, which stock to refill. It's a ranked to-do list built from your own data, not a second dashboard.

Every card follows the same pattern: **who or what → the fact → why → one button**.
Example: "Adyar Wholesale Beverages · owes ₹4,26,146, no payment in 41 days, 4x over credit limit → Send reminder on WhatsApp".

## Version 1: six sections, in phone order
1. **Do these first** shows the 3 most important actions from all the sections below.
2. **Collect money first** lists dealers to call, ranked by how much they owe, how long since they last paid, and how far over their credit limit they are. Buttons: Call, Send balance on WhatsApp, Open dealer.
3. **Expected money this month** is a revenue forecast in plain words: "If sales continue at this speed, you'll bill about ₹X this month (₹Y so far)". It shows a range and a note saying it's an estimate. It also shows expected collections, based on how each dealer has paid in the past.
4. **Orders waiting too long** lists orders not sent after more than N days, split into "Stock is ready" and "Stock is short". Button: Open order.
5. **Dealers buying less** lists dealers whose orders dropped compared with their own usual pattern, or who are late for their usual reorder. Button: Call or assign to a salesperson.
6. **Stock running out** lists products with fewer than about X days of stock left at the current selling speed, per godown. **Slow stock** lists products that haven't sold in 60+ days.

Every card has **"Why am I seeing this?"**, which shows the exact numbers and dates used, plus links to the bills and orders behind them.

## Trust rules (non-negotiable)
- All numbers come from plain maths on your data, never from AI. AI only writes the short daily summary at the top ("Today: collect from 3 dealers, 2 orders stuck"), and only from numbers already shown.
- Estimates are always labelled "estimate". When there's too little history, the card says "Not enough history yet" instead of guessing.
- Cancelled orders, returns, credit notes and GST are handled the same way as everywhere else. Totals match My Business exactly.
- We never say "overdue" unless the bill has a due date. Otherwise it's "no payment in N days".
- Nothing is blocked automatically. These are suggestions only.

## Who sees it
- New item in the side menu under Reports: **Ledge Intelligence**. It's visible to people allowed to see money (same rule as My Business).
- Salespeople later get a "My calls today" version showing only their own dealers (phase 2).

## Not in version 1 (later)
"Suggest a product to sell" (needs more history), bill/payment gap checks, Assign/Remind me/Not useful tracking, salesperson view, and a chat assistant. We avoid single "business health" scores, profit claims (we don't store purchase cost), and discount advice.

## Check before done
- Every number cross-checked against the database for the demo business "Rahul Ps Traders & Co".
- Phone and desktop screenshots reviewed by Astra for clarity (the 15-year-old test).
- All automatic tests pass, plus new tests for each ranking and forecast rule.

## Technical details
- Route `/intelligence` inside AppShell, guarded by `RequireCapability see_money`, lazy and prefetched from /command.
- Pure functions in `src/lib/intelligence/` (collectQueue, forecast, stuckOrders, decliningDealers, stockRunway), unit-tested. Inputs come from existing DataContext/useReceivables data, so no new tables in v1. Forecast: month-to-date billed ÷ elapsed IST days × days in month, with a ±range from daily variance. Expected collections: per-dealer median payment lag applied to open bills.
- Thresholds (stuck days, runway days, decline %) live as constants for now.
- Daily summary: existing edge-function pattern, `openai/gpt-6-astra` via the Responses API. The input is only the computed card facts. It's cached per business per IST day and is optional, so the screen works without it.
- Plain labels added to the approved word list. Monochrome design tokens, existing SignalCard/InsightLine primitives.
