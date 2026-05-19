import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useApi } from "@/services/api";
import { Card } from "@/components/ui/card";
import { CommandEmptyState } from "../CommandEmptyState";
import { CardSkeleton } from "../CommandSkeleton";
import { formatCurrency } from "@/data/mock-data";
import { ArrowRight, UserCheck, AlarmClock, Target as TargetIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { ordersInPeriod, type PeriodRange } from "@/lib/command-signals";
import { cn } from "@/lib/utils";

interface Props {
  range: PeriodRange;
}

type Status = "ontrack" | "atrisk" | "behind" | "inactive";

const STATUS_LABEL: Record<Status, string> = {
  ontrack: "On track",
  atrisk: "At risk",
  behind: "Behind",
  inactive: "Inactive",
};

const STATUS_STYLES: Record<Status, string> = {
  ontrack: "bg-success/10 text-success",
  atrisk: "bg-warning/10 text-warning",
  behind: "bg-destructive/10 text-destructive",
  inactive: "bg-muted text-muted-foreground",
};

const STATUS_CHIP_ACTIVE: Record<Status, string> = {
  ontrack: "ring-2 ring-success/40",
  atrisk: "ring-2 ring-warning/40",
  behind: "ring-2 ring-destructive/40",
  inactive: "ring-2 ring-muted-foreground/30",
};

function statusFor(actual: number, target: number, orders: number): Status {
  // Inactive: zero orders this period regardless of target
  if (orders === 0) return "inactive";
  if (!target) return "ontrack";
  const ratio = actual / target;
  if (ratio >= 0.85) return "ontrack";
  // Behind requires orders>0 AND ratio<0.5 — handled because we hit this branch only when orders>0
  if (ratio < 0.5) return "behind";
  return "atrisk";
}

export function PeopleTab({ range }: Props) {
  const api = useApi();
  const loading = api.loading;
  const salespersons = api.salespersons.list();
  const orders = api.orders.list();
  const distributors = api.dealers.list();
  const targets = api.targets.list();

  const [filter, setFilter] = useState<Status | null>(null);

  const computed = useMemo(() => {
    const prevRange: PeriodRange = {
      from: range.prevFrom,
      to: range.prevTo,
      prevFrom: range.prevFrom,
      prevTo: range.prevTo,
    };
    const periodOrders = ordersInPeriod(orders, range);
    const prevOrders = ordersInPeriod(orders, prevRange);

    const revBy = new Map<string, number>();
    const ordBy = new Map<string, number>();
    for (const o of periodOrders) {
      revBy.set(o.salespersonId, (revBy.get(o.salespersonId) || 0) + (o.total || 0));
      ordBy.set(o.salespersonId, (ordBy.get(o.salespersonId) || 0) + 1);
    }
    const prevRevBy = new Map<string, number>();
    for (const o of prevOrders) prevRevBy.set(o.salespersonId, (prevRevBy.get(o.salespersonId) || 0) + (o.total || 0));

    const rows = salespersons
      .map((s) => {
        const actual = revBy.get(s.id) || 0;
        const prev = prevRevBy.get(s.id) || 0;
        const target = targets.find((t) => t.entityId === s.id && t.entityType === "salesperson")?.targetRevenue || 0;
        const ordersCount = ordBy.get(s.id) || 0;
        return {
          ...s,
          actual,
          prev,
          target,
          ordersCount,
          status: statusFor(actual, target, ordersCount),
        };
      })
      .sort((a, b) => b.actual - a.actual);

    const counts: Record<Status, number> = { ontrack: 0, atrisk: 0, behind: 0, inactive: 0 };
    rows.forEach((r) => { counts[r.status]++; });

    // Dormant dealers
    const lastBy = new Map<string, Date>();
    for (const o of orders) {
      const d = new Date(o.date);
      const cur = lastBy.get(o.distributorId);
      if (!cur || d > cur) lastBy.set(o.distributorId, d);
    }
    const dormant = distributors
      .filter((d) => d.totalOrders > 0 && (!lastBy.get(d.id) || (lastBy.get(d.id) as Date) < range.from))
      .slice(0, 5);

    return { rows, counts, dormant };
  }, [salespersons, orders, distributors, targets, range]);

  if (loading) return <div className="space-y-4"><CardSkeleton height={60} /><CardSkeleton height={300} /></div>;

  const visibleRows = filter ? computed.rows.filter((r) => r.status === filter) : computed.rows;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Team summary chips — clickable filters */}
      <div className="flex flex-wrap items-center gap-2">
        {(["ontrack", "atrisk", "behind", "inactive"] as Status[]).map((s) => {
          const active = filter === s;
          const disabled = computed.counts[s] === 0;
          return (
            <button
              key={s}
              type="button"
              disabled={disabled}
              onClick={() => setFilter(active ? null : s)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all",
                STATUS_STYLES[s],
                active && STATUS_CHIP_ACTIVE[s],
                disabled && "opacity-50 cursor-not-allowed",
                !disabled && !active && "hover:scale-[1.02]",
              )}
            >
              <span className="num">{computed.counts[s]}</span> {STATUS_LABEL[s]}
            </button>
          );
        })}
        {filter && (
          <button
            type="button"
            onClick={() => setFilter(null)}
            className="text-[11px] text-muted-foreground hover:text-foreground hover:underline ml-1"
          >
            Clear filter
          </button>
        )}
      </div>

      <Card className="p-4">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
          <UserCheck className="h-4 w-4 text-muted-foreground" />
          Sales team performance
        </h3>
        {visibleRows.length === 0 ? (
          <CommandEmptyState
            title={filter ? `No salespeople in "${STATUS_LABEL[filter]}"` : "No salespeople yet"}
            hint={filter ? "Clear the filter to see everyone." : "Add team members under Sales Team."}
          />
        ) : (
          <ul className="divide-y divide-border/60">
            {visibleRows.map((r) => {
              const pct = r.target ? Math.min(999, Math.round((r.actual / r.target) * 100)) : null;
              const deltaPct = r.prev > 0 ? ((r.actual - r.prev) / r.prev) * 100 : null;
              const DeltaIcon =
                deltaPct === null ? Minus : Math.abs(deltaPct) < 0.5 ? Minus : deltaPct > 0 ? TrendingUp : TrendingDown;
              const deltaClass =
                deltaPct === null || Math.abs(deltaPct) < 0.5
                  ? "text-muted-foreground"
                  : deltaPct > 0
                    ? "text-success"
                    : "text-destructive";
              return (
                <li key={r.id} className="group relative">
                  <Link
                    to={`/salespersons/${r.id}#targets`}
                    className="block rounded-sm py-2.5 -mx-2 px-2 hover:bg-muted/40"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{r.name}</p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {r.region || "—"} · {r.ordersCount} order{r.ordersCount === 1 ? "" : "s"}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="num text-sm text-foreground">{formatCurrency(r.actual)}</p>
                        <div className="flex items-center justify-end gap-1.5 text-[11px] text-muted-foreground num">
                          {r.target ? (
                            <span>{pct}% of {formatCurrency(r.target)}</span>
                          ) : (
                            <Link
                              to={`/salespersons/${r.id}#targets`}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 text-primary hover:underline"
                            >
                              <TargetIcon className="h-3 w-3" /> Set target
                            </Link>
                          )}
                          <span className="text-muted-foreground/40">·</span>
                          <span className={cn("inline-flex items-center gap-0.5", deltaClass)}>
                            <DeltaIcon className="h-3 w-3" />
                            {deltaPct === null ? "—" : `${Math.abs(deltaPct).toFixed(0)}%`}
                            <span className="text-[10px] text-muted-foreground ml-0.5">vs prev</span>
                          </span>
                        </div>
                      </div>
                      <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide", STATUS_STYLES[r.status])}>
                        {STATUS_LABEL[r.status]}
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <AlarmClock className="h-4 w-4 text-warning" />
            Dormant dealers
          </h3>
          {computed.dormant.length > 0 && (
            <Link to="/distributors?filter=dormant" className="flex items-center gap-1 text-xs text-primary hover:underline">
              All <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </div>
        {computed.dormant.length === 0 ? (
          <CommandEmptyState title="No dormant dealers" hint="Every active dealer ordered this period." />
        ) : (
          <ul className="divide-y divide-border/60">
            {computed.dormant.map((d) => (
              <li key={d.id}>
                <Link to={`/distributors/${d.id}`} className="flex items-center justify-between gap-3 py-2.5 hover:bg-muted/40 rounded-sm px-1 -mx-1">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-foreground">{d.name}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{d.location || "—"}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">View dealer →</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
