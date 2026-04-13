

# Remove PDF Export from Dealers and Sales Team Pages

## Changes — 2 files

### 1. `src/pages/Distributors.tsx`
- **Imports**: Remove `FileText`, `ExportPdfModal`, `PdfSection`, `downloadPdf`, `pdfFilename`, `ReportPdf`
- **State**: Remove `pdfOpen` state variable
- **Button**: Remove the "Export PDF" button from the toolbar
- **Modal**: Remove the `<ExportPdfModal>` component at the bottom

### 2. `src/pages/Salespersons.tsx`
- **Imports**: Remove `FileText`, `ExportPdfModal`, `PdfSection`, `downloadPdf`, `pdfFilename`, `ReportPdf`
- **State**: Remove `pdfOpen` state variable
- **Button**: Remove the "Export PDF" button from the toolbar
- **Modal**: Remove the `<ExportPdfModal>` component at the bottom

CSV export remains untouched in both pages.

