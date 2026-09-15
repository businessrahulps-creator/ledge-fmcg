import React from "react";
import { toast } from "sonner";
import { logError } from "@/utils/errorLog";

/**
 * Money formatter for PDFs. The bundled PDF font (Noto Sans) carries the rupee
 * sign, so documents print a real ₹ instead of "Rs.".
 * Whole rupees by default (summary cards, analytics); pass 2 decimals for
 * financial documents — bills, credit notes, statements, payment lists.
 */
export function formatCurrencyPdf(amount: number, decimals: 0 | 2 = 0): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  const formatted = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(safe);
  return `₹${formatted}`;
}

/** Exact money for financial documents — always two decimals. */
export function formatMoneyPdf(amount: number): string {
  return formatCurrencyPdf(amount, 2);
}

export async function downloadPdf(filename: string, document: React.ReactElement) {
  try {
    const { pdf } = await import("@react-pdf/renderer");
    const blob = await pdf(document).toBlob();
    const url = URL.createObjectURL(blob);
    const link = globalThis.document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    toast.success("PDF exported", { description: filename });
  } catch (err) {
    logError({ source: "export:pdf", error: err, severity: "warning", context: { filename } });
    toast.error("PDF export failed", { description: "Please try again." });
  }
}

export function pdfFilename(type: string, suffix?: string): string {
  const date = new Date().toISOString().slice(0, 10);
  return suffix ? `${type}_${suffix}_${date}.pdf` : `${type}_${date}.pdf`;
}
