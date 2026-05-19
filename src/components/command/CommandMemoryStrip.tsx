import { useEffect, useRef } from "react";
import { History } from "lucide-react";
import { formatCurrency } from "@/data/mock-data";
import { CommandPeriod, PERIOD_LABELS } from "@/lib/command-signals";

const KEY = "ledge.command.lastVisit";

interface Snapshot {
  at: string; // ISO
  period: CommandPeriod;
  revenue: number;
  signalCount: number;
}

interface Props {
  period: CommandPeriod;
  revenue: number;
  signalCount: number;
  ready: boolean;
}

function readSnapshot(): Snapshot | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Snapshot;
  } catch {
    return null;
  }
}

export function CommandMemoryStrip({ period, revenue, signalCount, ready }: Props) {
  const prev = useRef<Snapshot | null>(null);
  if (prev.current === null) prev.current = readSnapshot();

  useEffect(() => {
    if (!ready) return;
    const snap: Snapshot = { at: new Date().toISOString(), period, revenue, signalCount };
    try { localStorage.setItem(KEY, JSON.stringify(snap)); } catch { /* ignore */ }
  }, [ready, period, revenue, signalCount]);

  const last = prev.current;
  if (!last) return null;

  const when = new Date(last.at);
  const dayDiff = Math.round((Date.now() - when.getTime()) / 86400000);
  const whenLabel = dayDiff < 1 ? "earlier today" : dayDiff === 1 ? "yesterday" : `${dayDiff} days ago`;

  return (
    <div className="flex items-center gap-2 rounded-md border border-border/60 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
      <History className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">
        Last time you were here ({whenLabel}): {PERIOD_LABELS[last.period]} · {formatCurrency(last.revenue)} revenue ·{" "}
        {last.signalCount} signal{last.signalCount === 1 ? "" : "s"}
      </span>
    </div>
  );
}
