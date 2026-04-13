

# Remove PDF Export from Stock Page

## Changes — 1 file (`src/pages/Stock.tsx`)

### Remove
1. **Imports** (lines 11-13): Remove `downloadPdf`, `pdfFilename`, `formatCurrencyPdf`, `ExportPdfModal`, `PdfSection`, `ReportPdf`, and `FileText` icon
2. **State** (lines 100-101): Remove `productsPdfOpen` and `inventoryPdfOpen` state
3. **Config** (lines 103-107): Remove `stockPdfSections` array
4. **Products PDF button** (lines 339-348): Remove the "Export PDF" button in the products toolbar
5. **Warehouse PDF button** (lines 581-588): Remove the "Export PDF" button in the warehouse inventory toolbar
6. **Modal components** (lines 890-981): Remove both `<ExportPdfModal>` instances (products + inventory)

CSV export remains untouched. No other files affected.

