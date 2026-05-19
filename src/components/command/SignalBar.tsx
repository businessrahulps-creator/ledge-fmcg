import { Link } from "react-router-dom";
import { AlertTriangle, Clock, TrendingUp, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { CommandSignal } from "@/lib/command-signals";

interface Props {
  signals: CommandSignal[];
  lastUpdated: Date | null;
}

const tierStyles = {
  destructive: { border: "border-l-destructive", text: "text-destructive", bg: "bg-destructive/[0.04]" },
  warning: { border: "border-l-warning", text: "text-warning", bg: "bg-warning/[0.04]" },
  success: { border: "border-l-success", text: "text-success", bg: "bg-success/[0.04]" },
  neutral: { border: "border-l-muted-foreground/40", text: "text-foreground", bg: "bg-muted/30" },
} as const;

const tierIcon = {
  destructive: AlertCircle,
  warning: AlertTriangle,
  success: CheckCircle2,
  neutral: TrendingUp,
} as const;

function timeAgo(d: Date | null): string {
  if (!d) return "—";
  const mins = Math.max(0, Math.floor((Date.now() - d.getTime()) / 60000));
  if (mins < 1) return "just now";
  if (mins === 1) return "1 min ago";
  if (mins < 60) return `${mins} mins ago`;
  const hrs = Math.floor(mins / 60);
  return hrs === 1 ? "1 hour ago" : `${hrs} hours ago`;
}

export function SignalBar({ signals, lastUpdated }: Props) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          What needs your attention
        </h2>
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Clock className="h-3 w-3" />
          Updated {timeAgo(lastUpdated)}
        </span>
      </div>

      {signals.length === 0 ? (
        <div className="rounded-md border border-dashed border-border bg-muted/20 px-4 py-5 text-center">
          <CheckCircle2 className="mx-auto h-5 w-5 text-success" />
          <p className="mt-1.5 text-sm text-foreground">All clear for this period.</p>
          <p className="text-xs text-muted-foreground">No risks or alerts to act on right now.</p>
        </div>
      ) : (
        <div className="grid gap-2 md:grid-cols-2">
          {signals.map((s) => {
            const style = tierStyles[s.tier];
            const Icon = tierIcon[s.tier];
            return (
              <Link
                key={s.id}
                to={s.href}
                className={cn(
                  "group flex items-center gap-3 rounded-r-md border-l-[3px] px-3 py-2.5 transition-colors hover:bg-muted/40",
                  style.border,
                  style.bg,
                )}
              >
                <Icon className={cn("h-4 w-4 shrink-0", style.text)} />
                <div className="min-w-0 flex-1">
                  <p className={cn("text-[10px] font-semibold uppercase tracking-[0.16em]", style.text)}>{s.label}</p>
                  <p className="truncate text-sm text-foreground">{s.message}</p>
                </div>
                <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-foreground/70 group-hover:text-foreground">
                  {s.cta}
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
