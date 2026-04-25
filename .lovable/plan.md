## Verified findings

Looked at `src/pages/Billing.tsx` and the dealer/data shape. Two precise gaps match what you reported:

### 1. Buyer GSTIN / state code not populated from dealer
In `handleSelectOrder` (around lines 156–183), when an order is selected we look up the linked dealer and set `buyerName`, `buyerAddress`, `vehicle`, `driverName` — but we never set `buyerGstin` or `buyerStateCode`. The dealer record already has both (`dealer.gstin`, `dealer.stateCode`, mapped from `distributors.gstin` / `distributors.state_code`), so users today have to retype them every time.

### 2. Auto-injected "Converted from …" note
In `handleConvertToGst` (line 347):
```ts
setNotes(inv.notes || `Converted from ${docTypeLabels[inv.docType]} ${inv.invoiceNumber}`);
```
If the source estimate has no notes, we silently inject `"Converted from Estimate EST-…"` into the new proforma / credit note / GST invoice notes field. That's the text you want gone.

(Note: the existing `sourceOrderId` link is still preserved as a structured field on the invoice — removing the auto-note doesn't break the lineage badge in the list view, which uses `sourceOrderId`, not the notes string.)

## Proposed changes — `src/pages/Billing.tsx` only

**A. Auto-fill buyer GSTIN + state code from the dealer**
In `handleSelectOrder`, after the existing `dealer` lookup, also set:
```ts
setBuyerGstin(dealer?.gstin || "");
setBuyerStateCode(dealer?.stateCode || "");
```
This fills the fields when the dealer has them on file, and leaves them blank (editable) when the dealer record is missing those values — so the user never has to retype, but can still override.

**B. Remove auto-insertion of the conversion note**
Change the line in `handleConvertToGst` from:
```ts
setNotes(inv.notes || `Converted from ${docTypeLabels[inv.docType]} ${inv.invoiceNumber}`);
```
to:
```ts
setNotes(inv.notes || "");
```
Notes will only carry forward what the user actually typed on the source estimate; if the source had none, the field stays empty.

## Out of scope (intentionally unchanged)
- Tax calculation (`calculated` memo), state-code consistency validation, GSTIN format validation.
- PDF generation (`GstInvoicePdf`, `handleDownloadPdf`).
- The structured `sourceOrderId` link between estimate and converted document.
- Edit flow (`handleEdit`) — it already loads the saved GSTIN/state from the existing invoice, which is correct.

## Verification after the change
- Pick an order whose dealer has a GSTIN on file → open "Create from order" → confirm GSTIN and state code are pre-filled and editable.
- Pick an order whose dealer has no GSTIN → fields stay blank, no error.
- Convert an estimate with empty notes to GST invoice → notes textarea is empty.
- Convert an estimate that *does* have notes → those notes carry forward unchanged.
- Run `tsc --noEmit` to confirm no type regressions.