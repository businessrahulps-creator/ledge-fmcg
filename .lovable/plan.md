# Sample Buying records for the demo business

## What you'll see
After this, opening **Buying** in the demo business shows realistic records you can click through:

- **4 suppliers**: Sri Lakshmi Plastics (bottles), Kerala Sugar Traders, PrintPack Labels (from another state, so it shows IGST), and Coastal Cartons.
- **4 raw materials** added to Stock: PET bottles 500ml, Sugar (kg), Printed labels, Cartons. They're marked "Raw material", so they never appear when taking a dealer order.
- **About 8 purchase bills** spread over the last 6 weeks, with a mix of 5%, 12% and 18% GST. Saving each one adds its stock to your main godown.
- **Payments** that leave one supplier fully paid, one partly paid, one unpaid with an old bill (so "Money to pay" shows how old the bill is), and one with an opening amount owed.
- **1 return to supplier** (some damaged cartons) and **1 cancelled bill** with a reason, so you can see how both look.

The old "Edge QA" test supplier stays in the list, because suppliers can't be deleted.

## How it's done
Every record is saved through the same steps the app uses when you enter a bill yourself. That way stock, average cost per unit, money owed and the Activity log all match each other, just like real data.

## Technical details
- Target: the signed-in demo company, taken from the current preview session.
- Raw material products are added straight into the products table (`item_kind = 'raw_material'`, with HSN codes and GST rates). Suppliers are added with a state code; PrintPack uses `29`, which is different from the company's state, so its bills use IGST.
- Bills, payments, the return and the cancellation go through `record_purchase_bill_atomic`, `record_supplier_payment_atomic`, `return_purchase_atomic` and `cancel_purchase_bill_atomic`, using the user's session and fresh idempotency keys, run from a script in /tmp. Past bill dates are passed as `p_bill_date`.
- Afterwards: check the supplier balances against the app's own calculation, check stock went up in the godown, and look at Buying on computer and phone.
