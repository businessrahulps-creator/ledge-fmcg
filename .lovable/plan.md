# Full QA and bug hunt across Ledge (several reviewers at once)

## Goal
Check that everything we've built works as intended, find bugs, and fix the real ones. Nothing is removed, and the existing rules stay as they are (locked GST bills, Indian time, plain words).

## Who checks what (run at the same time)
Astra and Fable each review the code and calculations, while I run real clicks in a test browser.

```text
Reviewer 1 (Astra)  - Reports: every total vs the matching app screen, Tally file, PDFs/Excel/CSV
Reviewer 2 (Fable)  - Money: bills, payments, credit notes, money to collect, ageing, dealer balances
Reviewer 3 (Astra)  - Buying: suppliers, purchase bills, returns, supplier payments, stock going up
Reviewer 4 (Fable)  - Orders + stock: new order, sending, delivery, cancel, returns, godowns
Reviewer 5 (Astra)  - Shop visits + Today's work: promises, new shops, make dealer, promised day
Reviewer 6 (Fable)  - Safety: who can see what (owner / accountant / salesperson), other-business data, double taps
```

Each reviewer returns a short list: what's broken, how bad it is (must fix / should fix / small), where it is, and the exact fix.

## Hands-on testing (me)
- Sign in the test browser. If the sign-in has expired, I'll ask you to open the preview once so it refreshes.
- Phone size and desktop: open every menu screen and check for errors, blank screens and stuck loaders.
- Main flows end to end with real input: take an order, send it, make the bill, take a payment, make a return, add a purchase bill, pay a supplier, log a visit with a promise, make a new shop a dealer, and download every report as PDF, Excel and CSV plus the Tally file.
- Check the numbers line up: Money to collect = Dealer statement closing = dealer page; Buying totals = supplier report; stock after each step.

## Fixing
- Fix every "must fix" and "should fix" item that is safe to change, then re-test that flow.
- Anything that would change business rules or old data gets listed for you to decide, not changed quietly.
- All existing tests (363) must still pass, and new tests get added for each fixed calculation.

## What you'll get at the end
A plain-words report: what was tested, what was broken and is now fixed, what still needs your decision, and what couldn't be tested (for example, a real TallyPrime import).

## Technical details
- Spawn 6 read-only background agents in parallel (capable model). Each gets the file list for its area (src/lib/reports/*, receivables.ts, payables.ts, intelligence.ts, useShopVisits, the *_atomic RPCs in migrations, RLS policies) and a defined output format: severity, file:line, repro, fix.
- Cross-check calculations with read-only SQL against the demo business (bill dues vs dealer_outstanding, supplier_balance vs payables.ts, stock vs stock_movements).
- Playwright scripts in /tmp/browser/qa-full, with screenshots per step, a console/page-error capture, and a 393px plus 1280px viewport.
- Fixes go through the normal code and migration paths, and roadmap.md gets updated with findings.
