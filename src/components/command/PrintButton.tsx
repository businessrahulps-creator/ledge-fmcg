import { Printer } from "lucide-react";

interface Props {
  onClick: () => void;
}

export function PrintButton({ onClick }: Props) {
  return (
    <button
      type="button"
      aria-label="Open print preview"
      title="Print preview (Shift+P)"
      onClick={onClick}
      className="command-no-print inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card text-foreground transition-colors hover:bg-muted"
    >
      <Printer className="h-3.5 w-3.5" />
    </button>
  );
}
