# Fix the four issues found in role testing

## What changes for people
1. **Returns: only people allowed to see money can record them.** Sales Reps and Viewers will be refused by the server, matching the Returns page they already can't open. Owner, Manager and Accountant keep working as today.
2. **Orders money hidden for roles without money access.** On the Orders list and each order page, Sales Reps and Viewers will no longer see rupee totals, balances or paid/unpaid badges. They still see products, quantities, dealer, dates and delivery status, and Sales Reps can still place orders.
3. **One correct "still to collect" figure on each order.** The big number at the top of an order page will match the payments box (after payments and returns). Example from testing: ₹150 bill, ₹25 paid, ₹50 returned → both show ₹75.
4. **Delivery timeline tells the truth.** A sent order shows "On the way"; "Delivered" only gets a date once someone confirms delivery (no more "Delivered: Now").

## Not changed
Bills, GST, credit notes, prices, payment rules, stock rules and existing records. Test records from today stay as tagged history.

## Checks before done
- Server test: Sales Rep and Viewer return attempts refused; Owner/Manager/Accountant allowed (rolled back, no new records).
- Small tests for the balance rule (₹150/₹25/₹50 → ₹75) and the delivered-label rule.
- Browser pass as each of the four test logins on Orders and an order page.
- Full test suite and build.

## Technical details
- New migration: replace `record_return_and_credit_atomic` guard with `has_capability(auth.uid(),'see_money')` (keep SECURITY DEFINER, search_path, grants, lock order and body unchanged).
- `Orders.tsx` / `OrderDetail.tsx`: gate amounts, payment badges and money facts on `useCan("see_money")`.
- Extract a pure order receivable helper (bill total − allocated payments − credit notes) used by both the OrderDetail headline and PaymentsPanel.
- Timeline: the "Delivered" step uses `order.deliveredAt` / delivered status only; investigate the source of "Now" (likely a fallback to current time or a server default stamping delivered_at on dispatch) and fix at its source without altering stored dates.
