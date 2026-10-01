# Astra full logic audit

Goal: have Astra check every business rule in Ledge (not only money maths) and fix what it confirms, the same way as the last calculation review.

## What Astra reviews (in groups, one call each so nothing is skimmed)

1. Orders: booking, offers, editing an order, cancelling, order numbers, who may do what.
2. Sending and billing: stock checks, GST split (state rules, place of supply), bill numbers per financial year, credit limit and override.
3. Money: payments, advances, overpay, cancelling a payment, paid / part paid / not paid status, dealer balance, age of unpaid bills.
4. Returns and credit notes: quantity limits, restock, rounding, amount in words.
5. Stock: deduct, restore on reversal, manual adjust, godown delete guard, low-stock counts.
6. Reports and My Business: period ranges and time zone, period comparisons, trends, targets, signals, cancelled orders excluded everywhere.
7. Permissions and safety: roles and capabilities, business isolation, admin panel access, invites.

For each group Astra gets the actual code and database rules plus a live cross-check of the demo business numbers, and returns: confirmed bugs (with a worked example and severity) vs. risks worth a test.

## How findings are handled

- I verify each finding against the real code and data before acting; false alarms are dropped and reported as such.
- Confirmed bugs fixed one at a time, smallest change, with a test where possible.
- Anything that changes how future bills, balances or permissions behave is listed for your OK before I change it (like last time).
- Printed bills and existing GST documents are never altered.

## What you get

A plain-language summary: what is correct, what I fixed, what needs your decision, and what is still open (the three known items: split-return rounding, custom date range start time, missing opening stock history).

## Technical details

- Astra via AI gateway (openai/gpt-6-astra, Responses API); inputs: src/lib/*, domain hooks, pages with money logic, and pg_get_functiondef of all public SECURITY DEFINER functions/triggers, plus RLS policies.
- Live reconciliation SQL rerun on the demo business (65cacbde-...) after fixes.
- After each fix: bunx tsgo --noEmit, bunx vitest run (326 baseline), build log check; one booking + bill + payment run in the demo business as asha@getledge.in to confirm the new offer/GST/credit rules end to end.
