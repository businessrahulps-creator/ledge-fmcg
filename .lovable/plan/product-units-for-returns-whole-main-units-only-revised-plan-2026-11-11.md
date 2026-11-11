# Product units for returns — whole main units only (revised plan)

## Decision
Returns can be entered in any unit set up for a product (Case, Bottle, Pouch, kg…). The amount saved must always be a **whole number of the product's main unit**. Part-units, such as a quarter Case, are refused with a clear message. Stock, claims and credit notes stay whole numbers.

Example: main unit Case, 1 Case = 24 Bottles. Returning 24 or 48 Bottles works (1 or 2 Cases). Returning 6 Bottles is refused: "6 Bottle is not a whole Case. Enter a multiple of 24 Bottle." If the main unit is Bottle, then 1 Case = 24 Bottles always converts to whole Bottles.

## What this removes from the plan
- **No decimal widening** of stock, stock history, claim or credit-note quantities. No table locks, no short pause during the change, no backup-gated migration and no before/after comparison for it.
- No last-piece snap and no 1/7 rounding rules. Rounding comes only from the money formula already used today.
- The remaining Phase 2 work, the preservation gate, is cancelled. The pending decimal migration is not run.

## What stays (already built and kept)
- Phase 1 decimal-safe readers stay. They are harmless with whole numbers and need no rollback.
- Phase 2 items already live stay: product units (archive, locked once used), the single return record per bill line (`return_line_ledger`, read-only for users, guarded against bad links and over-returning), snapshot columns on claim and credit-note lines, and the backfill (24 rows, 646 units).
- Locking order, unit checks on the server, the three return kinds and the cumulative limit all stay as approved.

## How conversion works now
- Each unit stores how many of it make one main unit, or how many main units it holds, depending on direction. The server works out main-unit quantity = entered ÷ units-per-main.
- The server accepts the return only if that result is a whole number greater than 0. This check uses exact numbers, not floating point.
- When adding a unit, the product window shows a hint, for example "Returns in Bottle must add up to whole Cases". Units are not blocked, because multiples always work.

## Revised phases
- **Phase 2 — close-out (small):**
  - Add a database rule that ledger main-unit quantities must be whole numbers.
  - Run the outstanding refusal tests: cross-business link, reused link, delete or edit refused.
  - Report to the owner. No column type changes.
- **Phase 3 — return function:**
  - Same name, and existing inputs keep working.
  - Adds unit id plus entered quantity for each kind: good, damaged with credit, damaged without credit.
  - Server loads and locks the unit, refuses part-units and converts to a whole main-unit quantity.
  - Locks in the approved order, then checks remaining = billed − ledger total.
  - Writes the ledger, both snapshots, credit with the existing rounding, and restocks good returns only.
- **Phase 4 — app:**
  - Units on the product window.
  - Return dialog: unit picker, three amounts, a live "Remaining", and an instant part-unit warning that mirrors the server.
  - Claims show the entered unit.
  - The read-only stock helper line ("= 48 Bottle") is optional.
- **Phase 5 — tests and browser check:** whole-multiple accepted, part-unit refused (app and server), remaining counts all three kinds, no double counting, two returns at the same time (only one succeeds), unit from another business or product refused, conversion sent by the app ignored, archived unit refused mid-return, existing billing/stock/claims tests still pass. One test return in the browser, then removed.
- **Phase 6 — release check:** stock, credit and Activity totals compared after release.

## Not changing
Orders, invoices and printouts, prices, offers, buying, GST, Add Stock, approval steps and permissions.

## Rollback
Everything above can sit unused. No one-way column change remains in the plan.
