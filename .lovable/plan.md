# Seed 7 days of sample data for karmantantra@gmail.com ("anaar")

Business today: 2 orders, 2 dealers, 3 products, 3 godowns, 2 salespeople, no suppliers, no GST number (so bills will be "Bill of supply", no tax).

## What gets added (29 Oct – 4 Nov 2026, IST)
- Masters: +4 dealers (with credit limits), +5 products, 1 supplier, stock in each godown. Existing records kept untouched.
- Orders: ~25 orders spread across 7 days and both salespeople, mixed cash / UPI / bank / cheque.
- Sending: ~15 orders sent and billed (Bill of supply), ~4 marked delivered, rest left pending.
- Payments: full, part and unpaid mix; one overpay with "keep as dealer credit"; one cash payment with change given.
- Exceptions: 1 cancelled order, 1 return with credit note, 1 claim.
- Buying: 2 purchase bills, 1 supplier payment.
- Shop visits: ~6 visits incl. one promise to pay, 2 new shop leads.
- Offer: 1 active scheme.

All rows tagged `[seed]` in notes/remarks so they can be found or removed later.

## How
- Everything goes through the app's own save actions (book order, dispatch & bill, record payment, cancel, return, purchase bill, etc.), run as this account, so stock, balances, bill numbers and the Activity page/bell all stay correct — same approach used for the earlier seed.
- Dates back-dated per day after creation so lists and reports show a real week.
- Verify afterwards: dealer balances = bills − payments − credit notes, stock matches movements, Activity shows each seeded action, Dashboard/Reports show the week.

## Note
Names and amounts are made-up sample data.
