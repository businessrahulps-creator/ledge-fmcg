# Fresh verification round with Fable (latest model)

Goal: prove every fix from the last three rounds actually works in the running app and database, using a new approach: live end-to-end runs instead of reading code.

## Approach
1. **Fable review (latest Claude Fable model, highest settings).** Give Fable the full list of fixes and the related code. Ask it to write a concrete test for each fix, and to look for new bugs the fixes may have caused. If Fable is unavailable, say so and use the next strongest available model.
2. **Live checks in a throwaway setup.** Run every write test inside a database transaction that is rolled back, so the demo business's real numbers do not change. GST bills stay untouched.
3. **Live browser checks** on computer and phone sizes, signed in as the real owner account.

## Fixes to verify (each gets a pass/fail with evidence)
- Old business's data cannot come back on screen after sign-out (sign out mid-load, then sign in again).
- Permissions are cleared on sign-out.
- Wrong business is never shown from a slow saved copy.
- A failed company read does not cache wrong order numbers.
- Lists past 1,000 rows load fully and in a stable order (products, schemes, order lines).
- Order refresh waits release together; orders load lines and offers in one request.
- A failed refresh after a return still reports the return as saved.
- "Can combine" setting on offers is saved.
- Editing an order's offers shows an error on failure; a failed order-prefix change reverts.
- "Units sold" excludes cancelled orders and drops right away when an order is cancelled.
- Returns in small parts can never credit more than the bill.
- The Dashboard doesn't get stuck, pages open at the top, and no "unsaved changes" prompt after saving.
- Data checks run again: balances, stock history, order totals, bill numbers, paid labels.

## Also probe (previously untested)
- Double-tap on "save order" creating two orders.
- Two people acting on the same dealer at once.

## Output
A pass/fail table in plain words. Fix any real failures, re-run the 380 automatic checks, and list anything left with its reason.

## Technical details
- Rollback-wrapped SQL via read/run tools for RPCs (cancel_order_atomic, record_return_and_credit_atomic, book_order_atomic).
- Playwright scripts under /tmp/browser/verify, session from LOVABLE_BROWSER_SUPABASE_* env; network throttling and route-abort to simulate slow/failed requests.
- Vitest plus new unit tests for fetch-token guard and refetchWaiters.
