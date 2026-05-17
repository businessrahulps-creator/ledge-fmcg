import React from "react";
import { toast } from "sonner";
import { logError } from "@/utils/errorLog";

/** Helvetica-safe currency formatter for PDF rendering (uses "Rs." instead of ₹) */
export function formatCurrencyPdf(amount: number): string {
  const formatted = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
  return `Rs. ${formatted}`;
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
