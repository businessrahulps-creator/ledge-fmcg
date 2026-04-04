

# Indian Rupee Formatting, Auto-Focus & Empty State CTAs

## 1. Fix ₹ formatting to proper Indian style (₹1,23,456.78)

**File: `src/data/mock-data.ts`** (line 174–179)

The `formatCurrency` function already uses `en-IN` locale and `INR` currency — so the grouping (1,23,456) is correct. The only issue is `maximumFractionDigits: 0` which drops paise. Change to `minimumFractionDigits: 0, maximumFractionDigits: 2` so decimals show only when meaningful (e.g. ₹1,23,456 stays clean, but ₹99.50 renders correctly).

No other files need changes — all 12 consumers import this single function.

## 2. Auto-focus first product row after selecting dealer

**File: `src/pages/NewOrder.tsx`**

Add a `useRef` on the first product Select trigger. When `selectedDealer` changes from empty to a value, call `ref.current?.focus()` via a `useEffect`. This scrolls the user straight to the product selection step.

## 3. Improve empty state CTAs on mobile

**Files: `src/pages/Orders.tsx`, `src/pages/Distributors.tsx`, `src/pages/Salespersons.tsx`, `src/pages/Stock.tsx`**

Each page has an empty state block with just text ("No dealers found / Add your first dealer to get started"). Add a prominent CTA button below each:

| Page | Button label | Action |
|------|-------------|--------|
| Orders | "Create your first order" | Navigate to `/orders/new` |
| Distributors | "Add Dealer" | Open the add-dealer dialog |
| Salespersons | "Add Team Member" | Open the add-salesperson dialog |
| Stock (Products) | "Add Product" | Open the add-product dialog |

Buttons will use the existing `Button` component with `size="sm"` and a `Plus` icon, styled with `mt-3` spacing to sit naturally below the empty text.

## Summary

| Action | File | What |
|--------|------|------|
| Edit | `src/data/mock-data.ts` | Fix `maximumFractionDigits` to 2 |
| Edit | `src/pages/NewOrder.tsx` | Auto-focus product select on dealer pick |
| Edit | `src/pages/Orders.tsx` | Add "Create first order" CTA button |
| Edit | `src/pages/Distributors.tsx` | Add "Add Dealer" CTA button |
| Edit | `src/pages/Salespersons.tsx` | Add "Add Team Member" CTA button |
| Edit | `src/pages/Stock.tsx` | Add "Add Product" CTA button |

6 files, all small edits.

