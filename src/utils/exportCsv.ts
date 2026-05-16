import { toast } from "sonner";
import type * as XLSXType from "xlsx";

const CURRENCY_KEYWORDS = ["₹", "amount", "value", "price", "revenue", "total", "outstanding", "limit", "savings"];
const DATE_KEYWORDS = ["date"];

function isCurrencyCol(header: string): boolean {
  const h = header.toLowerCase();
  return CURRENCY_KEYWORDS.some((k) => h.includes(k));
}

function isDateCol(header: string): boolean {
  const h = header.toLowerCase();
  return DATE_KEYWORDS.some((k) => h.includes(k));
}

/**
 * Build a formatted worksheet from headers + rows. Takes XLSX as a parameter
 * so callers can share a dynamically-loaded module instance.
 */
export function buildWorksheet(XLSX: typeof XLSXType, headers: string[], rows: string[][]): XLSXType.WorkSheet {
  const aoa = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Auto-filter on header row
  ws["!autofilter"] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } }) };

  // Column widths — auto-calculated from content
  ws["!cols"] = headers.map((h, ci) => {
    let max = h.length;
    for (const row of rows) {
      const cellLen = (row[ci] ?? "").length;
      if (cellLen > max) max = cellLen;
    }
    return { wch: Math.min(max + 3, 40) };
  });

  return ws;
}

/**
 * Generate and download an Excel file from headers + rows.
 * xlsx (~430KB) is dynamically imported so it's only fetched when users
 * actually click an Export button — not on every page load.
 */
export async function exportCsv(filename: string, headers: string[], rows: string[][]) {
  if (rows.length === 0) {
    toast.error("Nothing to export", { description: "No data matches the current filters." });
    return;
  }

  const XLSX = await import("xlsx");
  const ws = buildWorksheet(XLSX, headers, rows);
  const wb = XLSX.utils.book_new();

  // Derive sheet name from filename (strip extension & date suffix)
  const sheetName = filename.replace(/\.xlsx?$/i, "").replace(/_\d{4}-\d{2}-\d{2}$/, "").slice(0, 31) || "Data";
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  XLSX.writeFile(wb, filename);

  toast.success("Excel exported successfully", {
    description: `${rows.length} row${rows.length === 1 ? "" : "s"} exported.`,
  });
}

/**
 * Generate a dated filename: {entity}_{YYYY-MM-DD}.xlsx
 */
export function xlsxFilename(entity: string): string {
  const today = new Date().toISOString().slice(0, 10);
  return `${entity}_${today}.xlsx`;
}

/** @deprecated Use xlsxFilename instead */
export const csvFilename = xlsxFilename;
