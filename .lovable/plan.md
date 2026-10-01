# Full logic recheck: Astra + Fable, many reviewers in parallel

Goal: confirm every calculation and every save action in Ledge works as intended. We fix only where there's proof, and we keep all 366 checks passing.

## Who checks what (run at the same time)

Each area gets two independent reviewers, Astra and Fable. A finding counts only when both agree, or when a test or a database check proves it.

1. **Orders and offers:** booking, offer and discount maths, GST on each item, cancelling, credit-limit and stock checks before sending.
2. **Bills and money:** GST bills, payments, advances, payment retries, cancelled payments, credit notes, returns, and what each dealer owes (the stored amount vs bills minus payments minus returns).
3. **Stock:** godown amounts vs their movement history, sending, returns, purchase bills, and stock adjustments. No stock should ever go below zero.
4. **Buying:** suppliers, purchase bills, returns, supplier payments, what you owe each supplier, the rule for cancelling a paid bill, and the CGST/SGST vs IGST state rule.
5. **Reports and Tally:** every report total vs the Dashboard and My Business, PDF/Excel/CSV totals, and checking that every Tally entry balances.
6. **Today's work and Shop visits:** ranking rules, promises, snooze, making a new shop a dealer, and Indian time (IST) at midnight.
7. **Access and safety:** each role (owner, manager, accountant, salesperson, viewer) sees only what it's allowed to, and other businesses' data stays hidden. Double taps never save twice, and every action is recorded in Activity.

## Proof, not opinion

- **Database checks on the demo business:** each dealer's stored unpaid amount vs bills minus payments minus returns, each supplier's balance, stock vs movements, no orphan rows, and no saved bill with a missing or wrong GST split.
- **Browser run on phone and computer:** order → send & bill → payment → return → purchase bill → supplier payment → visit with promise → new shop to dealer → report exports.
- **New automatic checks** for every calculation we fix.

## Output

- **Must fix and should fix:** fixed now, each with a new check.
- **Anything that changes a business rule or old data:** listed for you to decide, not changed.
- **A plain-words report:** what was checked, what was found, what was fixed, and what's still open (for example, a real TallyPrime import still needs your accountant).

## Technical details

- Reviewers run in parallel. Each reports severity (must/should/small), file:line, impact and the exact fix.
- Main targets: the atomic RPCs (book/dispatch_and_bill/payment/return/purchase/cancel), dealer_outstanding, supplier_balance, src/lib/receivables.ts, payables.ts, intelligence.ts, reports/registry.ts, tally.ts, RLS and capability checks.
- Read-only SQL is used for the reconciliation checks. Any fix that needs a database change ships as a migration with tenant and permission checks.
