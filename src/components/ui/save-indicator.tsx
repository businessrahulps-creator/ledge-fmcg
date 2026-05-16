import { Check, CircleAlert, Loader2, WifiOff, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AutosaveStatus } from "@/hooks/use-autosave";

interface SaveIndicatorProps {
  status: AutosaveStatus;
  lastSavedAt: Date | null;
  className?: string;
}

function formatAgo(d: Date): string {
  const secs = Math.floor((Date.now() - d.getTime()) / 1000);
  if (secs < 5) return "just now";
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  return d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
}

/**
 * Tiny inline pill that mirrors Word/Loop autosave state. Pair with `useAutosave`.
 */
export function SaveIndicator({ status, lastSavedAt, className }: SaveIndicatorProps) {
  const base = "inline-flex items-center gap-1.5 text-[11px] font-medium tracking-tight transition-opacity";
  if (status === "saving") {
    return (
      <span className={cn(base, "text-muted-foreground", className)} aria-live="polite">
        <Loader2 className="h-3 w-3 animate-spin" />
        Saving…
      </span>
    );
  }
  if (status === "saved") {
    return (
      <span className={cn(base, "text-foreground/70", className)} aria-live="polite">
        <Check className="h-3 w-3 text-[hsl(var(--success,142_60%_38%))]" />
        Saved{lastSavedAt ? ` · ${formatAgo(lastSavedAt)}` : ""}
      </span>
    );
  }
  if (status === "dirty") {
    return (
      <span className={cn(base, "text-muted-foreground", className)}>
        <Pencil className="h-3 w-3" />
        Unsaved changes
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className={cn(base, "text-destructive", className)} role="alert">
        <CircleAlert className="h-3 w-3" />
        Couldn't save
      </span>
    );
  }
  if (status === "offline") {
    return (
      <span className={cn(base, "text-amber-600 dark:text-amber-400", className)}>
        <WifiOff className="h-3 w-3" />
        Offline — will sync
      </span>
    );
  }
  return null;
}
