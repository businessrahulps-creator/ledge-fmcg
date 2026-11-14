# Returns: in-dialog "Saved" confirmation screen

## What the user will see
After **Save return**, the dialog stays open and shows a third step:

```text
(check) Return saved
Credit note: CN/2026-27/0008      or   "No credit note issued – damaged goods without credit"
Dealer: Annapurna Traders  ·  Order ORD-0142  ·  Bill GST/2026-27/0031
Taxable credit   Rs 4,084.75
GST              Rs   735.25
Total credited   Rs 4,820.00
Good goods restocked          3 Case  (typed as 72 Bottle)  -> Central Godown
Damaged goods with credit     1 Case
Damaged goods without credit  0
[ Record another return ]                    [ Close ]
```

- **Close** and the **X** dismiss the dialog. Clicking outside or pressing Esc on the Saved screen also only closes (nothing is lost; it is already saved).
- **Record another return** goes back to step 1 (pick a bill) without closing. The search box keeps the last dealer's name so their other bills are listed first; all quantities, units, reason and the previous result are cleared.
- The short toast stays as a secondary confirmation.

## Where each figure comes from (no extra requests)
Inspected: `recordReturn` returns only `creditNoteNumber`, `grandTotal`, `restocked`; the database function returns `credit_note_id`, `credit_note_number`, `claim_id`, `grand_total`, `restocked`, `lines`.

- Credit note number, total credited, restocked yes/no: the save response.
- Good / damaged-with-credit / damaged-without-credit quantities, typed unit, dealer, order and bill numbers: a snapshot of exactly what was submitted, taken just before the save. The save is all-or-nothing, so a successful response means these were saved as sent.
- Taxable credit, GST and godown are **not** in today's response. To show the real saved figures (not a recalculated estimate), the database function's final reply gains three read-only fields: `taxable_total`, `tax_total`, `godown_name`. These are values it already computes; no calculation, check, lock, permission or write changes.
- On a replayed save (retry after a dropped connection) those extra fields may be missing; the screen then shows only Total credited and hides the split and godown rather than guessing.

## Duplicate-save protection
Already in place: per-attempt save ID and a disabled button while saving. Added: Back, Close, X and outside-click are disabled while saving; the save handler ignores a second call if one is running.

## Not changed
Return calculations, credit-note numbering, claim creation and approval/closing flow, stock restock rules, permissions, bills/PDFs, other pages.

## Technical details
- `record_return_and_credit_atomic`: only the final `RETURN jsonb_build_object(...)` adds `taxable_total`, `tax_total` (the totals written to the credit note; 0 when no credit note) and `godown_name` (name of the godown it restocked into, null if nothing restocked). New migration recreates the function with identical body otherwise; same grants.
- `useBillingDomain.recordReturn`: return type extended with optional `taxableTotal`, `taxTotal`, `godownName`, `claimId`.
- `src/pages/Claims.tsx` (ReturnDialog only): `step` becomes `1 | 2 | 3`; new `result` state = response + submitted snapshot; `startAnother()` clears quantities/units/reason/result/selected order, keeps `search` = dealer name, sets step 1; `onOpenChange` blocked while `submitting`; step 3 render with Close/Record another.
- Check: run existing return-units tests, then a browser run saving a mixed return and confirming the Saved screen numbers match the new credit note.
