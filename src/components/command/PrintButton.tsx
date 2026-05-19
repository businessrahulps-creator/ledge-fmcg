import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button
      type="button"
      aria-label="Print this page"
      title="Print (P)"
      onClick={() => window.print()}
      className="command-no-print inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card text-foreground transition-colors hover:bg-muted"
    >
      <Printer className="h-3.5 w-3.5" />
    </button>
  );
}
