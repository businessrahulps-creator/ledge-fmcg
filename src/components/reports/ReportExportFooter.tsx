import { useState } from "react";
import { Download, FileText, Loader2, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { logError } from "@/utils/errorLog";

interface ExtraAction {
  label: string;
  icon: LucideIcon;
  onClick: () => void | Promise<void>;
  title?: string;
  /** Success toast title. Set to null to suppress the success toast. Default: `${label} ready`. */
  successLabel?: string | null;
}

interface Props {
  onExcel: () => void | Promise<void>;
  onPdf: () => void | Promise<void>;
  excelLabel?: string;
  /** Optional typed extra action — gets loading state + toasts. */
  extraAction?: ExtraAction;
  /** Escape hatch for fully custom slots (no automatic loading/toasts). */
  extra?: React.ReactNode;
}

/**
 * Bottom-of-report action bar. Wraps every action with a loading spinner,
 * disabled state while running, and success/error toasts.
 */
export function ReportExportFooter({
  onExcel,
  onPdf,
  excelLabel = "Download Excel",
  extraAction,
  extra,
}: Props) {
  const [excelLoading, setExcelLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [extraLoading, setExtraLoading] = useState(false);

  const anyLoading = excelLoading || pdfLoading || extraLoading;

  const run = async (
    fn: () => void | Promise<void>,
    setLoading: (v: boolean) => void,
    opts: { successTitle: string | null; successDesc?: string; errorTitle: string; context: string },
  ) => {
    setLoading(true);
    const started = performance.now();
    try {
      await Promise.resolve(fn());
      if (opts.successTitle) {
        toast.success(opts.successTitle, opts.successDesc ? { description: opts.successDesc } : undefined);
      }
    } catch (err) {
      logError(`[ReportExportFooter] ${opts.context} failed`, err);
      const description = err instanceof Error ? err.message : "Please try again.";
      toast.error(opts.errorTitle, { description });
    } finally {
      // Keep spinner visible for at least 250ms so the state is perceptible.
      const elapsed = performance.now() - started;
      const remaining = Math.max(0, 250 - elapsed);
      window.setTimeout(() => setLoading(false), remaining);
    }
  };

  const handleExcel = () =>
    run(onExcel, setExcelLoading, {
      successTitle: "Excel ready",
      successDesc: "Download started.",
      errorTitle: "Couldn't export Excel",
      context: "excel-export",
    });

  const handlePdf = () =>
    run(onPdf, setPdfLoading, {
      // PDF action opens a preview dialog; the dialog itself is the feedback.
      successTitle: null,
      errorTitle: "Couldn't open PDF preview",
      context: "pdf-export",
    });

  const handleExtra = () => {
    if (!extraAction) return;
    return run(extraAction.onClick, setExtraLoading, {
      successTitle:
        extraAction.successLabel === undefined ? `${extraAction.label} ready` : extraAction.successLabel,
      successDesc: extraAction.successLabel === null ? undefined : "Download started.",
      errorTitle: `Couldn't export ${extraAction.label}`,
      context: `extra-${extraAction.label}`,
    });
  };

  const ExtraIcon = extraAction?.icon;

  return (
    <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
      {extra}
      {extraAction && ExtraIcon ? (
        <Button
          variant="outline"
          size="sm"
          className="h-10 px-4"
          title={extraAction.title}
          onClick={handleExtra}
          disabled={anyLoading}
          aria-busy={extraLoading}
        >
          {extraLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <ExtraIcon className="h-3.5 w-3.5" />
          )}
          <span>{extraLoading ? "Preparing…" : extraAction.label}</span>
        </Button>
      ) : null}
      <Button
        variant="outline"
        size="sm"
        className="h-10 px-4"
        onClick={handleExcel}
        disabled={anyLoading}
        aria-busy={excelLoading}
      >
        {excelLoading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Download className="h-3.5 w-3.5" />
        )}
        <span>{excelLoading ? "Preparing…" : excelLabel}</span>
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="h-10 px-4"
        onClick={handlePdf}
        disabled={anyLoading}
        aria-busy={pdfLoading}
      >
        {pdfLoading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <FileText className="h-3.5 w-3.5" />
        )}
        <span>{pdfLoading ? "Opening…" : "Download PDF"}</span>
      </Button>
    </div>
  );
}
