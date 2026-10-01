import type { ReportColumn, ReportRow, ReportSection, SummaryItem } from "./types";

const inr2 = new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const inr0 = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
const int = new Intl.NumberFormat("en-IN");

export const money = (n: number, decimals: 0 | 2 = 2) =>
  `₹${(decimals === 2 ? inr2 : inr0).format(Number.isFinite(n) ? n : 0)}`;

export function fmtDate(key: string | null | undefined): string {
  if (!key) return "";
  const [y, m, d] = key.slice(0, 10).split("-");
  return d && m && y ? `${d}/${m}/${y}` : key;
}

export function cellText(col: ReportColumn, v: ReportRow[string]): string {
  if (v == null || v === "") return "";
  switch (col.type) {
    case "money": return money(Number(v));
    case "number": return int.format(Number(v));
    case "date": return fmtDate(String(v));
    default: return String(v);
  }
}

export function allRows(sections: ReportSection[]): ReportRow[] {
  return sections.flatMap(s => s.rows);
}

/** Totals for every column marked `total`. Rounded to paise. */
export function totalsOf(columns: ReportColumn[], rows: ReportRow[]): Record<string, number> {
  const t: Record<string, number> = {};
  for (const c of columns) {
    if (!c.total) continue;
    t[c.key] = Math.round(rows.reduce((s, r) => s + (Number(r[c.key]) || 0), 0) * 100) / 100;
  }
  return t;
}

export function hasTotals(columns: ReportColumn[]) {
  return columns.some(c => c.total);
}

export function summaryText(s: SummaryItem): string {
  return s.kind === "money" ? money(s.value, 0) : int.format(s.value);
}

export function sumBy(rows: ReportRow[], key: string) {
  return Math.round(rows.reduce((s, r) => s + (Number(r[key]) || 0), 0) * 100) / 100;
}

export const r2 = (n: number) => Math.round((Number(n) || 0) * 100) / 100;
