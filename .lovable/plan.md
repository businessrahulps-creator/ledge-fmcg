

# Fix: Revenue KPI Number Line-Break on Desktop

## Problem
At 1280px desktop, the Revenue KPI card shows "₹1,33,62" on line 1 and "0" on line 2. The `break-all` class causes the number to break mid-value, which looks broken.

## Root Cause
Line 102 in `Dashboard.tsx`: `break-all` allows line breaks at any character. Combined with `md:text-3xl` (30px), the Indian-formatted currency string "₹1,33,620" exceeds the ~280px card width in a 4-column grid.

## Fix (single line change)

**`src/pages/Dashboard.tsx` line 102:**
- Remove `break-all`
- Add `whitespace-nowrap` to prevent wrapping
- Change font sizing to `text-lg sm:text-xl md:text-2xl` (drop from `3xl` to `2xl` on desktop so the value fits)

```
// Before
<p className="text-lg sm:text-xl md:text-3xl font-bold tracking-tight tabular-nums break-all">{kpi.value}</p>

// After  
<p className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight tabular-nums whitespace-nowrap">{kpi.value}</p>
```

This ensures the number stays on one line and fits the card at all screen widths. The size reduction from `text-3xl` (30px) to `text-2xl` (24px) on desktop is minimal and still reads as a prominent metric.

### No other changes needed
- Mobile already works perfectly (verified at 375px)
- All other KPI values (8, 3, 2) are short and unaffected

