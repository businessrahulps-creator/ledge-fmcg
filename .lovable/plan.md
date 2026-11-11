# Pre-publish bug test

Goal: confirm today's changes (other units for returns, Add Stock, date in top bar) work for a real signed-in user, and that nothing else broke, before publishing.

## 1. Health checks (no changes)
- Read the latest preview build result and recent preview errors.
- Run all automated checks in the project (money, stock, billing, returns, credit days).
- Run the database safety scan and review anything new.

## 2. Click-through as a real user (test data, cleaned up after)
On computer and phone sizes:
1. Stock: edit "mango 600 ml", type 24 Bottle without pressing +, Save. Reopen and confirm the unit is saved.
2. Add Product with an extra unit typed in, confirm it saves.
3. Returns: open the mango 600 ml bill, confirm the Bottle choice appears; also try "+ Add another unit".
4. Return 24 Bottle (good): 1 case returned, stock +1, credit note amount correct, shows in Activity.
5. Try 6 Bottle: refused with a clear message. Try returning more than left: refused.
6. Damaged, no credit only: no credit note made.
7. Godown Add Stock and the top-bar date still correct.
8. Quick open of Orders, Dispatch and bill, Billing, Payments, Dealers: no errors.

## 3. Fix and report
- Fix any bug found, re-run the related check.
- Remove test returns and units created, confirm stock and totals match the before snapshot.
- Report what passed, what was fixed, anything still open, then suggest publishing.

## Technical details
- Signed-in testing needs a preview session: if I cannot create one for your account, you will be asked to sign in to the preview once.
- Playwright under /tmp/browser, vitest for unit tests, database linter.
- Before/after snapshot of stock, return ledger, claims and credit notes for the anaar business.
