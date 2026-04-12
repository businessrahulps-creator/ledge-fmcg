

# Billing Audit: Comprehensive Bug & UX Fix

## Issues Found

### Bug 1: No Edit Functionality
There is no edit button or edit flow anywhere. Once a document is created, users cannot modify it at all — not even a draft GST Invoice or an Estimate. The dialog is create-only.

**Fix**: Add an "Edit" button in the actions column for editable documents. Clicking it opens the same dialog pre-filled with the document's data. On save, call `api.invoices.update()` instead of `create()`.

### Bug 2: Estimates & Proformas Created as "Final" — Immediately Locked
The previous fix made Estimates/Proformas create as `status: "final"`, which means they can't be edited or deleted. But Estimates and Proformas are informal documents that should **always** be editable and deletable. Only finalized GST Invoices and Credit Notes should be immutable.

**Fix**: 
- Estimates & Proformas → create as `"final"` (no draft stage needed) BUT allow edit and delete regardless of status since they are not legal documents.
- GST Invoice & Credit Note → create as `"draft"`, editable until finalized. Once finalized, locked.
- Change the edit/delete guard from `inv.status === "draft"` to a helper: `isEditable(inv)` that checks both doc type and status.

### Bug 3: No Confirmation on Destructive Actions
Delete and Finalize happen instantly with no confirmation. Finalizing is irreversible.

**Fix**: Add confirmation dialogs (AlertDialog) for both Delete and Finalize actions.

### Bug 4: HSN Code Editable on Pulled Orders
Line 511 — HSN input has no `readOnly` when `sourceOrderId` is set. While HSN isn't part of the order, it's inconsistent UX. HSN should remain editable (it's billing-specific metadata not in orders), but this should be visually clarified.

**Fix**: Keep HSN editable (it's not order data), but add a subtle visual indicator that it's a billing-only field.

### Bug 5: Mobile Layout Broken
The 12-column grid for line items is unusable on mobile screens.

**Fix**: Stack line item fields vertically on mobile using responsive grid classes.

### Bug 6: No Visual Distinction for Editable vs Locked Documents
Users can't tell at a glance which documents they can still modify.

**Fix**: Already partially addressed by status badges, but the edit button visibility will make this clearer.

## Implementation

**Single file**: `src/pages/Billing.tsx`

1. Add `isEditable(inv)` helper:
   - `estimate` / `proforma` / `invoice` → always editable
   - `gst_invoice` / `credit_note` → editable only when `status === "draft"`

2. Add edit state (`editingInvoice: Invoice | null`) and a `handleEdit(inv)` function that pre-fills the form from the existing document.

3. Modify `handleCreate` to detect edit mode → call `api.invoices.update()` with changed fields instead of `create()`.

4. Show Edit button (Pencil icon) in actions column when `isEditable(inv)`.

5. Add `AlertDialog` confirmations for Delete and Finalize.

6. Make line items grid responsive: `grid-cols-1 sm:grid-cols-12`.

7. Update button label: "Save Changes" in edit mode, "Create as Draft" / "Create Document" in create mode.

No database changes needed.

