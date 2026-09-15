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

/** "₹1,23,456.50" / "-1234.5" / "-" -> a number, or null when it isn't one. */
export function parseMoney(text: string): number | null {
  const t = (text ?? "").trim();
  if (!t || t === "-" || t === "—") return null;
  const negative = /^\(.*\)$/.test(t);
  const cleaned = t.replace(/[()₹,\s]/g, "");
  if (!/^-?\d+(\.\d+)?$/.test(cleaned)) return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return null;
  return negative ? -Math.abs(n) : n;
}

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/** Accepts "2026-09-15", "15/09/2026" and "15 Sep 2026". Returns a local Date or null. */
export function parseDateCell(text: string): Date | null {
  const t = (text ?? "").trim();
  if (!t) return null;
  let m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  m = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(t);
  if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  m = /^(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{4})$/.exec(t);
  if (m) {
    const mi = MONTHS.indexOf(m[2].slice(0, 3).toLowerCase());
    if (mi >= 0) return new Date(Number(m[3]), mi, Number(m[1]));
  }
  return null;
}

/**
 * Build a formatted worksheet from headers + rows. Takes XLSX as a parameter
 * so callers can share a dynamically-loaded module instance.
 *
 * Money and date columns are written as real numbers/dates so they can be
 * summed, sorted and filtered in Excel instead of sitting there as text.
 */
export function buildWorksheet(XLSX: typeof XLSXType, headers: string[], rows: string[][]): XLSXType.WorkSheet {
  const aoa = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(aoa);

  headers.forEach((header, ci) => {
    const money = isCurrencyCol(header);
    const date = isDateCol(header);
    if (!money && !date) return;
    rows.forEach((row, ri) => {
      const addr = XLSX.utils.encode_cell({ r: ri + 1, c: ci });
      const cell = ws[addr] as { v?: unknown; t?: string; z?: string } | undefined;
      if (!cell) return;
      const raw = String(row[ci] ?? "");
      if (money) {
        const n = parseMoney(raw);
        if (n === null) return;
        cell.v = n;
        cell.t = "n";
        cell.z = '#,##0.00;[Red]-#,##0.00;"-"';
      } else {
        const d = parseDateCell(raw);
        if (!d) return;
        cell.v = d;
        cell.t = "d";
        cell.z = "dd-mmm-yyyy";
      }
    });
  });


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
 * Generate and download a true .xlsx workbook from headers + rows.
 * Output is a native Excel binary (not CSV) with autofilter on the header row
 * and auto-sized columns. xlsx (~430KB) is dynamically imported so it's only
 * fetched when users actually click an Export button — not on every page load.
 */
export async function exportXlsx(filename: string, headers: string[], rows: string[][]) {
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
