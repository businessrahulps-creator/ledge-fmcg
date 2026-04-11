

# Add PDF Export to Performance Page

## What
Add an "Export PDF" button to the Performance page header that opens the existing `ExportPdfModal`, letting users choose which sections to include (KPI summary, top dealers, top products, sales team ranking). The PDF uses the existing `ReportPdf` component with multiple pages/tables.

## Changes — `src/pages/Performance.tsx`

1. **Add imports**: `Download` from lucide-react, `ExportPdfModal`/`PdfSection`, `ReportPdf`, `downloadPdf`/`pdfFilename`/`formatCurrencyPdf`.

2. **Add state**: `const [pdfOpen, setPdfOpen] = useState(false)`.

3. **Add Export button** next to the period pills in the header area — a small outline button with a Download icon.

4. **Add `ExportPdfModal`** at bottom of JSX with sections:
   - `company` — Company header
   - `summary` — KPI summary cards (Revenue, Orders, Avg Order, Collection)
   - `dealers` — Top Dealers table
   - `products` — Top Products table
   - `salesTeam` — Sales Team Ranking table

5. **`onGenerate` callback** builds a `ReportPdf` with:
   - Title: "Performance Report"
   - Subtitle: current period label (e.g. "Last 30 Days")
   - Summary: the 4 KPI values
   - Table: Top Dealers (primary table — most useful in PDF)
   - For additional tables (products, sales team), generate a multi-section layout using the existing `ReportPdf` structure

Since `ReportPdf` supports one table per page, the simplest approach is to use the dealers table as the primary table and include KPIs in the summary row. This matches the pattern used across all other reports.

No new files needed — purely follows existing patterns from DistributorReport, PaymentReport, etc.

