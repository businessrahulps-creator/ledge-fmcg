# A bug-hunting brief you can hand to Cursor

You want one document you can drop into Cursor that tells it exactly how to hunt for bugs in Ledge — grounded in how a real distributor actually uses the app, not a generic "find bugs" request.

## What you get

A single file, `ledge-qa-bug-hunt.md`, saved to your Files so you can download it and drop it into the repo (or paste it into Cursor).

## What goes inside it

**1. Ground rules for Cursor**
How to behave: read before claiming, never guess a cause, reproduce with a test where possible, one finding = one entry, no refactoring while auditing, don't touch auto-generated files or the pricing engine without a regression test.

**2. The product in one page**
What Ledge is, who uses it (owner, manager, salesperson, accountant), and the money rules that must never break: order value is pre-discount, schemes subtract once, the GST bill is created at dispatch and is immutable, receipts can be partial or advance, balances come from one canonical source, stock deducts atomically at dispatch.

**3. The eleven real workflows, step by step**
Each written as the user lives it, with the exact screens, the expected result at every step, and the things that historically go wrong:
- Sign up, company setup, first-week onboarding, team invite
- Add dealer, add salesperson, add products and warehouses
- Place an order (schemes, free goods, credit limit, advance received)
- Open the order, edit before dispatch, cancel, delete guards
- Dispatch and bill (stock deduction, GST fields, invoice numbering)
- Record a payment, part payment, void a receipt, credit note
- Money to collect: ageing, reminders, dealer statement
- Returns and claims
- Targets and salesperson performance
- Insights/Command: filters, saved views, drill-down, print
- Every PDF export end to end

**4. Cross-cutting hunt lists**
Money correctness, multi-tenant isolation and role permissions, database-level checks (RLS, grants, atomic RPCs, idempotency), offline/PWA and stale-asset recovery, mobile layout at 393px, performance (list sizes, re-render storms, initial load), accessibility, and empty/error/loading states.

**5. Adversarial cases**
Zero-quantity lines, huge numbers, duplicate rapid submits, two tabs on the same order, dispatch twice, payment larger than the bill, deleting a dealer with open orders, backdated orders, clock skew, expired schemes, negative stock, orphan records.

**6. Reporting format**
A fixed template Cursor must use for each bug: ID, severity, screen, steps, expected, actual, evidence (file:line), suspected cause, suggested fix, regression test to add. Plus a severity scale tied to money loss and data corruption.

**7. Verification commands**
Typecheck, `bunx vitest run`, Playwright e2e, build — with the rule that a finding isn't real until it's reproduced.

## Technical notes

- Written as a Cursor-ready prompt with explicit file pointers: `src/lib/order-pricing.ts`, `src/context/domains/*`, `src/lib/receivables.ts`, `src/lib/credit-exposure.ts`, `src/lib/bill-status.ts`, `src/components/pdf/*`, `supabase/migrations/*`, `e2e/*`.
- Restates the hard rules already in `.cursorrules` so the prompt stands alone.
- No app code changes in this task — the deliverable is the document only.
