

# Standardize Performance PDF + Add Visual Charts + Mobile Export

## Problems
1. **"Your Company" default** — Performance page doesn't pass `companyInfo` props to `ReportPdf`, while all other reports do (Dealer, Payment, Dispatch, etc.)
2. **No charts/visuals** — The PDF exports only tables, making it look like an invoice. The Performance page has rich charts (revenue trend, payment split donut, bar charts) that should appear in the PDF.
3. **Export button text hidden on mobile** — The "Export" label uses `hidden sm:inline`, so only the icon shows. This is functional but could be clearer.

## Changes

### 1. Fix company info (standardize with other reports)
**File: `src/pages/Performance.tsx`** (~line 860)

Pass `companyInfo` to `ReportPdf` exactly like the other report pages:
```tsx
const { companyInfo } = api;
// ... in ReportPdf props:
companyName={companyInfo.name}
companyAddress={companyInfo.address}
gstin={companyInfo.gstin}
logoUrl={companyInfo.logoUrl}
```

### 2. Add chart visuals to the PDF
**New file: `src/components/pdf/PerformanceReportPdf.tsx`**

Create a dedicated Performance PDF component (instead of reusing the generic `ReportPdf`) that includes:
- Company header + date subtitle (reuse `PdfHeader`)
- KPI summary cards row
- **Revenue trend** — rendered as a simple sparkline/bar chart using `@react-pdf/renderer` View elements (colored bars proportional to values)
- **Payment split** — rendered as a horizontal stacked bar with color legend (paid/partial/pending)
- **Top Dealers / Products / Sales Team** — rendered as horizontal bar charts using colored View rectangles, not plain tables
- Footer (reuse `PdfFooter`)

Since `@react-pdf/renderer` doesn't support SVG charts from Recharts, we'll draw simple visual bars using `View` elements with percentage-based widths and colored backgrounds — lightweight but visually informative.

### 3. Update ExportPdfModal sections
**File: `src/pages/Performance.tsx`**

Update the sections list to include chart-specific options:
- Company Header
- KPI Summary
- Revenue Trend (chart)
- Payment Split (chart)
- Top Dealers (bar chart)
- Top Products (bar chart)
- Sales Team Ranking (bar chart)

### 4. Mobile export visibility
**File: `src/pages/Performance.tsx`** (~line 372)

Show "Export" text on mobile too (remove `hidden sm:inline`), or at minimum ensure the button is clearly visible and tappable. The icon-only button currently works but isn't obvious.

## Technical Details
- Charts will be drawn with `@react-pdf/renderer` `View` elements (colored rectangles with percentage widths) — no external chart library needed
- Revenue trend: horizontal bars for each day/period, scaled to max value
- Payment donut: replaced with a horizontal stacked bar (more PDF-friendly)
- Bar charts: horizontal bars with labels and values
- All colors use the same semantic tokens converted to hex for PDF compatibility (PDF Views need hex, not CSS vars)

