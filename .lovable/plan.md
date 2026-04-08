
## Fix Edit Inventory Dialog Properly

### What’s actually wrong
Yes, we are on the same page now: this is not a leftover scrollbar issue. The dialog is still being forced wider internally, so multiple rows look like they are spilling out.

### Root cause
The current footer fix is still wrong for this dialog:

- `DialogFooter` has a built-in `sm:flex-row`
- this dialog is capped at `sm:max-w-md`, so it stays relatively narrow
- the three buttons can never fit in one row inside that width
- once the footer becomes too wide, the dialog’s `grid` layout sizes itself from that wide child, which makes the product card and inputs appear to overflow too

So the real issue is: the footer layout is still expanding the dialog content width.

## Implementation plan

### 1. Keep the global dialog component as-is
**File:** `src/components/ui/dialog.tsx`

No further global dialog changes. The base component is not the problem anymore.

### 2. Make the Edit Inventory footer permanently two-row
**File:** `src/pages/Stock.tsx`

Update only the Edit Inventory dialog footer so it never switches back to a single row.

Use a layout like this:

```tsx
<DialogFooter className="w-full flex-col gap-2 sm:flex-col sm:space-x-0">
  <Button
    variant="destructive"
    onClick={deleteStockItemFn}
    className="w-full"
  >
    Remove from Warehouse
  </Button>

  <div className="grid w-full grid-cols-2 gap-2">
    <Button
      variant="outline"
      onClick={() => setEditStockItem(null)}
      className="w-full"
    >
      Cancel
    </Button>
    <Button onClick={saveStockItemFn} className="w-full">
      Save Changes
    </Button>
  </div>
</DialogFooter>
```

### 3. Keep the product card overflow fix
Keep this line unchanged:

```tsx
<div className="rounded-lg border border-border bg-muted/20 p-3 overflow-hidden">
```

That still helps contain the product info card cleanly.

## Why this will fix the screenshot
- the footer will stop trying to become a horizontal 3-button row
- the dialog’s grid width will no longer be stretched by the footer
- the product card, threshold input, and action buttons will all align inside the modal again

## Files affected
- `src/pages/Stock.tsx`

## Technical note
The key correction is overriding the inherited responsive footer behavior with `sm:flex-col sm:space-x-0`, because this modal stays narrow even on larger screens. The previous assumption that it could safely return to a single-row footer was incorrect for a `max-w-md` dialog.
