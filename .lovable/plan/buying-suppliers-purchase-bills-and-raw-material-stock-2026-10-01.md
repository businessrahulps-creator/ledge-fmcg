# Buying: suppliers, purchase bills and raw material stock

## What this is
Businesses that make products buy raw materials (bottles, sugar, labels, cartons) from suppliers. Today Ledge only tracks selling. **Buying** is the mirror image of Orders + Money to Collect:

```text
Selling (today):  Dealer  -> Order -> GST bill -> Money to collect -> Stock goes down
Buying  (new):    Supplier -> Purchase bill -> Money to pay        -> Stock goes up
```

This follows mature tools (Vyapar, myBillBook, Tally, Zoho Inventory). Astra reviewed them: the simplest version that works is bill-led. The owner types in the supplier's bill when the goods arrive, and Ledge adds the stock and records what is owed. Formal buy orders and "making products" come later.

Visible to **Owner and Accountant only** (people who can see money). Everyone else won't see it.

## What the owner gets

**New "Buying" item in the menu**, with three tabs:

1. **Purchase bills**: list of supplier bills (date, supplier, bill number, amount, paid / partly paid / unpaid). Tapping one opens the full bill.
   - **Add purchase bill**: choose supplier, type their bill number and date, pick the godown the goods went to, then add items with quantity, rate and GST %. Totals and GST are worked out automatically. Saving adds the stock and the amount owed.
   - A saved bill can't be edited, the same rule as sales bills. Mistakes are fixed with **Return to supplier**, which takes stock back out and reduces what you owe, or with **Cancel bill**, allowed only if no payment has been made and none of its stock has been used.
2. **Suppliers**: add, edit and search suppliers (name, phone, GSTIN, address, opening amount owed). Each supplier page shows their bills, payments and **Money you owe them**.
3. **Money to pay**: who you owe the most, how old each bill is, and a **Pay supplier** button (Cash / UPI / Bank / Cheque, partial payments allowed, wrong payments can be cancelled with a reason).

**Raw materials in Stock**: items can be marked as **Raw material** or **Product for sale**. Raw materials:
- show in Stock with their own filter
- never appear when taking a dealer order
- can be bought on purchase bills (sale products can be bought too, for traders)

**My Business**: one new line, "Money you owe suppliers", next to "Money dealers owe you".

## Business rules
- Only a saved purchase bill increases stock (in the chosen godown), recorded in stock history. Returns reduce it.
- Supplier balance = opening amount + bills − returns − payments. One calculation, used everywhere.
- GST on purchases is stored separately (CGST/SGST or IGST from the supplier's state) and shown as "GST paid on purchases". Ledge doesn't claim it is all recoverable; that's the accountant's call.
- **Cost per unit**: weighted average of purchase rates before GST. It's shown on raw materials and kept ready for the future "make products" step.
- The same supplier bill number can't be entered twice for one supplier. Double taps on Save don't create two bills.
- Every save, return, cancel and payment happens in one go on the server (all or nothing), checked against the business, and logged in Activity.

## Not in this version (planned later)
Buy orders before goods arrive, goods-received notes, **Make products** (using up raw materials to create finished stock, with a "materials needed" recipe), freight/extra cost sharing, batches/expiry, GST return matching.

## Checks
- Unit tests for totals, GST split, supplier balance, average cost and returns.
- Server tests: double-save, cross-business access blocked, stock and balance correct after bill, return, cancel and payment.
- Browser check in the demo business on computer and phone: add supplier, purchase bill, pay part, return part, then confirm stock and balances.
- Astra review of the finished screens and wording.

## Technical details
- **Migration (additive)**:
  - `products.item_kind text default 'product'` (`'product' | 'raw_material'`), plus `products.avg_cost numeric default 0`.
  - New tables, each with company_id, GRANTs, RLS via `get_company_id()` + `has_capability(auth.uid(),'see_money')` (select only; writes go through RPCs): `suppliers`, `purchase_bills`, `purchase_bill_lines`, `purchase_returns`, `purchase_return_lines`, `supplier_payments`.
  - Unique `(company_id, supplier_id, lower(supplier_bill_no))`, and idempotency keys on bills, returns and payments.
- **SECURITY DEFINER RPCs** (revoke from public, grant to authenticated, tenant + capability checked, row locks): `record_purchase_bill_atomic`, `return_purchase_atomic`, `cancel_purchase_bill_atomic`, `record_supplier_payment_atomic`, `void_supplier_payment_atomic`. Each writes `stock_movements` (`movement_type` purchase / purchase_return / purchase_cancel), upserts `stock_items`, updates `avg_cost`, and writes to `activity_log`.
- `supplier_balance(p_supplier)` SQL function; client mirror in `src/lib/payables.ts` (pure, tested).
- Frontend: route `/buying` (lazy, inside AppShell, `RequireCapability see_money`), sidebar entry under Work, prefetch. Pages `src/pages/Buying.tsx`, `PurchaseBillDetail.tsx`, `SupplierDetail.tsx`; modals for supplier CRUD and payments; full page for New purchase bill. Hook `useBuying` (company-scoped queries, realtime-free reload after mutations). New Order product picker filters `item_kind = 'product'`.
- Plain-language words added to the approved word list: Buying, Purchase bill, Supplier, Money to pay, Return to supplier, Raw material.
- Record the module decision in `AGENTS.md`.
