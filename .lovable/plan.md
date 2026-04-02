

# Synchronize Status Labels Across Dashboard & Orders

## Problem
The Dashboard's **mobile card view** (lines 217-221) renders status labels using raw lowercase strings (`o.paymentStatus`, `o.deliveryStatus`) with custom inline color classes. Meanwhile, the Dashboard's **desktop table** and the **Orders page** both use the `<StatusBadge>` component, which renders capitalized labels with consistent styling.

This creates a visual mismatch: "paid" vs "Paid", different sizes, different color treatments.

## Fix

### `src/pages/Dashboard.tsx`
Replace the two inline `<span>` badges in the mobile card section (lines 216-222) with the same `<StatusBadge>` component already used in the desktop table.

**Before:**
```tsx
<div className="flex gap-1.5">
  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${paymentColor[o.paymentStatus]}`}>
    {o.paymentStatus}
  </span>
  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${deliveryColor[o.deliveryStatus]}`}>
    {o.deliveryStatus}
  </span>
</div>
```

**After:**
```tsx
<div className="flex gap-1.5">
  <StatusBadge status={o.paymentStatus} />
  <StatusBadge status={o.deliveryStatus} />
</div>
```

Also remove the now-unused `paymentColor` and `deliveryColor` objects (lines ~52-59) to keep the code clean.

## Result
All status labels across Dashboard (mobile + desktop) and Orders page will use the same `StatusBadge` component — consistent capitalization, colors, and sizing everywhere.

