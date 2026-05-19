import { forwardRef, useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import { downloadPdf, pdfFilename } from "@/utils/exportPdf";
import { CommandPdf, type CommandPdfProps } from "@/components/pdf/CommandPdf";
import type { CommandPeriod } from "@/lib/command-signals";

interface Props {
  data: CommandPdfProps;
  period: CommandPeriod;
}

export const ExportPdfButton = forwardRef<HTMLButtonElement, Props>(function ExportPdfButton(
  { data, period },
  ref,
) {
  const [busy, setBusy] = useState(false);

  const handle = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await downloadPdf(pdfFilename("command", period), <CommandPdf {...data} />);
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
      aria-label="Download PDF snapshot"
      title="Download PDF (P)"
      className="command-no-print inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-card px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-60"
    >
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5" />}
      <span>{busy ? "Generating…" : "Download PDF"}</span>
    </button>
  );
});
