

# Fix: Order Date Overflowing on Mobile

## Problem
The "Order Details" section uses `sm:grid-cols-3` which creates three columns starting at 640px. On phones narrower than that it's single column, but the date input still overflows because the native date picker renders a wide formatted date (e.g., "13 Apr 2026") that doesn't fit well in the available space.

## Fix
In `src/pages/NewOrder.tsx` line 373:
- Add `text-sm` and `w-full` to the date Input to ensure it fits within its container
- Change the grid from `sm:grid-cols-3` to `md:grid-cols-3` so on mobile the three fields (Date, Dealer, Sales Person) stack vertically instead of cramming into three narrow columns

### Changes
**`src/pages/NewOrder.tsx`** (line 370):
```
// Before
<div className="grid gap-3 sm:grid-cols-3 md:gap-4">

// After
<div className="grid gap-3 md:grid-cols-3 md:gap-4">
```

This ensures all three fields stack on mobile and tablet-portrait, only going side-by-side on medium screens (768px+) where there's enough room.

