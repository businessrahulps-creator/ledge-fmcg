# Ledge Intelligence: "Today's work" (revised after Astra + Claude Fable review)

## The idea
My Business shows **what happened**. This screen tells the owner **what to do today**: whom to call, which order to send, which stock to refill. It's a short, ranked to-do list built only from your own data.

Every card: **who or what → the fact → why → one button**, plus the **salesperson's name** ("whose dealer?").
Example: "Adyar Wholesale Beverages · Ravi's dealer · ₹4,26,146 unpaid, oldest bill 63 days old → Send reminder".

## What changed after the review
- **Easier to find:** it's called **Today's work** and appears at the top of the Dashboard as a "3 things to do today" strip, plus its own menu item. It's no longer hidden under Reports.
- **Fewer things at once:** the top shows only 3 actions. Everything else opens with "See all".
- **Cards don't nag:** each card has **Done**, **Remind me tomorrow** and **Dealer promised to pay (date)**. A card you've handled stays hidden until something new happens.
- **Fairer ranking:** collections are ranked by the **age of the oldest unpaid bill** and how much has been unpaid for over 30 days, not just the biggest balance. This stops large, healthy dealers from always being on top. A dealer with no credit limit is shown as "No credit limit set", not hidden.
- **Safer reminders:** WhatsApp always shows a preview first, and the card shows "Updated X minutes ago". There's no reminder if a payment was recorded today.
- **Forecast moved:** the revenue forecast goes to **My Business**, not this screen. It only appears from day 7 of the month and is compared with the same day last month. It's always labelled "estimate".
- **Settings fit your trade:** three settings the owner can change: "Order is late after N days", "Warn when stock lasts under N days" and "Dealer is slowing down if orders drop by N%".
- **No AI summary in v1:** the top line is a fixed sentence filled with real numbers ("Today: 3 dealers to call, 2 orders waiting"). There's nothing to make up.

## Version 1 sections (phone order)
1. **Do these first** shows the top 3 actions across everything. The ranking rule is written below and is the same for everyone.
2. **Collect money**: dealers ranked by oldest unpaid bill and amount unpaid over 30 days. Buttons: Call, Send reminder (with preview), Promised to pay, Open dealer.
3. **Orders waiting to be sent**: orders not sent after N days, split into "Stock is ready, send now" and "Stock is short". Button: Open order.
4. **Dealers buying less**: compared with each dealer's own usual pattern. Only shown for dealers with at least 4 past orders over 60+ days.
5. **Stock running out**: days of stock left, counting only days the product was in stock, per godown. **Slow stock** covers no sale in 60+ days and skips products added in the last 60 days.

Every card has **"Why am I seeing this?"**, with the exact numbers, dates, the rule used, and links to the bills and orders.

## Ranking rule for "Do these first"
- Collect: amount unpaid over 30 days, weighted by the age of the oldest bill.
- Order ready to send: the order value (money you can bill today).
- Stock running out: last 30 days' sales value of that product.
These are put on one scale (rupees at stake), the top 3 are shown, and there's at most one card per dealer.

## Trust rules
- Every number comes from plain maths on data already in Ledge. Totals match My Business exactly.
- We never say "overdue" without a due date. We say "oldest unpaid bill: N days".
- When there's too little history, it says "Not enough history yet". Nothing is blocked automatically.
- Who can see it: the same people as My Business (money access).

## Later (not v1)
- Morning WhatsApp or app notification with the day's list. This needs a sender setup.
- Hindi and Tamil labels.
- A "My calls today" view for salespeople.
- Cheque due or bounced alerts, which need cheque dates stored.
- Incoming purchases in stock days, which need a purchases feature.
- Product suggestions per dealer.
- An AI daily summary, which would be checked so every number and name in it really exists.

## How we'll know it works
- Track how many cards get marked Done, and how the unpaid amount over 30 days changes week by week.
- Test on an empty business, a small one (about 5 dealers) and the demo business "Rahul Ps Traders & Co". Cross-check every number against the database.
- Astra reviews phone and desktop screenshots for plain language. All automatic tests pass, with new tests for every rule.

## Technical details
- Route `/today` in AppShell, guarded by `RequireCapability see_money`, lazy, prefetched from /dashboard. Dashboard gets a `TodayStrip` (top 3).
- Pure, unit-tested functions in `src/lib/intelligence/` (collectQueue, readyOrders, decliningDealers, stockRunway, rankTop3), fed from existing DataContext / useReceivables data. Oldest-bill age comes from invoice-level open balances. Runway uses in-stock days from stock_movements.
- New table `intel_actions` (company_id, kind, subject_id, state done|snoozed|promised, until_date, promised_amount, created_by, created_at), with GRANTs, RLS through company membership, and an index on (company_id, subject_id). A card stays hidden until `until_date`, or until a new bill or payment for that subject appears.
- Thresholds stored in an `intel_settings` jsonb on the company settings row, editable by the owner. Defaults: 3 days, 7 days, 40%.
- Forecast added to Command (My Business) with the day 7 and same-day-last-month guard.
- WhatsApp is a wa.me link opened after a preview sheet. Nothing is sent automatically.
