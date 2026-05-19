## Finding

The footer label is already correct. `src/utils/exportCsv.ts` dynamically imports SheetJS (`xlsx`), builds a worksheet with autofilter and auto column widths, and writes a real `.xlsx` binary via `XLSX.writeFile`. `csvFilename()` already returns `entity_YYYY-MM-DD.xlsx`. Excel opens these as native workbooks, not as CSV.

The only thing misleading is the source code: the filename, the exported function name, and the import paths still say "csv". A new contributor reading the report files would (correctly) wonder why a button labelled "Download Excel" calls `exportCsv(csvFilename(...))`.

## Plan: rename for honesty, no behavior change

1. Rename file `src/utils/exportCsv.ts` → `src/utils/exportXlsx.ts`.
2. Inside the new file:
   - Rename `exportCsv` → `exportXlsx` (keep `export const exportCsv = exportXlsx` as a deprecated alias for one release so nothing breaks mid-refactor, then remove).
   - Remove the `csvFilename` deprecated alias (it already forwards to `xlsxFilename`). Callers will be migrated in the same pass.
3. Update the 5 report files to import from `@/utils/exportXlsx` and call `exportXlsx(xlsxFilename(...), ...)`:
   - `PaymentReport.tsx` (also the aging summary export)
   - `DistributorReport.tsx`
   - `DispatchReport.tsx`
   - `SalesTeamReport.tsx`
   - `ProductReport.tsx`
4. Leave `ReportExportFooter` untouched — `excelLabel = "Download Excel"` already matches reality. Add a one-line JSDoc note clarifying the output is a real `.xlsx` workbook.
5. Quick grep for any other `exportCsv` / `csvFilename` callers outside reports; migrate any stragglers.
6. Verify: trigger one report download, confirm the file opens in Excel/Numbers as a native workbook with autofilter on the header row (it already does — this is a rename-only PR).

## Out of scope

- No change to the button label, footer layout, PDF export, or toast copy.
- No new dependency — SheetJS is already in use.

## Why not "switch to true XLSX"

That work is already done. Doing it "again" would just be this rename pass.
