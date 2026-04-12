

# Billing Audit: Bug Fixes & UX Improvements

## Bugs Found

### Bug 1: Order items are editable after pulling
When a user pulls from an existing order, all line items become editable text fields — the user can add new items, delete items, or change quantities/prices. This violates the requirement that billing should NOT modify orders.

**Fix**: When `sourceOrderId` is set (order is pulled), lock all line item fields as read-only. Hide the "Add Item" and delete buttons. Show a subtle "Linked to order" indicator.

### Bug 2: Draft/Final status applies to all document types
Currently every document type (Estimate, Proforma, Invoice, etc.) creates as "Draft" and requires a manual "Finalize" step. This is confusing because:
- **GST Invoice / Credit Note**: These are legal tax documents → draft/finalize makes sense (review before locking)
- **Estimate / Proforma / Regular Invoice**: These are simpler documents → no need for draft stage, create directly as "final"

**Fix**: 
- GST Invoice & Credit Note → create as "draft", show finalize button
- Invoice, Estimate, Proforma → create directly as "final" (no draft step)
- Update the create button label dynamically: "Create as Draft" for GST types, "Create Document" for others

### Bug 3: Missing DialogDescription (console warning)
The dialog is missing an `aria-describedby` / `DialogDescription`, causing an accessibility warning.

**Fix**: Add a `DialogDescription` to the create dialog.

## Changes

**File: `src/pages/Billing.tsx`** — All fixes in this single file:

1. When `sourceOrderId` is set, make line item inputs `readOnly`/`disabled`, hide "Add Item" and delete buttons
2. Change `handleCreate` to set `status: "draft"` only for `gst_invoice` / `credit_note`, and `"final"` for all others
3. Update create button label based on doc type
4. Add `DialogDescription` for accessibility
5. Show a "Linked to Order" badge when order is pulled, with option to unlink

No other files modified. No database changes needed.
