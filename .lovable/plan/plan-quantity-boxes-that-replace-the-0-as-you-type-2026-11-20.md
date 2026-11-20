# Plan: Quantity boxes that replace the 0 as you type

## Problem
In the Return dialog, Good / Damaged-credit / Damaged-no-credit show "0". Clicking before it and typing 9 gives "90"; after it gives "09"; deleting the 0 makes it snap back.

## Step 1 — Fix the shared number box (benefits every quantity/price box)
- Select the whole number when the box is clicked, tapped or tabbed into, so typing replaces it.
- Remove a stray leading zero while typing ("09" or "90"-from-default become "9"; "0.5" stays).
- While the box is active, an empty box stays empty; it only falls back to 0 when you leave it (where the form requires a number).
- Tests: replace 0 by typing, cursor before/after 0, decimals, clear and leave.

## Step 2 — Return dialog
- The three return quantity boxes start empty with a light grey "0" hint.
- Empty counts as 0 for totals, credit amount, unit conversion and saving — no change to results.
- Check live in the Return dialog on a real bill (type 9 → shows 9; clear → hint shows; save works).

## Not changing
Any saved data, credit note math, stock, prices, permissions or the database.

## Technical details
- `src/components/ui/number-input.tsx`: `selectOnFocus` (default true, via requestAnimationFrame `select()`), leading-zero strip in handleChange for integers and `0\d` in decimals, skip prop→draft resync while focused unless parent changed externally.
- `src/pages/Claims.tsx`: `allowEmpty`, `placeholder="0"`, `?? 0` where values are read.
- New test `src/components/ui/__tests__/number-input.test.tsx`.
- Pause for "go" between Step 1 and Step 2.
