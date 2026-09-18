# Demo workspace: rename owner + business, add the last 7 days of activity

Getting the demo account (asha@getledge.in, currently "Asha Beverages Distributors") ready to show live.

## Rename

- Owner name becomes **Rahul Ps** everywhere it shows in the app (profile name, greeting, activity entries, order/dispatch trails).
- Business name becomes **Rahul Ps Traders & Co**.
- Login email, phone, GST number and bank details stay exactly as they are.
- Bills and credit notes already issued keep the name they were printed with — a GST document can't be edited after it's raised. Any new bill raised during the demo will print the new name.

## Last 7 days of activity

Today the workspace has one order in the last seven days and nothing since 14 Sep, so the dashboard and Money screens look asleep. New activity from 12–18 Sep, using the existing 81 dealers, 45 products, 12 reps and 5 warehouses:

- 4–7 orders a day, spread across dealers, reps and regions, with realistic quantities and the existing offers applied.
- Most of the older days are dispatched and billed; a few from the last two days stay pending so the Orders screen has live work in it.
- Payments collected against most bills — a mix of full and part payments, cash/UPI/bank transfer — leaving a believable "Money to collect" figure and a couple of overdue ones.
- One return with a credit note against a billed order, so Returns isn't empty.
- Stock deducted for each dispatch, so warehouse numbers stay consistent with what shipped.
- Matching activity entries so the timeline reads like a real week.

Every new order is built with the same rules the app uses when you book one by hand — same pricing, tax, numbering and stock behaviour — so the money on screen reconciles.

## Technical notes

- Rename: `UPDATE` on `companies.name` and `profiles.full_name` for company `65cac…680e`; `activity_log.user_name` and `orders.salesperson_name` are left untouched except where they carry the owner's name.
- Seeding: one scripted pass using the existing atomic RPCs (`book_order_atomic`, `dispatch_and_bill_order_atomic`, `record_invoice_payment_atomic`, `record_return_and_credit_atomic`) so sequences, GST, stock ledger and canonical balances stay correct — no hand-written rows into `orders`/`invoices`.
- Dates are backdated after booking (`orders.date`, `dispatch_date`, `invoices.invoice_date`, `invoice_payments.paid_on`) to land inside 12–18 Sep on India time.
- No application code changes; nothing outside this one workspace is touched.
