

# Sync Order Detail Dialog Styling with New Order Page

## Problem
The **New Order** page uses color-coded status buttons (emerald for paid/delivered, amber for partial, red for pending, blue for dispatched) via a `statusColors` map. The **Order Detail Dialog** on the Orders page uses generic `border-primary bg-primary/10 text-primary` for all active states — no color differentiation. This makes the two experiences feel inconsistent.

## Changes — `src/pages/Orders.tsx`

### 1. Add the `statusColors` map
Copy the same map from NewOrder.tsx:
```ts
const statusColors: Record<string, string> = {
  paid: "border-emerald-500 bg-emerald-500/10 text-emerald-600",
  partial: "border-amber-500 bg-amber-500/10 text-amber-600",
  pending: "border-red-500 bg-red-500/10 text-red-600",
  dispatched: "border-blue-500 bg-blue-500/10 text-blue-600",
  delivered: "border-emerald-500 bg-emerald-500/10 text-emerald-600",
};
```

### 2. Update Payment Status buttons (lines 278-289)
Replace the active state class from:
```
"border-primary bg-primary/10 text-primary"
```
to:
```
statusColors[s.value] || "border-primary bg-primary/10 text-primary"
```

### 3. Update Delivery Status buttons (lines 296-308)
Same change — use `statusColors[s.value]` for the active state.

### 4. Match button sizing
The dialog buttons use `px-2 py-2.5` while NewOrder uses `px-2 py-2.5 md:px-3 md:py-3`. Add the responsive `md:px-3 md:py-3` to the dialog buttons for consistency.

## Result
Tapping an existing order shows the same color-coded status buttons as the New Order form — paid is green, partial is amber, pending is red, dispatched is blue.

