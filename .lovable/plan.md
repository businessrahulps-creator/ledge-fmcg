

# Comprehensive UI/UX Polish — Final 10/10 Elevation Pass

## Audit Summary

### What's Already Good (Previous Fixes Working)
- Sidebar nav text is `font-semibold` ✅
- Active state uses pill background (no black bar) ✅
- KPI Revenue number fits on one line with `whitespace-nowrap` ✅
- Collapsed sidebar has Perplexity-style dock with labels ✅
- Glass-card depth and warm palette in place ✅

### Remaining Issues Found

**1. PDF Invoice: ₹ Symbol Renders as "¹"**
The `formatCurrency()` function outputs the ₹ (U+20B9) character, but react-pdf's built-in Helvetica font does not include this glyph, causing it to render as "¹". This affects ALL PDF exports (invoices, reports).

**Fix:** Create a `formatCurrencyPdf()` helper that replaces the ₹ symbol with "Rs." (universally readable in Helvetica). Use this in all PDF components. Alternatively, register a custom font that supports ₹ — but "Rs." is simpler, more reliable, and standard on Indian business documents.

**2. No Other Critical Regressions Found**
The sidebar, KPIs, mobile nav, collapsed state, and overall palette are all functioning correctly based on the current screenshot audit.

---

## Implementation Plan

### Pass 1: Fix PDF Currency Rendering (Critical Bug)

**File: `src/utils/exportPdf.ts`**
- Add a `formatCurrencyPdf(amount: number): string` function that formats using `Intl.NumberFormat("en-IN")` but prefixes with `"Rs. "` instead of `"₹"` (Helvetica-safe).

**Files: `src/components/pdf/OrderInvoicePdf.tsx`, `src/components/pdf/ReportPdf.tsx`**
- Import and use `formatCurrencyPdf` instead of `formatCurrency` for all currency values rendered in PDF `<Text>` elements.
- This ensures all PDF exports (invoices, order reports, product reports, dealer reports, payment reports, dispatch reports, sales team reports) render currency correctly.

**Files: All report components (`src/components/reports/*.tsx`)**
- Update the `rows` data passed to `ReportPdf` to use `formatCurrencyPdf` instead of `formatCurrency` for any currency columns.

### Pass 2: PDF Invoice Layout Polish

**File: `src/components/pdf/PdfStyles.ts`**
- Refine summary card styling: add light gray background (`#F9F9F9`), rounded corners, slightly more padding.
- Soften table header from solid black to dark charcoal (`#1A1A1A`).
- Increase row padding slightly for readability.
- Add a subtle separator between header and content area.

**File: `src/components/pdf/OrderInvoicePdf.tsx`**
- Improve grand total section: use a clean box with light background instead of just a top border.
- Add proper spacing between dispatch details and the total.

### What Will NOT Change
- All data flow, API calls, realtime subscriptions, RBAC, pagination, CSV export
- Indian date formatting, IST clock, auth flow
- Component structure, prop interfaces, routing
- Dark mode tokens, sidebar behavior, mobile nav
- No new features, no dependency additions
- All existing `className` values preserved

### Files Modified (6 total)
1. `src/utils/exportPdf.ts` — add `formatCurrencyPdf` helper
2. `src/components/pdf/OrderInvoicePdf.tsx` — use `formatCurrencyPdf`
3. `src/components/pdf/PdfStyles.ts` — subtle layout refinements
4. `src/components/reports/DistributorReport.tsx` — use `formatCurrencyPdf` in rows
5. `src/components/reports/PaymentReport.tsx` — use `formatCurrencyPdf` in rows
6. `src/components/reports/ProductReport.tsx` — use `formatCurrencyPdf` in rows
7. `src/components/reports/SalesTeamReport.tsx` — use `formatCurrencyPdf` in rows
8. `src/components/reports/DispatchReport.tsx` — use `formatCurrencyPdf` in rows
9. `src/pages/Orders.tsx` — use `formatCurrencyPdf` in report PDF rows
10. `src/pages/Stock.tsx` — use `formatCurrencyPdf` in report PDF rows

