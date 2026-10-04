# Fix pending items, seed data to today, full check with Astra

## 1. Fix the pending items
- **Double-saved payment when the confirmation is lost**: give each payment attempt a save ID so a retry returns the same payment instead of adding a second one.
- **"To give back" money missing from money-collected totals**: count it as collected until it's given back, then show it as money out. Dashboard, Activity and Reports will all use the same rule.
- **Overdue look after credit is applied**: a bill counts as overdue only on what's still unpaid after credit and credit notes.
- **Paisa rounding**: offer discounts, purchase GST and advances round once, to the paisa, the same way on screen and on the server.
- **Faster pages**: the dashboard and money pages get their totals from the server in one request, instead of downloading the full payment history every refresh.

## 2. Seed data up to today
- Fill the business with realistic sample activity from the last date that has data up to today (4 Oct 2026). That covers orders, dispatches, GST bills, payments (including overpayments, refunds and cancellations with advance money), credit notes, returns, buying bills, supplier payments, stock moves, shop visits and targets.
- All of it goes through the same save steps the app uses, so stock, balances and Activity stay correct.
- Every sample entry is tagged so it can be found and told apart from real entries.

## 3. Cross-check logic and calculations
- Rebuild each total from scratch and compare it with what the app shows: dealer balances, supplier balances, stock per godown, GST splits, order totals after offers, Today's work cards, Activity summary numbers, report totals.
- Any mismatch gets fixed at its cause.

## 4. Astra bug hunt (heavy reasoning)
- Astra reviews the features from the last week (extra money choices, cancel with advance, team access, Activity/bell, buying, shop visits) plus the fixes above, looking for wrong math, race conditions, access leaks and gaps between screen and server.
- Each real bug gets fixed and checked live, then Astra does a second pass on the fixes.
- At the end, all automated checks run again and the build has to be clean.

## Technical details
- New migration: idempotency_key on the invoice/order payment RPCs (unique per company), refund_due handling in collections and dashboard sums, a `money_summary`/`dashboard_summary` SECURITY DEFINER RPC (company-scoped, see_money gated), and shared `round2` rules in the SQL helpers mirrored in src/lib.
- Seed runs as a script calling the `*_atomic` RPCs with a minted session. Notes/reference are tagged `[seed]`.
- Reconciliation queries go through read_query and REST. Astra runs via /v1/responses (gpt-6-astra, effort high).
- Rollout limit: the old 8-arg order save is only switched off after publishing.
