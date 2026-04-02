

# Add Colors to Payment Mode & Status Toggles

## Problem
The payment mode buttons (Cash, Bank Transfer, Cheque, UPI) and payment status buttons (Paid, Partial, Pending) on the New Order page are visually flat — just bordered boxes with no color differentiation. They feel blank and don't communicate meaning.

## Solution
Add color coding to the **selected state** of each button:

**Payment Status** (semantic colors matching StatusBadge):
- Paid → green (`bg-emerald-500/10 border-emerald-500 text-emerald-600`)
- Partial → amber (`bg-amber-500/10 border-amber-500 text-amber-600`)
- Pending → red (`bg-red-500/10 border-red-500 text-red-600`)

**Delivery Status** (same treatment):
- Pending → red
- Dispatched → blue (`bg-blue-500/10 border-blue-500 text-blue-600`)
- Delivered → green

**Payment Mode** — keep using `border-primary bg-primary/10 text-primary` (black) since these are neutral options without semantic meaning.

## Changes

### `src/pages/NewOrder.tsx`
- Create a color map for payment statuses and delivery statuses
- Replace the generic `border-primary bg-primary/10 text-primary` selected class on payment status and delivery status buttons with their respective semantic colors
- Payment mode buttons stay as-is (black accent is fine for neutral choices)

```tsx
const statusColors: Record<string, string> = {
  paid: "border-emerald-500 bg-emerald-500/10 text-emerald-600",
  partial: "border-amber-500 bg-amber-500/10 text-amber-600",
  pending: "border-red-500 bg-red-500/10 text-red-600",
  dispatched: "border-blue-500 bg-blue-500/10 text-blue-600",
  delivered: "border-emerald-500 bg-emerald-500/10 text-emerald-600",
};
```

Then in the button className, replace the selected-state ternary with:
```tsx
statusColors[s.value] || "border-primary bg-primary/10 text-primary"
```

## Result
Payment and delivery status toggles gain meaningful color — green for paid/delivered, amber for partial, red for pending, blue for dispatched — making the form more intuitive at a glance. Payment mode buttons stay neutral black.

