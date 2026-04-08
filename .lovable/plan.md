

# Fix Edit Inventory Dialog Overflow

## Problem
The Edit Inventory dialog content is **overflowing** outside the dialog box boundaries — the product info card and form fields visually break out of the rounded container. This is not just a scrollbar issue; the content is escaping the dialog bounds.

## Root Cause
The `DialogContent` base class uses `grid` layout with `gap-4`, but lacks `overflow-hidden`. Combined with the `rounded-xl` on the Stock page's dialog, inner content can bleed past the rounded corners. The `p-6` padding in the base dialog plus `p-3` on the product card may also cause the content to push beyond the container width on smaller viewports.

## Fix

**File: `src/pages/Stock.tsx`**, line 664

Add `overflow-hidden` to the product info container to clip content within the rounded border:

```tsx
// Before
<div className="rounded-lg border border-border bg-muted/20 p-3">

// After  
<div className="rounded-lg border border-border bg-muted/20 p-3 overflow-hidden">
```

**File: `src/components/ui/dialog.tsx`**, line 39

Add `overflow-hidden` to the base `DialogContent` class so all dialogs clip content within their rounded borders:

```tsx
// Add overflow-hidden after sm:rounded-lg
"fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 overflow-hidden data-[state=open]:animate-in ..."
```

## Summary
| File | Change |
|------|--------|
| `src/components/ui/dialog.tsx` | Add `overflow-hidden` to DialogContent base class |
| `src/pages/Stock.tsx` | Add `overflow-hidden` to product info card |

Two single-word class additions. No logic changes.

