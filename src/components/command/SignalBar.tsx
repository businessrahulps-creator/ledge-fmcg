import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Clock, TrendingUp, AlertCircle, CheckCircle2, ArrowRight, ChevronDown, MessageCircle, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { CommandSignal } from "@/lib/command-signals";
import { SignalActions } from "./SignalActions";
import type { SignalAck } from "@/lib/command-acks";

interface Props {
  signals: CommandSignal[];
  lastUpdated: Date | null;
  /** Max signals to show before "+ N more". Default 3. */
  collapseAt?: number;
  /** Acks keyed by signal id. */
  acks?: Map<string, SignalAck>;
  /** Teammate name lookup for showing "Assigned to X" pill. */
  teammateLookup?: Map<string, string>;
  /** Action handlers. */
  onSnooze?: (signalId: string, days: number) => void;
  onAssign?: (signalId: string, userId: string, userName: string) => void;
  onResolve?: (signalId: string) => void;
  onClear?: (signalId: string) => void;
  /** Signals that support a WhatsApp blast (dormant, dormant-owing, credit-risk). */
  onBlast?: (signalId: string) => void;
  blastableIds?: Set<string>;
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

function snoozeRemaining(until: string): string {
  const ms = new Date(until).getTime() - Date.now();
  const days = Math.ceil(ms / 86400_000);
  if (days <= 1) return "Snoozed · <1d";
  return `Snoozed · ${days}d`;
}

export function SignalBar({
  signals,
  lastUpdated,
  collapseAt = 3,
  acks,
  teammateLookup,
  onSnooze,
  onAssign,
  onResolve,
  onClear,
  onBlast,
  blastableIds,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  const visible = expanded ? signals : signals.slice(0, collapseAt);
  const hiddenCount = Math.max(0, signals.length - collapseAt);

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
        <>
          <div className="grid gap-2 md:grid-cols-2">
            {visible.map((s) => {
              const style = tierStyles[s.tier];
              const Icon = tierIcon[s.tier];
              const ack = acks?.get(s.id);
              const assignedName = ack?.assigned_to ? teammateLookup?.get(ack.assigned_to) : null;
              const canBlast = !!onBlast && blastableIds?.has(s.id);

              return (
                <div
                  key={s.id}
                  className={cn(
                    "group flex items-center gap-2 rounded-r-md border-l-[3px] px-3 py-2.5 transition-colors hover:bg-muted/40",
                    style.border,
                    style.bg,
                  )}
                >
                  <button
                    type="button"
                    onClick={() => navigate(s.href)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <Icon className={cn("h-4 w-4 shrink-0", style.text)} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className={cn("text-[10px] font-semibold uppercase tracking-[0.16em]", style.text)}>
                          {s.label}
                        </p>
                        {ack?.snoozed_until && new Date(ack.snoozed_until).getTime() > Date.now() && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                            <Clock className="h-2.5 w-2.5" />
                            {snoozeRemaining(ack.snoozed_until)}
                          </span>
                        )}
                        {assignedName && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-primary">
                            <UserCheck className="h-2.5 w-2.5" />
                            {assignedName.split(" ")[0]}
                          </span>
                        )}
                      </div>
                      <p className="truncate text-sm text-foreground">{s.message}</p>
                    </div>
                    <span className="hidden shrink-0 items-center gap-1 text-xs font-medium text-foreground/70 group-hover:text-foreground sm:flex">
                      {s.cta}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </button>

                  <div className="flex shrink-0 items-center gap-0.5">
                    {canBlast && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onBlast!(s.id);
                        }}
                        aria-label="Send WhatsApp blast"
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-success"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {onSnooze && onAssign && onResolve && onClear && (
                      <SignalActions
                        signalKey={s.id}
                        ack={ack}
                        onSnooze={(days) => onSnooze(s.id, days)}
                        onAssign={(uid, uname) => onAssign(s.id, uid, uname)}
                        onResolve={() => onResolve(s.id)}
                        onClear={() => onClear(s.id)}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {hiddenCount > 0 && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ChevronDown className={cn("h-3 w-3 transition-transform", expanded && "rotate-180")} />
              {expanded ? "Show less" : `+ ${hiddenCount} more`}
            </button>
          )}
        </>
      )}
    </div>
  );
}
