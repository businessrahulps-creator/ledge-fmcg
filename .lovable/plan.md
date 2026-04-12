

# Audit: Feature #5 — Issues Found & Fixes

## Issues Identified

### 1. Churn Risk Logic Bug (Critical)
In `getChurnRisk` (line 26), the condition uses `||` (OR):
```
if (daysSinceLastOrder <= 60 || paidPct >= 30) return "medium";
```
This means a dealer who hasn't ordered in **6 months** but paid 35% of old orders still gets "medium" risk. The `paidPct >= 30` overrides the recency check entirely. A dealer inactive for 200 days should be "high" risk.

**Fix:** Change to `&&` — medium only if BOTH conditions are met (recent enough AND decent payment):
```
if (daysSinceLastOrder <= 60 && paidPct >= 30) return "medium";
```

### 2. PDF Uses `px` Instead of `pt` (DealerStatementPdf)
The `DealerStatementPdf` uses inline styles like `border: "1px solid #e2e8f0"`. All existing PDF styles in `PdfStyles.ts` use `pt` (e.g. `"0.5pt solid #D4D4D4"`). `@react-pdf/renderer` expects points. While it may still render, using `px` is inconsistent and could cause subtle sizing issues.

**Fix:** Replace all `1px` with `1pt` and `0.5px` with `0.5pt` in `DealerStatementPdf.tsx`.

### 3. Dealer Detail Order History Shows Gross Total, Not Effective
In `Distributors.tsx` lines 485 and 496, the order history table shows `o.total` (gross). The Orders page was already updated to show effective total (`o.total - o.schemeSavings`). This is inconsistent — a business owner sees different amounts for the same order.

**Fix:** Show effective total: `formatCurrency(o.total - (o.schemeSavings || 0))`.

### 4. Top Dealers Widget Uses Gross Revenue
In `Performance.tsx` line 533, revenue is computed as `o.total` without subtracting scheme savings.

**Fix:** Use `o.total - (o.schemeSavings || 0)` for revenue calculation.

## Files Changed
- `src/utils/dealerScorecard.ts` — Fix churn risk `||` → `&&`
- `src/components/pdf/DealerStatementPdf.tsx` — Fix `px` → `pt` in border styles
- `src/pages/Distributors.tsx` — Show effective total in dealer order history
- `src/pages/Performance.tsx` — Use effective total in Top Dealers revenue

