# Numbers update within seconds, everywhere

## What's causing the 5–10 minute delay
The database itself is healthy: low load, plenty of room, no errors. The delay comes from how other screens find out that something changed.

- Ledge updates open screens the moment something changes, but only for some kinds of records. Payments, credit notes, bills, claims, targets and secondary sales are not switched on for live updates.
- The app does listen for bill and claim changes, but because those records aren't switched on, nothing ever arrives. Payments and credit notes aren't listened for at all.
- So on any other open screen or phone, money figures only catch up during a background refresh every 5 minutes, or when the tab is reopened after 5 minutes. That matches the 5–10 minutes customers see. A brand-new account behaves the same way because this is a setting, not a data-size problem.
- One smaller cost: the dealer balance lookup averages about 0.1 s and runs very often (2,300+ times). It adds up on busy screens.

## What will change
1. **Switch on live updates** for payments, credit notes, bills, claims, targets and secondary sales. Access stays limited to each business's own records, as today.
2. **Listen for payments and credit notes** on every open screen. A change refreshes the money figures (paid labels, balances, Today's work, Dashboard) within about a second, grouped so a burst of changes triggers one refresh.
3. **Refresh dealer balances alongside** a payment, bill or credit-note change, so dealer totals move together with the labels.
4. **Safety net stays:** the 5-minute background refresh remains as a backup if the live connection drops. It also runs immediately when the connection comes back.
5. **Faster dealer balance lookup:** add the missing database lookups the balance calculation needs (by dealer and status on payments and credit notes, by order on bills). The money rules stay exactly the same.

## How I'll verify
- Before and after: time the dealer balance lookup on real data.
- With two browser sessions on the same business, record a payment in one and time how long the other takes to update its label and dealer balance. Target: under 3 seconds.
- Run all automatic checks.

## Technical notes
- Migration: `ALTER PUBLICATION supabase_realtime ADD TABLE public.invoice_payments, public.credit_notes, public.invoices, public.claims, public.targets, public.secondary_sales;` RLS already scopes these by company. Realtime respects RLS for authenticated clients.
- Indexes (create only if `pg_indexes` shows they're missing): `invoice_payments(distributor_id, status)`, `credit_notes(distributor_id)`, `invoices(source_order_id) where doc_type='gst_invoice'`. Confirm with EXPLAIN ANALYZE on `dealer_balances`.
- `DataContext` channel: add `invoice_payments` and `credit_notes` handlers → debounced (250ms) call to `useCollections` reload (`loadCollections(companyId, true)`) and `dealers.safeRefetch`. Export a non-hook `reloadCollections(companyId)` from `useCollections.ts`.
- The resubscribe path on `online` triggers one silent `fetchAll` to catch up on missed events.
- No changes to money calculations, RPCs or immutability rules.
