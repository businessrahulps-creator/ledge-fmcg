

# Add Keyboard Shortcuts: Enter to Submit, Escape to Close

## Problem

All CRUD dialogs (Dealers, Sales Team, Stock, Settings, Billing) lack keyboard shortcuts. Users must click buttons to submit or close — no Enter/Escape support.

## Solution

Wrap each dialog's form inputs in a `<form onSubmit>` element so Enter naturally triggers the save function, and rely on Radix Dialog's built-in Escape handling (already works via `onOpenChange`).

## Implementation

**Affected files** (all use the same pattern of `<DialogContent>` → `<div className="space-y-...">` → inputs → `<DialogFooter>` with save button):

1. `src/pages/Distributors.tsx`
2. `src/pages/Salespersons.tsx`
3. `src/pages/Stock.tsx` (3 dialogs: product, warehouse, stock item)
4. `src/pages/Settings.tsx` (team member dialog)

**Pattern per dialog:**

- Wrap the content `<div>` + `<DialogFooter>` inside a `<form onSubmit={(e) => { e.preventDefault(); save(); }}>` element
- Change the save `<Button>` to `type="submit"`
- Change the cancel `<Button>` to `type="button"` (prevents accidental submit)

Escape already works — Radix Dialog handles it natively via `onOpenChange`. No extra code needed.

**No new files. No new dependencies. No database changes. ~5 lines changed per dialog.**

