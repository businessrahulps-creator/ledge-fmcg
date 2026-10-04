# Let the owner decide on extra money, then a full Astra check

## 1. Advance money on a cancelled order — owner decides
When an order that already has advance money is cancelled, the cancel screen asks:
- **Keep it against what the dealer owes** (used for their other unpaid bills), or
- **Refund it to the dealer** (shown as "Money to give back" until marked refunded).

The choice is saved with the cancellation, shows in Activity and the bell, and dealer balances follow it. Nothing is decided automatically.

## 2. Someone pays more than the bill — owner decides
When a payment is bigger than what's left on the bill, the payment screen stops and asks:
- **Use the extra for their other unpaid bills** (oldest first), or
- **Keep it as dealer credit** for future orders, or
- **Refund the extra** (shown as "Money to give back").

Same rules: saved with the payment, visible in Activity, balances follow the choice, and cancelling the payment undoes it.

## 3. Full check with Astra
- Astra (heaviest setting) reviews the whole app: money, stock, orders, bills, buying, shop visits, team access, Activity/bell, reports, and speed.
- Re-run last round's security checks that were skipped (other businesses' data, forged paid status, edits after GST bill, foreign links, double payments, godown recording, team-access writes).
- Fix every real bug found, re-test each fix live, run all app checks, and open main pages on computer and phone.
- Report honestly: what was fixed, what wasn't checked, and anything needing your decision.

## Technical details
- New column `orders.cancel_advance_action` ('apply_to_dues' | 'refund') set by `cancel_order_atomic` (new optional arg, required when advance > 0).
- New column `invoice_payments.excess_action` ('apply_other_bills' | 'dealer_credit' | 'refund') + `excess_amount`; `record_invoice_payment_atomic` / `record_order_payment_atomic` reject overpayment without an action. Applying to other bills creates linked child payment rows in the same transaction; void reverses them.
- Refunds tracked as `refund_due` entries with a "mark refunded" atomic RPC (audited). `dealer_outstanding` / `dealer_balances` / `src/lib` mirrors updated; numerical cross-check before/after for all dealers.
- Old callers keep working (defaults only when there's no excess). Vitest coverage for the new balance math.
- Astra via /v1/responses (openai/gpt-6-astra, max reasoning), within the 150-credit test budget.
