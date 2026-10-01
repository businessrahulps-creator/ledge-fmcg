# Make the "Net effect" box on My Business understandable

## What the box means today
It compares two numbers for the chosen period:
- money you collected from dealers, and
- the value of bills you made.

If you collected more than you billed, the total money dealers owe you went down ("Balance came down"). If you billed more than you collected, it went up. "Balance" means the unpaid amount dealers owe you, but the box never says that, and "Net effect" is jargon.

## Change (words only, same number, same rule)
| Now | New |
|---|---|
| Net effect | Money dealers owe you |
| Balance came down | Went down by ₹X |
| Balance went up | Went up by ₹X |
| No change | No change |
| Money in minus money billed | You collected more than you billed (or "You billed more than you collected") |

Colours stay as they are: green when it went down, orange when it went up.

## Check
- Open My Business in the demo business on phone and desktop and confirm the box reads clearly for Today, 7D, 30D and 90D.
- Run the automatic tests.

## Technical details
- Only `src/components/command/HeroBand.tsx` (the figure at lines 55-60): label, value (uses `formatCurrency(Math.abs(net))`), note chosen by the sign of `net`.
- Add "Money dealers owe you" to the plain-language word list in memory.
