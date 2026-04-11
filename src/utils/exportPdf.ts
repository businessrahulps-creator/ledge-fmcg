import React from "react";
import { toast } from "sonner";

export async function downloadPdf(filename: string, document: React.ReactElement) {
  try {
    const { pdf } = await import("@react-pdf/renderer");
    const blob = await pdf(document).toBlob();
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.type ? globalThis.document.createElement("a") : null!, {
      href: url,
      download: filename,
    });
    // Safer: always use globalThis.document
    const link = globalThis.document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    toast.success("PDF exported", { description: filename });
  } catch (err) {
    console.error("PDF export failed", err);
    toast.error("PDF export failed", { description: "Please try again." });
  }
}

export function pdfFilename(type: string, suffix?: string): string {
  const date = new Date().toISOString().slice(0, 10);
  return suffix ? `${type}_${suffix}_${date}.pdf` : `${type}_${date}.pdf`;
}
