import * as React from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

interface CopyButtonProps {
  value: string;
  /** What is being copied, for screen readers, e.g. "bill number". */
  label?: string;
  className?: string;
}

/** Small icon button that copies text and briefly shows a tick. */
export function CopyButton({ value, label = "text", className }: CopyButtonProps) {
  const [state, setState] = React.useState<"idle" | "done" | "failed">("idle");
  React.useEffect(() => {
    if (state === "idle") return;
    const t = setTimeout(() => setState("idle"), 1600);
    return () => clearTimeout(t);
  }, [state]);

  const copy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(value);
      setState("done");
    } catch {
      setState("failed");
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={state === "done" ? `Copied ${label}` : `Copy ${label}`}
      title={state === "done" ? "Copied" : state === "failed" ? "Could not copy" : `Copy ${label}`}
      className={cn(
        "inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-95 motion-reduce:active:scale-100",
        className,
      )}
    >
      {state === "done" ? (
        <Check className="h-3.5 w-3.5 text-success animate-in zoom-in-50 duration-150" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
      <span className="sr-only" aria-live="polite">{state === "done" ? "Copied" : ""}</span>
    </button>
  );
}
