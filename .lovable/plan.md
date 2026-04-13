

# Export as Formatted Excel (.xlsx)

## What Changes
Replace all CSV exports with proper Excel workbooks that look professional — formatted headers, ₹ currency columns, auto-filters, and auto-sized columns. The existing `exportCsv` function signature stays the same so all 9+ call sites need zero changes.

## Technical Approach

### 1. Add `xlsx` library
Install the `xlsx` (SheetJS) package — lightweight, client-side, no server needed.

### 2. Replace `src/utils/exportCsv.ts`
- Rename `exportCsv` to keep the same function signature: `(filename, headers, rows)`
- Change filename helper to produce `.xlsx` instead of `.csv`
- Build a worksheet from headers + rows using SheetJS
- Apply formatting:
  - **Bold header row** with a subtle fill color
  - **Auto-filter** on the header row
  - **Column widths** auto-calculated from content length
  - **₹ currency format** (`₹#,##0`) on columns whose header contains "₹", "Amount", "Value", "Price", "Revenue", "Total", or "Outstanding"
  - **Date format** on columns with "Date" in the header
- Download as `.xlsx` blob

### 3. Update `src/utils/exportBackup.ts`
- Replace `toCsvString` with SheetJS worksheet generation
- Each entity becomes a properly formatted sheet in a **single .xlsx workbook** instead of a ZIP of CSVs
- Filename: `ledge_backup_2026-04-13.xlsx`

### 4. Update filename helper
- `csvFilename("orders")` → `xlsxFilename("orders")` (returns `orders_2026-04-13.xlsx`)
- Export both names for backward compat, or just change the extension — all call sites use the helper

## Files Changed
- `src/utils/exportCsv.ts` — rewrite internals, keep exports
- `src/utils/exportBackup.ts` — multi-sheet workbook instead of ZIP
- `package.json` — add `xlsx` dependency

## What Stays the Same
- All 9 call sites (Orders, Dealers, Stock, Salespersons, all 5 report tabs) — zero changes needed
- PDF exports — untouched
- Export button UI — unchanged

## Impact
- Professional, formatted Excel files instead of plain CSVs
- Single-workbook backup with named sheets instead of a ZIP
- ~90KB library addition (tree-shaken), offset by removing JSZip dependency from backup

