# Full-flow simulation on the demo week

Drive the app end to end the way a real user would, using the 12–18 Sep demo data, and check that every number that appears on screen matches what the database actually holds.

## What gets exercised

One complete life of an order, signed in as the owner, on a phone-sized screen:

1. Book a new order for an existing dealer — dealer search, products, quantities, an offer applied, the total shown before saving.
2. Open the order, dispatch it and raise the GST bill.
3. Record a part payment, then the rest; try to pay more than what is due and confirm it is refused.
4. File a return against the billed order and let the credit note be raised, with stock put back.
5. Cancel a different order and check it drops out of every live figure.

Alongside that, a read-only reconciliation across the existing week's data.

## The maths that gets checked

- Order total: line prices, offer savings, tax split, and the total the order shows — against `computeOrderPricing` rules and against the stored row.
- Bill: taxable value, CGST/SGST for same-state dealers vs IGST for others, rounding, grand total, amount in words.
- Money: bill total minus receipts equals what "Still due" says; part payments and advances land on the right bill; a cancelled receipt puts the balance back.
- Return: credited value, tax reversed in proportion, the bill balance after the credit note, and the returnable quantity cap on a second return.
- Stock: units leave on dispatch, come back on a restocked return and on a cancelled dispatch; no warehouse goes negative.
- Dealer outstanding, ageing buckets and "Money to collect" totals reconcile with the bills behind them.
- Dashboard, Orders, Money, Insights and the dealer page all show the same figure for the same thing.
- Order and bill numbering runs without gaps or repeats.

## What you get

One report: what worked, and every mismatch found — what the screen said, what the data says, and how big the gap is, with a severity and the smallest fix for each. No code changes until you say so.

## Notes

- This creates real records in the demo workspace: roughly one new order, one bill, two receipts, one credit note, plus one cancellation. They will be named so they are obvious, and the report lists exactly what was created so they can be removed before the demo if you prefer a clean week.
- Driven through the running app in a headless browser at 393x852 using the existing signed-in session, with database reads alongside to compare against.
- Can't be covered: real iPhone Safari, true slow network, and two people acting at the same second on two devices.
