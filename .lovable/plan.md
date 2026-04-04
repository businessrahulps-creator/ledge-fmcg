

# Fix Quantity Input Bug in New Order

## Problem
The quantity input uses `type="number"` with `value={line.quantity}` (always a number) and `parseInt(e.target.value) || 0`. This causes leading zeros ("01") because the numeric state `1` gets prepended when typing, and the `type="number"` input doesn't clean display values properly.

## Solution
Track quantity as a **string** for display, parse to number only for calculations. Single file edit in `src/pages/NewOrder.tsx`.

### Changes

**1. Add a `quantityStr` field to `OrderLineState`**
```ts
interface OrderLineState {
  id: string;
  productId: string;
  quantity: number;       // used for calculations
  quantityStr: string;    // used for display
  unitPrice: number;
}
```
Default: `quantity: 1, quantityStr: "1"`.

**2. Update the quantity `<Input>`**
- Switch to `type="text"` with `inputMode="numeric"` (mobile numeric keyboard)
- `value={line.quantityStr}`
- `onChange`: strip non-digits, parse to int, clamp to ≥ 0, set both `quantity` and `quantityStr`
- `onBlur`: if empty, reset to "0" / 0

**3. Update `updateLine`**
Add a branch for `"quantity"` that keeps both fields in sync. When called from product-select or price changes, behavior stays the same.

**4. Update `addLine` and initial state**
Set `quantityStr: "1"` alongside `quantity: 1`.

No other files affected. Line totals, order total, and save logic all read `line.quantity` (the number) — unchanged.

