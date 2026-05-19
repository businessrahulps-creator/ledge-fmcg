import { useEffect, useState } from "react";
import { Printer, X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

/**
 * Print Preview overlay for /command.
 *
 * Sets `data-print-preview` on <body> while open. The matching CSS in
 * `command-print.css` mirrors the `@media print` rules on screen, so what the
 * user sees here is what the printer will receive. A fixed toolbar exposes
 * Close + Print now, and dashed horizontal guides every A4-page-height
 * (1123px @ 96dpi) make page breaks visible.
 */
export function PrintPreviewOverlay({ open, onClose }: Props) {
  const [pageCount, setPageCount] = useState(1);

  useEffect(() => {
    if (!open) return;
    document.body.setAttribute("data-print-preview", "");

    // Recompute page count after the layout settles into preview mode.
    const measure = () => {
      const root = document.querySelector<HTMLElement>("[data-command-root]");
      if (!root) return;
      const pageH = 1123; // A4 portrait @ 96dpi
      setPageCount(Math.max(1, Math.ceil(root.scrollHeight / pageH)));
    };
    const t = window.setTimeout(measure, 60);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);

    return () => {
      window.clearTimeout(t);
      window.removeEventListener("keydown", onKey);
      document.body.removeAttribute("data-print-preview");
    };
  }, [open, onClose]);

  if (!open) return null;

  const handlePrint = () => {
    // Drop preview mode so the real `@media print` rules take over verbatim,
    // print, then restore on afterprint so the overlay reopens for the user.
    document.body.removeAttribute("data-print-preview");
    const restore = () => {
      document.body.setAttribute("data-print-preview", "");
      window.removeEventListener("afterprint", restore);
    };
    window.addEventListener("afterprint", restore);
    window.setTimeout(() => window.print(), 60);
  };

  return (
    <div
      data-print-preview-toolbar
      className="fixed inset-x-0 top-0 z-[60] flex items-center justify-between gap-3 border-b border-border bg-card/95 px-4 py-2 backdrop-blur"
      role="toolbar"
      aria-label="Print preview"
    >
      <div className="flex items-center gap-3 text-xs text-foreground/80">
        <span className="font-medium text-foreground">Print preview</span>
        <span className="text-muted-foreground">
          {pageCount} {pageCount === 1 ? "page" : "pages"} · A4 portrait
        </span>
        <span className="hidden text-muted-foreground sm:inline">
          Dashed lines show where pages break. Scroll to verify, then Print.
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-card px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted"
        >
          <X className="h-3.5 w-3.5" />
          <span>Close</span>
        </button>
        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Printer className="h-3.5 w-3.5" />
          <span>Print now</span>
        </button>
      </div>
    </div>
  );
}
