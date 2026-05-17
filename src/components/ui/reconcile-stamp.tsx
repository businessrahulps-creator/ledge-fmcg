import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * Trust signal. Shows when the data was last reconciled.
 * Goes amber after 5 min, Terracotta (with refresh affordance) after 30 min.
 *
 * NOTE: amber is the single hard-coded HSL exception in V2 — there is no
 * --warning-soft token yet, and the existing --warning (Terracotta) is
 * already reserved for the cold state below. Documented + isolated here.
 */

type Freshness = "fresh" | "stale" | "cold";

function classify(ageMs: number): Freshness {
  if (ageMs > 30 * 60_000) return "cold";
  if (ageMs > 5 * 60_000) return "stale";
  return "fresh";
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

interface ReconcileStampProps {
  updatedAt: Date;
  onRefresh?: () => void;
  className?: string;
  /** Hide the "Updated " word prefix to save space. */
  compact?: boolean;
}

export function ReconcileStamp({
  updatedAt,
  onRefresh,
  className,
  compact = false,
}: ReconcileStampProps) {
  // Re-render every 60s so freshness re-classifies.
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const ageMs = Date.now() - updatedAt.getTime();
  const state = classify(ageMs);

  const dot =
    state === "fresh"
      ? "bg-success"
      : state === "stale"
        ? "bg-[hsl(38_92%_50%)]" // amber — single documented exception
        : "bg-accent"; // Terracotta

  const label =
    state === "cold"
      ? `Updated ${formatTime(updatedAt)} · Refresh recommended`
      : `${compact ? "" : "Updated "}${formatTime(updatedAt)} · Reconciled`;

  const fullTooltip = `Last reconciled at ${updatedAt.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  })}`;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            aria-live="polite"
            className={cn(
              "inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground/85 tabular-nums",
              className,
            )}
          >
            <span
              aria-hidden
              className={cn("inline-block h-1.5 w-1.5 rounded-full", dot)}
            />
            <span>{label}</span>
            {state === "cold" && onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                aria-label="Refresh data"
                className="inline-flex h-5 w-5 items-center justify-center rounded text-accent hover:bg-accent/10 transition-colors"
              >
                <RefreshCw className="h-3 w-3" />
              </button>
            )}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {fullTooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
