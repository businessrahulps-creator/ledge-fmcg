# Pre-publish bug test

Goal: confirm today's and yesterday's changes work for a real signed-in user, and that nothing else broke, before publishing.

## 1. Health checks (no changes)
- Read the latest preview build result and recent preview errors.
- Run all automated checks in the project (money, stock, billing, returns, credit days).
- Run the database safety scan and review anything new.

## 2. Today's changes (other units for returns)
On computer and phone sizes, using test data that is cleaned up after:
1. Stock: edit "mango 600 ml", type 24 Bottle without pressing +, Save. Reopen and confirm the unit is saved.
2. Add Product with an extra unit typed in, confirm it saves.
3. Returns: open the mango 600 ml bill, confirm the Bottle choice appears; also try "+ Add another unit".
4. Return 24 Bottle (good): 1 case returned, stock +1, credit note amount correct, shows in Activity.
5. Try 6 Bottle: refused with a clear message. Try returning more than left: refused.
6. Damaged, no credit only: no credit note made.

## 3. Yesterday's changes (10 Nov)
1. Top bar: date shows under the time (DD MMM YYYY, India time); nothing else in the top bar moved.
2. Godown Add Stock: button says Add Stock, picks an existing product, quantity starts at 1, before/after total is right, Save adds to that godown only, product details unchanged, shows in Activity.
3. Credit Days for dealers: 15/30/45/60 or custom up to 365, "No fixed days" default, cash-only dealers can't set it. Due dates and late dealers show in collections and reminders. Bills, PDFs, prints and order screens show no new credit fields.
4. Return safety rules: every return counted once, never more than billed, whole main units only.
5. No-GST businesses: Dispatch and bill still works and makes a Bill of Supply.

## 4. General smoke
Open Orders, Dispatch and bill, Billing, Payments, Dealers, Activity: no errors.

## 5. Fix and report
- Fix any bug found, re-run the related check.
- Remove test returns, units and stock created, confirm totals match the before snapshot.
- Report what passed, what was fixed, anything still open, then suggest publishing.

## Technical details
- Signed-in testing needs a preview session; if I can't create one for your account, you'll be asked to sign in to the preview once.
- Playwright under /tmp/browser, vitest for unit tests, database linter.
- Before/after snapshot of stock, return ledger, claims and credit notes for the anaar business.
