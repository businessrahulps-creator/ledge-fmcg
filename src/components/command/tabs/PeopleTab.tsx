import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useApi } from "@/services/api";
import { Card } from "@/components/ui/card";
import { CommandEmptyState } from "../CommandEmptyState";
import { CardSkeleton } from "../CommandSkeleton";
import { formatCurrency } from "@/data/mock-data";
import { ArrowRight, UserCheck, AlarmClock } from "lucide-react";
import { ordersInPeriod, type PeriodRange } from "@/lib/command-signals";

interface Props {
  range: PeriodRange;
}

type Status = "ontrack" | "atrisk" | "behind";

function statusFor(actual: number, target: number): Status {
  if (!target) return "ontrack";
  const ratio = actual / target;
  if (ratio >= 0.85) return "ontrack";
  if (ratio >= 0.5) return "atrisk";
  return "behind";
}

const STATUS_LABEL: Record<Status, string> = {
  ontrack: "On track",
  atrisk: "At risk",
  behind: "Behind",
};

const STATUS_STYLES: Record<Status, string> = {
  ontrack: "bg-success/10 text-success",
  atrisk: "bg-warning/10 text-warning",
  behind: "bg-destructive/10 text-destructive",
};

export function PeopleTab({ range }: Props) {
  const api = useApi();
  const loading = api.loading;
  const salespersons = api.salespersons.list();
  const orders = api.orders.list();
  const distributors = api.dealers.list();
  const targets = api.targets.list();

  const computed = useMemo(() => {
    const periodOrders = ordersInPeriod(orders, range);
    const revBy = new Map<string, number>();
    const ordBy = new Map<string, number>();
    for (const o of periodOrders) {
      revBy.set(o.salespersonId, (revBy.get(o.salespersonId) || 0) + (o.total || 0));
      ordBy.set(o.salespersonId, (ordBy.get(o.salespersonId) || 0) + 1);
    }

    const rows = salespersons.map((s) => {
      const actual = revBy.get(s.id) || 0;
      const target = targets.find((t) => t.entityId === s.id && t.entityType === "salesperson")?.targetRevenue || 0;
      return {
        ...s,
        actual,
        target,
        ordersCount: ordBy.get(s.id) || 0,
        status: statusFor(actual, target),
      };
    }).sort((a, b) => b.actual - a.actual);

    const counts = { ontrack: 0, atrisk: 0, behind: 0 } as Record<Status, number>;
    rows.forEach((r) => { counts[r.status]++; });

    // Dormant dealers: had history, no orders in period
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

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Team summary strip */}
      <div className="flex flex-wrap items-center gap-2">
        {(["ontrack", "atrisk", "behind"] as Status[]).map((s) => (
          <span key={s} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLES[s]}`}>
            <span className="num">{computed.counts[s]}</span> {STATUS_LABEL[s]}
          </span>
        ))}
      </div>

      <Card className="p-4">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
          <UserCheck className="h-4 w-4 text-muted-foreground" />
          Sales team performance
        </h3>
        {computed.rows.length === 0 ? (
          <CommandEmptyState title="No salespeople yet" hint="Add team members under Sales Team." />
        ) : (
          <ul className="divide-y divide-border/60">
            {computed.rows.map((r) => {
              const pct = r.target ? Math.min(999, Math.round((r.actual / r.target) * 100)) : null;
              return (
                <li key={r.id}>
                  <Link to={`/salespersons/${r.id}#targets`} className="block rounded-sm py-2.5 -mx-2 px-2 hover:bg-muted/40">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{r.name}</p>
                        <p className="truncate text-[11px] text-muted-foreground">{r.region || "—"} · {r.ordersCount} orders</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="num text-sm text-foreground">{formatCurrency(r.actual)}</p>
                        <p className="text-[11px] text-muted-foreground num">
                          {r.target ? `${pct}% of ${formatCurrency(r.target)}` : "No target set"}
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_STYLES[r.status]}`}>
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
