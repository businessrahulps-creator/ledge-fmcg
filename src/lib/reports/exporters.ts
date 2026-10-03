import { createElement } from "react";
import { toast } from "sonner";
import { logError } from "@/utils/errorLog";
import { todayKey } from "@/utils/dateKey";
import type { ReportColumn, ReportDef, ReportRow, ReportSection, SummaryItem } from "./types";
import { allRows, cellText, hasTotals, money, summaryText, totalsOf } from "./format";

export interface ExportContext {
  def: ReportDef;
  sections: ReportSection[];
  summary: SummaryItem[];
  periodLabel: string;
  madeBy: string;
  company: { name: string; address: string; gstin: string; logoUrl?: string };
  include?: { company: boolean; summary: boolean; table: boolean };
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
export const fileBase = (def: ReportDef, period: string) => `${slug(def.title)}_${slug(period) || todayKey()}`;

export function madeAt(): string {
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" }).format(new Date()) + " IST";
}

function save(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

const rawValue = (c: ReportColumn, v: ReportRow[string]) => (v == null ? "" : c.type === "date" && v ? String(v).slice(0, 10) : v);

/** Stops spreadsheet formula injection: text starting with = + - @ tab or CR is opened as plain text. */
export const csvSafeText = (s: string) => (/^[=+\-@\t\r]/.test(s) ? `'${s}` : s);

/* ── CSV: UTF-8 with BOM so Excel shows ₹ and Indian names correctly. */
export function exportCsv(ctx: ExportContext) {
  const { def, sections } = ctx;
  const multi = sections.length > 1;
  const head = [...(multi ? ["Section"] : []), ...def.columns.map(c => c.header)];
  const esc = (v: unknown) => { const s = String(v ?? ""); return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const lines = [head.map(t => esc(csvSafeText(t))).join(",")];
  for (const s of sections) for (const r of s.rows) lines.push([
    ...(multi ? [csvSafeText(s.name)] : []),
    ...def.columns.map(c => { const v = rawValue(c, r[c.key]); return typeof v === "string" && c.type !== "money" && c.type !== "number" ? csvSafeText(v) : v; }),
  ].map(esc).join(","));
  save(new Blob(["\uFEFF" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" }), `${fileBase(def, ctx.periodLabel)}.csv`);
  return allRows(sections).length;
}

/* ── Excel: real numbers/dates, ₹ format, filters, totals, one sheet per section + info sheet. */
export async function exportExcel(ctx: ExportContext) {
  const XLSX = await import("xlsx");
  const { def, sections } = ctx;
  const wb = XLSX.utils.book_new();
  const moneyFmt = '"₹"#,##,##0.00';
  for (const s of sections) {
    const aoa: (string | number | Date | null)[][] = [def.columns.map(c => c.header)];
    for (const r of s.rows) aoa.push(def.columns.map(c => {
      const v = r[c.key];
      if (v == null || v === "") return null;
      if (c.type === "date") { const [y, m, d] = String(v).slice(0, 10).split("-").map(Number); return new Date(Date.UTC(y, m - 1, d)); }
      if (c.type === "money" || c.type === "number") return Number(v);
      return String(v);
    }));
    if (hasTotals(def.columns) && s.rows.length) {
      const t = totalsOf(def.columns, s.rows);
      aoa.push(def.columns.map((c, i) => (i === 0 ? "Total" : c.total ? t[c.key] : null)));
    }
    const ws = XLSX.utils.aoa_to_sheet(aoa, { cellDates: true });
    const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
    def.columns.forEach((c, ci) => {
      for (let ri = 1; ri <= range.e.r; ri++) {
        const cell = ws[XLSX.utils.encode_cell({ r: ri, c: ci })];
        if (!cell) continue;
        if (c.type === "money") cell.z = moneyFmt;
        else if (c.type === "date") cell.z = "dd/mm/yyyy";
        else if (c.type === "number") cell.z = "#,##0";
      }
    });
    ws["!cols"] = def.columns.map((c, ci) => ({ wch: Math.min(48, Math.max(c.header.length + 2, ...s.rows.slice(0, 500).map(r => cellText(c, r[c.key]).length + 2), c.type === "money" ? 14 : 8)) }));
    ws["!autofilter"] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: Math.max(0, s.rows.length), c: def.columns.length - 1 } }) };
    XLSX.utils.book_append_sheet(wb, ws, (s.name || "Data").slice(0, 31));
  }
  const info = XLSX.utils.aoa_to_sheet([
    ["Report", def.title], ["Business", ctx.company.name], ["GSTIN", ctx.company.gstin || ""], ["Period", ctx.periodLabel],
    ["Made by", ctx.madeBy], ["Made on", madeAt()], [],
    ...ctx.summary.map(s => [s.label, s.value]),
  ]);
  info["!cols"] = [{ wch: 18 }, { wch: 48 }];
  XLSX.utils.book_append_sheet(wb, info, "Report info");
  XLSX.writeFile(wb, `${fileBase(def, ctx.periodLabel)}.xlsx`);
  return allRows(sections).length;
}

/* ── PDF: the same letterhead/footer pipeline as bills and statements. */
async function buildPdfBlob(ctx: ExportContext): Promise<Blob> {
  const [{ pdf }, { ReportPdf }] = await Promise.all([import("@react-pdf/renderer"), import("@/components/pdf/ReportPdf")]);
  const { def, sections } = ctx;
  const weights = def.columns.map(c => c.weight ?? (c.type === "money" ? 1.2 : 1));
  const W = weights.reduce((a, b) => a + b, 0);
  const columns = def.columns.map((c, i) => ({ header: c.header, width: `${((weights[i] / W) * 100).toFixed(2)}%`, align: (c.type === "money" || c.type === "number" ? "right" : "left") as "left" | "right" }));
  const toCells = (r: ReportRow) => def.columns.map(c => cellText(c, r[c.key]));
  const totalsCells = (rows: ReportRow[], label: string) => { const t = totalsOf(def.columns, rows); return def.columns.map((c, i) => (i === 0 ? label : c.total ? cellText(c, t[c.key]) : "")); };
  const all = allRows(sections);
  const multi = sections.length > 1;
  const showTotals = hasTotals(def.columns) && all.length > 0;
  const note = def.note?.(all) ?? undefined;
  const sel = ctx.include ?? { company: true, summary: true, table: true };
  const doc = createElement(ReportPdf, {
    title: def.title,
    subtitle: ctx.periodLabel,
    meta: `${def.usesDates ? `Period: ${ctx.periodLabel} · ` : `As on ${ctx.periodLabel} · `}Made by ${ctx.madeBy} on ${madeAt()}`,
    columns, rows: [],
    sections: sections.map(s => ({ name: multi ? s.name : undefined, rows: s.rows.map(toCells), subtotal: multi && showTotals && s.rows.length ? totalsCells(s.rows, `${s.name} total`) : undefined })),
    totalsRow: showTotals ? totalsCells(all, "Total") : undefined,
    summary: ctx.summary.map(s => ({ label: s.label, value: summaryText(s) })),
    showCompany: sel.company, showSummary: sel.summary && ctx.summary.length > 0, showTable: sel.table,
    note: note || undefined,
    orientation: def.columns.length > 7 ? "landscape" : "portrait",
    companyName: ctx.company.name, companyAddress: ctx.company.address, gstin: ctx.company.gstin, logoUrl: ctx.company.logoUrl,
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return pdf(doc as any).toBlob();
}

export async function exportPdf(ctx: ExportContext) {
  const blob = await buildPdfBlob(ctx);
  save(blob, `${fileBase(ctx.def, ctx.periodLabel)}.pdf`);
  return allRows(ctx.sections).length;
}

/** Share the PDF on WhatsApp (phone share sheet); on desktop it downloads and opens WhatsApp with a short message. */
export async function sharePdf(ctx: ExportContext) {
  const blob = await buildPdfBlob(ctx);
  const name = `${fileBase(ctx.def, ctx.periodLabel)}.pdf`;
  const file = new File([blob], name, { type: "application/pdf" });
  const text = `${ctx.def.title} · ${ctx.periodLabel} · ${ctx.company.name}`;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nav = navigator as any;
  if (nav.canShare?.({ files: [file] })) {
    try { await nav.share({ files: [file], title: ctx.def.title, text }); return allRows(ctx.sections).length; }
    catch (e) { if ((e as Error)?.name === "AbortError") return 0; }
  }
  save(blob, name);
  window.open(`https://wa.me/?text=${encodeURIComponent(`${text} (PDF attached)`)}`, "_blank", "noopener");
  return allRows(ctx.sections).length;
}

export function saveText(text: string, filename: string, type: string) {
  save(new Blob([text], { type }), filename);
}

/** Let the browser paint (spinner, pressed button) before heavy work. */
export function yieldToMain(): Promise<void> {
  const s = (globalThis as any).scheduler;
  if (s?.yield) return s.yield();
  return new Promise((r) => setTimeout(r, 0));
}

export async function runExport(label: string, fn: () => Promise<number> | number) {
  try {
    await yieldToMain();
    const count = await fn();
    if (count > 0) toast.success(`${label} ready`, { description: `${count} row${count === 1 ? "" : "s"}.` });
    return count;
  } catch (err) {
    logError({ source: `reports:${label}`, error: err, severity: "warning" });
    toast.error(`Couldn't make the ${label}`, { description: "Please try again." });
    return 0;
  }
}

export { money };
