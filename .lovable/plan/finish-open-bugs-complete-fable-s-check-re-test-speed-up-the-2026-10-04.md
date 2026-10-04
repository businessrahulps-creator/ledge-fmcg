# Finish open bugs, complete Fable's check, re-test, speed up the app

## 1. Fix the 5 issues left open last round
Each one is confirmed again on the code or live system before it's changed. If one turns out not to be real, I'll report it instead of fixing it.

- **Paisa rounding** in offer discounts, purchase GST and advance amounts: round each line once, the same way everywhere, and keep totals equal to the sum of their lines.
- **Order saved twice if the confirmation is lost:** the order form sends one save ID per attempt. If the same ID comes in again, the server returns the order it already made.
- **Two people paying the same order and bill at once:** the second save waits its turn instead of failing.
- **Today's work:**
  - Collection reminders subtract advance money.
  - A low-stock card you marked done comes back if the product runs low again.
- **Previous person's bell alerts on a shared phone:** clear saved alerts when someone signs out or a different person signs in.

## 2. Finish Fable's hunt and check last round's fixes
- Fable reviews last round's 15 fixes and these 5 new ones, in smaller batches so its reply doesn't get cut off.
- Fable then finishes its search for new bugs across orders, billing, payments, returns, stock, buying, team access, activity and the bell.
- Astra does a separate pass with a different method: it looks for broken money rules and for one business seeing another's data.
- I fix every real bug found and have the reviewer check the fix. Anything I can't safely fix comes back to you to decide.

## 3. Re-test that everything fixed is still fixed
- Live security re-tests: other businesses' stock, alerts sent to other businesses, forged "paid" status, edits after a GST bill, links to another business's records, double payments, the godown recorded on a send, and team access writes.
- All app checks (390+), plus new checks for each fix.
- Dealer balances cross-checked against bills, payments and credit notes. This check couldn't run last time.
- Main pages opened on computer and phone, with no errors in the browser.

## 4. Speed and optimisation
First measure, then fix the slowest parts, then measure again with the same method. Before and after numbers will be reported for:
- Opening the app cold
- Dashboard, Orders, Stock, Activity and Reports

Likely areas:
- **Dashboard totals:** the server sends just the totals instead of every order. This was Astra's earlier suggestion, so I'll take your request as the go-ahead.
- **Slowest database requests:** add the missing speed indexes.
- **Download size:** cut how much the browser downloads on the first visit, and load heavy pages (Reports, Activity, Buying) only when they're opened.
- **Long lists:** stop extra re-drawing, and make sure phone scrolling stays smooth.

## Not changing
- Business rules, GST bills (still corrected only with credit notes), menus, labels and features.
- Offline mode stays paused.

## Technical details
- Idempotency: add an `idempotency_key` column to orders with a unique index per company, checked inside `book_order_atomic`.
- Payment race: take the lock in a fixed order (order row, then invoice row) inside `record_order_payment_atomic` / `record_invoice_payment_atomic`.
- Notifications: clear the per-user cache in `use-notifications` on an `onAuthStateChange` user switch.
- Dashboard: a new STABLE SECURITY DEFINER `dashboard_summary(p_from, p_to)` RPC, company-scoped and gated the same way as the current reads, with Vitest parity against the current client math.
- Performance: `supabase--slow_queries` + EXPLAIN, then indexes; check chunks with a bundle analyzer; Playwright timings (cold + warm, 1280 and 393 widths).
- Reviewers: Fable via /v1/messages (claude-fable-5-1), Astra via /v1/responses, batched under the output limit; credits kept within your earlier 100-credit window.
- AGENTS.md updated for the idempotent order save and the dashboard summary.
