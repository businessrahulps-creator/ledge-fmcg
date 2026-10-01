import { forwardRef, useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import type { CommandPdfProps } from "@/components/pdf/CommandPdf";
import type { CommandPeriod } from "@/lib/command-signals";
import {
  MARGIN_PT,
  PDF_PAGE_SIZE,
  usePrintPreferences,
} from "@/hooks/usePrintPreferences";

interface Props {
  /** Built only when the user asks for the PDF — never on every render. */
  getData: () => CommandPdfProps;
  period: CommandPeriod;
}

export const ExportPdfButton = forwardRef<HTMLButtonElement, Props>(function ExportPdfButton(
  { getData, period },
  ref,
) {
  const [busy, setBusy] = useState(false);
  const { pageSize, margin } = usePrintPreferences();

  const handle = async () => {
    if (busy) return;
    setBusy(true);
    try {
      // The PDF engine is heavy; load it only when someone clicks.
      const [{ downloadPdf, pdfFilename }, { CommandPdf }] = await Promise.all([
        import("@/utils/exportPdf"),
        import("@/components/pdf/CommandPdf"),
      ]);
      await downloadPdf(
        pdfFilename("command", period),
        <CommandPdf
          {...getData()}
          pageSize={PDF_PAGE_SIZE[pageSize]}
          pagePadding={MARGIN_PT[margin]}
        />,
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      ref={ref}
      type="button"
      onClick={handle}
      disabled={busy}
      aria-label="Download PDF"
      title="Download PDF (P)"
      className="command-no-print inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-card px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-60"
    >
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5" />}
      <span>{busy ? "Generating…" : "Download PDF"}</span>
    </button>
  );
});
