

# Comprehensive QA Audit & Improvement Plan

## Part 1: Mobile Navigation Redesign

**Current state**: 5-item bottom bar (Home, Orders, Stock, Performance, More). The "More" menu is a DropdownMenu that pops up with 8 items. This is functional but has issues:
- The DropdownMenu disappears immediately on tap outside — easy to dismiss accidentally
- 8 items in a plain dropdown is a lot to scan
- No visual grouping or hierarchy in the More menu
- The More menu doesn't indicate which page you're currently on

**Proposed approach**: Replace the DropdownMenu with a full-screen Sheet (bottom drawer) for the "More" menu. This is the modern pattern used by ChatGPT, WhatsApp, and most production mobile apps. Benefits:
- Larger touch targets in a grid/list layout
- Visual grouping (Manage, Analyze, Settings)
- Active page indicator visible
- Harder to dismiss accidentally
- More breathing room and better scannability

### Changes:
- `AppLayout.tsx`: Replace `DropdownMenu` with `Sheet` (side="bottom") for the More menu
- Group items into sections with subtle headers
- Show active indicator on the current page item
- Use a 2-column grid for better space utilization

---

## Part 2: PDF Standardization

**Current state**: 6 PDF components with inconsistent approaches:
1. `OrderInvoicePdf` — Uses shared `PdfStyles`, `PdfHeader`, `PdfFooter`. Professional.
2. `GstInvoicePdf` — Has its OWN `StyleSheet.create()`, own header/footer. Uses `₹` symbol (Helvetica can't render it — will show as `?`). No shared branding.
3. `DealerStatementPdf` — Uses shared components. Inline styles throughout. Professional but inconsistent with others.
4. `SalespersonStatementPdf` — Uses shared components. Same inline style issue. Good quality.
5. `PerformanceReportPdf` — Uses shared components. Clean.
6. `ReportPdf` — Uses shared components. Clean generic template.

**Critical bug**: `GstInvoicePdf` line 203 uses `₹` symbol which Helvetica cannot render. Should use `Rs.` like all other PDFs.

**Standardization plan**:
- Migrate `GstInvoicePdf` to use shared `PdfHeader`, `PdfFooter`, and `pdfStyles`
- Replace `₹` with `Rs.` in `GstInvoicePdf` using `formatCurrencyPdf()`
- Add "Amount in Words" section to `OrderInvoicePdf` (currently missing, but GstInvoice has it)
- Standardize all inline styles in `DealerStatementPdf` and `SalespersonStatementPdf` to use shared `pdfStyles` where possible
- Add consistent "Computer-generated document" footer text across all PDFs
- Add `wrap={false}` to table rows in `GstInvoicePdf` to prevent row splitting across pages

---

## Part 3: Other Issues Found

### High Priority
| # | Issue | File |
|---|-------|------|
| H1 | `GstInvoicePdf` uses `₹` which Helvetica can't render — shows as `?` or blank | `GstInvoicePdf.tsx:203` |
| H2 | `GstInvoicePdf` has no `PdfHeader`/`PdfFooter` — completely different branding from all other PDFs | `GstInvoicePdf.tsx` |
| H3 | `GstInvoicePdf` doesn't use `wrap={false}` on table rows — rows can split across pages | `GstInvoicePdf.tsx:149` |

### Medium Priority
| # | Issue | File |
|---|-------|------|
| M1 | `OrderInvoicePdf` missing "Amount in Words" section — GstInvoice has it, Order doesn't | `OrderInvoicePdf.tsx` |
| M2 | `GstInvoicePdf` uses raw `.toFixed(2)` instead of `formatCurrencyPdf()` for amounts — inconsistent formatting | `GstInvoicePdf.tsx` |
| M3 | More menu items lack visual feedback for the currently active page | `AppLayout.tsx` |

---

## Implementation Plan

### Pass 1: Mobile Navigation (AppLayout.tsx)
Replace the DropdownMenu "More" with a Sheet bottom drawer containing grouped navigation items in a clean list with section headers, active indicators, and proper touch targets.

### Pass 2: PDF Standardization (GstInvoicePdf.tsx)
- Migrate to shared `PdfHeader`, `PdfFooter`, `pdfStyles`
- Replace `₹` with `formatCurrencyPdf()`
- Add `wrap={false}` to table rows
- Standardize formatting

### Pass 3: PDF Enhancements (OrderInvoicePdf.tsx)
- Add "Amount in Words" section using `numberToWords` utility

**Total: 3 files changed. No new dependencies. No feature additions.**

