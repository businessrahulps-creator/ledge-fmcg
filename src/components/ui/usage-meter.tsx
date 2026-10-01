import { cn } from "@/lib/utils";

/** Shows how much of a limit is used, e.g. a dealer's credit limit. */
export function UsageMeter({
  used,
  limit,
  label,
  format = (n) => String(n),
  className,
}: {
  used: number;
  limit: number;
  label: string;
  format?: (n: number) => string;
  className?: string;
}) {
  const pct = limit > 0 ? Math.min(100, Math.max(0, (used / limit) * 100)) : 0;
  const tone = pct >= 90 ? "bg-destructive" : pct >= 70 ? "bg-warning" : "bg-foreground";
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="num tabular-nums text-foreground">
          {format(used)} <span className="text-muted-foreground">of {format(limit)}</span>
        </span>
      </div>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={limit}
        aria-valuenow={used}
      >
        <div className={cn("h-full rounded-full transition-[width] duration-500 ease-out motion-reduce:transition-none", tone)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
