# Fix: "Dispatch & bill" blocked for businesses without GST

## What's wrong
Podaran Tilo Juice pressed Dispatch & bill 5 times on ORD-2026-0001. Each try failed with "Some required information is missing". The real reason: a GST bill needs a state (place of supply). This business has no GST number and no state, and dealer Ajmeer has neither, so the bill was refused. Stock, items and payment are all fine.

## What we'll build
GST should never stop an order going out.

1. **Business without a GST number → "Bill of supply".** Dispatch & bill still works in one step: stock goes out, the order is marked Sent, and a plain bill is created with no CGST/SGST/IGST. Bill total = item prices (after offers). It has its own numbering (e.g. BOS/2026-27/0001), separate from GST bills.
2. **Business with a GST number** works exactly as today. If the dealer has no GST number or state, the bill uses the business's state (CGST + SGST).
3. **The bill page, PDF, WhatsApp share and thermal receipt** show "BILL OF SUPPLY" and no tax lines. Payments, balances, returns (credit notes without tax), reports and Activity treat it like any other bill.
4. **Order totals:** when the business has no GST number, new orders don't add GST; existing booked orders (like ORD-2026-0001) are billed at their item prices without tax, and the money already received is matched against that bill. Any extra goes through the usual owner choice (other bills / dealer credit / give back).
5. **Clear messages:** if anything still blocks dispatch, the message says exactly what (e.g. "Add your business state in My Business"), and Activity records that real reason.
6. **My Business:** a short note "No GST number — Ledge will make Bills of supply. Add a GST number any time to start GST bills." Adding one later only affects new bills; old bills never change.

## Not changed
GST bills stay unchanged once made. No guessing of GST numbers or states. Stock, payment locking and duplicate-save protection stay the same.

## Technical details
- Migration: `dispatch_and_bill_order_atomic` — if `NULLIF(company.gstin,'')` is null: `doc_type='bill_of_supply'`, all tax = 0, `supply_type='exempt'`-style value, `place_of_supply_state_code` = dealer/company state or `''` (column NOT NULL; use empty string), line taxable = line_total, number from `document_sequences` doc_type `bill_of_supply`. Otherwise current path, plus `RAISE` a named `business_state_missing` error instead of the null violation. Check `invoices.doc_type`/`supply_type` constraints and widen them additively.
- `order_bill_equivalent`/`preview_dispatch_impact`/credit notes: zero GST when company unregistered.
- Client: NewOrder/booking tax preview uses company GST status; invoice view, PDF, `thermal-receipt.ts` titles switch on `doc_type`; Tally export marks bills of supply as non-GST sales.
- `handleSupabaseError`: map `business_state_missing`.
- Vitest: unregistered → zero tax and total = items; registered with no dealer state → intra-state; receipt title "BILL OF SUPPLY".
- Verify: Playwright on a test business without GST — book, dispatch & bill, open bill, print receipt; then retry ORD-2026-0001 pattern on a copy. Record rule in AGENTS.md.
