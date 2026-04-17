

## Fix: "GST Invoice" badge wrapping to two lines in Billing table

### Problem
In `src/pages/Billing.tsx` the Type column badge uses `inline-flex` without `whitespace-nowrap`, so on narrower viewports the label "GST Invoice" wraps onto two lines inside the rounded pill, producing the awkward two-line oval seen in the screenshot. The same pattern exists in 4 places (desktop table, mobile card, Orders page linked-docs chip, source-order existing-docs chip).

### Fix (single-file, surgical)

**`src/pages/Billing.tsx`** — add `whitespace-nowrap` to the four badge spans rendering `docTypeLabels[...]`:

- Line 564 (desktop table Type cell)
- Line 639 (mobile card)
- Line 770 (compact docs chip on Orders-linked column)
- Line 820 (existing docs chip in step 2 of create dialog)

Change pattern:
```
className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ...`}
```
→
```
className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-medium ...`}
```

Additionally, give the desktop Type column a small min-width so the cell doesn't squeeze the pill: add `className="w-[110px]"` to the Type `<TableHead>` (the only structural tweak, keeps layout stable across screen sizes).

### Why this works
- `whitespace-nowrap` prevents the label from breaking at the space between "GST" and "Invoice" — the pill stays a clean single-line oval on every viewport (Mac, Windows, mobile).
- The 110px column width guarantees enough room for "GST Invoice" without forcing it on Estimate/Proforma which are shorter.
- No label changes (still reads "GST Invoice"), no color/token changes, no logic changes.

### Out of scope
No changes to PDF rendering, dialog flows, filters, or any non-badge styling.

