

# Fix: "GST Invoice" Label Wrapping to Two Lines

## Problem
On mobile, the document type selector buttons use a 2-column grid (`grid-cols-2`). The "GST Invoice" label is too long for the cell width at `text-xs` (12px), causing it to wrap onto two lines while the other labels ("Estimate", "Proforma", "Credit Note") fit fine.

## Fix

### `src/pages/Billing.tsx` — line 722

Add `whitespace-nowrap` to the button class so the text never wraps, and reduce font size slightly on small screens so it fits:

Change:
```
className={`rounded-lg border px-3 py-2.5 text-xs font-medium transition-all ${...}`}
```
To:
```
className={`rounded-lg border px-2 py-2.5 text-[11px] font-medium whitespace-nowrap transition-all ${...}`}
```

The two changes:
- `whitespace-nowrap` — prevents line wrapping
- `px-3` → `px-2` and `text-xs` → `text-[11px]` — slightly tighter to ensure all four labels fit in the 2-column grid on narrow screens

## Files Changed
- `src/pages/Billing.tsx` — one class change on the doc type selector button

