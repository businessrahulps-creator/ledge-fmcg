

# Fix Edit Inventory Dialog Layout

## Problem
The `overflow-hidden` we just added to `DialogContent` is clipping the footer buttons — "Save Changes" is cut off on the right. The three buttons ("Remove from Warehouse", "Cancel", "Save Changes") are too wide to fit in one row at this viewport size.

## Fix

### 1. `src/components/ui/dialog.tsx` — revert `overflow-hidden`
Remove `overflow-hidden` from the base `DialogContent` class. It was too aggressive — it clips content like footer buttons. The original overflow issue was specific to the product info card, not the dialog itself.

### 2. `src/pages/Stock.tsx` — keep `overflow-hidden` on the product card (already done), and fix footer buttons
- Keep `overflow-hidden` on the product info `<div>` (line 664) — that fixes the original overflow
- Update the `DialogFooter` (line 693) to stack buttons vertically on small screens so they don't overflow:

```tsx
<DialogFooter className="flex-col gap-2">
  <Button variant="destructive" onClick={deleteStockItemFn} className="w-full sm:w-auto sm:mr-auto">
    Remove from Warehouse
  </Button>
  <div className="flex gap-2 w-full sm:w-auto">
    <Button variant="outline" onClick={() => setEditStockItem(null)} className="flex-1 sm:flex-initial">Cancel</Button>
    <Button onClick={saveStockItemFn} className="flex-1 sm:flex-initial">Save Changes</Button>
  </div>
</DialogFooter>
```

This stacks "Remove from Warehouse" full-width on top, with "Cancel" and "Save Changes" side by side below on mobile, and reverts to a single row on wider screens.

## Summary
| File | Change |
|------|--------|
| `src/components/ui/dialog.tsx` | Remove `overflow-hidden` from base DialogContent |
| `src/pages/Stock.tsx` | Restructure footer buttons to prevent horizontal overflow |

