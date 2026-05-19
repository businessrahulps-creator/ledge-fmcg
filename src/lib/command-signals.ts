/**
 * Command surface — period helpers + signal derivation engine.
 *
 * Pure functions over DataContext domain shapes. No fetches, no side effects.
 * Recomputed by callers when the period changes.
 */
import type { Order, Distributor, Salesperson, Product } from "@/data/mock-data";
import type { Target } from "@/context/DataContext";

export type CommandPeriod = "today" | "7d" | "30d" | "90d" | "ytd" | "custom";

export const PERIOD_LABELS: Record<CommandPeriod, string> = {
  today: "Today",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  ytd: "Year to date",
  custom: "Custom",
};

export interface PeriodRange {
  from: Date;
  to: Date;
  /** Previous comparable window of equal length (used for deltas). */
  prevFrom: Date;
  prevTo: Date;
}

export function getPeriodRange(period: CommandPeriod, customFrom?: string, customTo?: string): PeriodRange {
  const now = new Date();
  const to = new Date(now);
  const from = new Date(now);

  switch (period) {
    case "today":
      from.setHours(0, 0, 0, 0);
      break;
    case "7d":
      from.setDate(now.getDate() - 7);
      break;
    case "30d":
      from.setDate(now.getDate() - 30);
      break;
    case "90d":
      from.setDate(now.getDate() - 90);
      break;
    case "ytd":
      from.setMonth(0, 1);
      from.setHours(0, 0, 0, 0);
      break;
    case "custom":
      if (customFrom) from.setTime(new Date(customFrom).getTime());
      if (customTo) to.setTime(new Date(customTo).getTime());
      break;
  }

  const span = to.getTime() - from.getTime();
  const prevTo = new Date(from);
  const prevFrom = new Date(from.getTime() - span);
  return { from, to, prevFrom, prevTo };
}

/** Revenue from dispatched/delivered orders only (the only "real" money number). */
export function dispatchedRevenue(orders: Order[], range: PeriodRange): number {
  return orders.reduce((sum, o) => {
    if (o.deliveryStatus !== "dispatched" && o.deliveryStatus !== "delivered") return sum;
    const ref = o.dispatchDate ? new Date(o.dispatchDate) : new Date(o.date);
    if (ref < range.from || ref > range.to) return sum;
    return sum + (o.total || 0);
  }, 0);
}

export function ordersInPeriod(orders: Order[], range: PeriodRange): Order[] {
  return orders.filter((o) => {
    const d = new Date(o.date);
    return d >= range.from && d <= range.to;
  });
}

export function collectionsInPeriod(orders: Order[], range: PeriodRange): number {
  return ordersInPeriod(orders, range).reduce(
    (sum, o) => (o.paymentStatus === "paid" ? sum + (o.total || 0) : sum),
    0,
  );
}

export function outstandingTotal(distributors: Distributor[]): number {
  return distributors.reduce((s, d) => s + (d.outstandingAmount || 0), 0);
}

// ──────────────────────────────────────────────────────────────────────────────
// Signal engine

export type SignalTier = "destructive" | "warning" | "success" | "neutral";

export interface CommandSignal {
  id: string;
  tier: SignalTier;
  /** ALL-CAPS chip label. */
  label: string;
  /** Plain-English headline. */
  message: string;
  /** Pre-filtered deep link. Owner lands exactly where the fix is. */
  href: string;
  /** Short CTA verb. */
  cta: string;
  /** Optional hero number. */
  value?: string | number;
}

export interface SignalContext {
  orders: Order[];
  distributors: Distributor[];
  salespersons: Salesperson[];
  targets: Target[];
  range: PeriodRange;
}

export function deriveSignals(ctx: SignalContext): CommandSignal[] {
  const out: CommandSignal[] = [];
  const { orders, distributors, salespersons, range } = ctx;

  // 1. Credit at risk — distributors at >=90% credit utilisation.
  const overdue = distributors.filter(
    (d) => d.creditLimit > 0 && d.outstandingAmount / d.creditLimit >= 0.9,
  );
  if (overdue.length > 0) {
    out.push({
      id: "credit-risk",
      tier: "destructive",
      label: "AT RISK",
      message: `${overdue.length} dealer${overdue.length === 1 ? "" : "s"} over 90% credit limit`,
      href: "/distributors?filter=overdue",
      cta: "Review",
      value: overdue.length,
    });
  }

  // 2. Dormant dealers — no order in selected period AND they have history.
  const lastOrderByDealer = new Map<string, Date>();
  for (const o of orders) {
    const d = new Date(o.date);
    const cur = lastOrderByDealer.get(o.distributorId);
    if (!cur || d > cur) lastOrderByDealer.set(o.distributorId, d);
  }
  const dormant = distributors.filter((d) => {
    if (d.totalOrders === 0) return false;
    const last = lastOrderByDealer.get(d.id);
    return !last || last < range.from;
  });
  if (dormant.length > 0) {
    out.push({
      id: "dormant",
      tier: "warning",
      label: "DORMANT",
      message: `${dormant.length} dealer${dormant.length === 1 ? "" : "s"} stopped ordering this period`,
      href: "/distributors?filter=dormant",
      cta: "Open list",
      value: dormant.length,
    });
  }

  // 3. Salesperson behind target — current period revenue vs proportional target.
  const periodOrders = ordersInPeriod(orders, range);
  const revBySp = new Map<string, number>();
  for (const o of periodOrders) revBySp.set(o.salespersonId, (revBySp.get(o.salespersonId) || 0) + (o.total || 0));
  const behind = salespersons.filter((s) => {
    const target = ctx.targets.find((t) => t.entityId === s.id && t.entityType === "salesperson");
    if (!target || !target.targetRevenue) return false;
    const actual = revBySp.get(s.id) || 0;
    return actual / target.targetRevenue < 0.5; // < 50% of period target
  });
  if (behind.length > 0) {
    const first = behind[0];
    out.push({
      id: "behind-target",
      tier: "warning",
      label: "BEHIND TARGET",
      message:
        behind.length === 1
          ? `${first.name} is behind target`
          : `${behind.length} salespeople are behind target`,
      href: behind.length === 1 ? `/salespersons/${first.id}#targets` : "/salespersons?status=behind",
      cta: "Open",
      value: behind.length,
    });
  }

  // Build per-dealer revenue this period (used by combined signals + winner).
  const revByDealer = new Map<string, number>();
  for (const o of periodOrders) revByDealer.set(o.distributorId, (revByDealer.get(o.distributorId) || 0) + (o.total || 0));

  // 4. COMBINED: Dormant + Outstanding — silent and still owes money.
  const dormantOwing = dormant.filter((d) => (d.outstandingAmount || 0) > 0);
  if (dormantOwing.length > 0) {
    const exposure = dormantOwing.reduce((s, d) => s + (d.outstandingAmount || 0), 0);
    out.push({
      id: "dormant-owing",
      tier: "destructive",
      label: "SILENT & OWING",
      message: `${dormantOwing.length} dormant dealer${dormantOwing.length === 1 ? "" : "s"} owe ₹${Math.round(exposure).toLocaleString("en-IN")}`,
      href: "/distributors?filter=dormant-owing",
      cta: "Chase",
      value: dormantOwing.length,
    });
  }

  // 5. COMBINED: Credit-blocked top dealer — best customer is maxed out.
  const topEntry = [...revByDealer.entries()].sort((a, b) => b[1] - a[1])[0];
  if (topEntry) {
    const topDealer = distributors.find((d) => d.id === topEntry[0]);
    if (topDealer && topDealer.creditLimit > 0 && topDealer.outstandingAmount / topDealer.creditLimit >= 0.9) {
      out.push({
        id: "top-blocked",
        tier: "destructive",
        label: "TOP DEALER BLOCKED",
        message: `${topDealer.name} leads sales but is over 90% credit`,
        href: `/distributors/${topDealer.id}`,
        cta: "Resolve",
      });
    }
  }

  // 6. COMBINED: Declining territory — salesperson revenue dropped >30% vs prev window.
  const prevRange: PeriodRange = {
    from: range.prevFrom,
    to: range.prevTo,
    prevFrom: range.prevFrom,
    prevTo: range.prevTo,
  };
  const prevOrders = ordersInPeriod(orders, prevRange);
  const prevBySp = new Map<string, number>();
  for (const o of prevOrders) prevBySp.set(o.salespersonId, (prevBySp.get(o.salespersonId) || 0) + (o.total || 0));
  const declining = salespersons
    .map((s) => {
      const prev = prevBySp.get(s.id) || 0;
      const curr = revBySp.get(s.id) || 0;
      if (prev < 1) return null;
      const drop = (prev - curr) / prev;
      return drop > 0.3 ? { sp: s, drop } : null;
    })
    .filter((x): x is { sp: Salesperson; drop: number } => !!x)
    .sort((a, b) => b.drop - a.drop);
  if (declining.length > 0) {
    const worst = declining[0];
    out.push({
      id: "declining-territory",
      tier: "warning",
      label: "TERRITORY DECLINING",
      message:
        declining.length === 1
          ? `${worst.sp.name}'s territory is down ${Math.round(worst.drop * 100)}%`
          : `${declining.length} territories down vs last period`,
      href:
        declining.length === 1
          ? `/salespersons/${worst.sp.id}#targets`
          : "/salespersons?status=declining",
      cta: "Open",
      value: declining.length,
    });
  }

  // 7. COMBINED: Scheme cannibalisation — discounts eating >25% of gross.
  const periodRevenue = periodOrders.reduce((s, o) => s + (o.total || 0), 0);
  const periodSavings = periodOrders.reduce((s, o) => s + (o.schemeSavings || 0), 0);
  if (periodRevenue > 0 && periodSavings / (periodRevenue + periodSavings) > 0.25) {
    const pct = Math.round((periodSavings / (periodRevenue + periodSavings)) * 100);
    out.push({
      id: "scheme-cannibalisation",
      tier: "warning",
      label: "SCHEMES TOO DEEP",
      message: `Discounts ate ${pct}% of gross sales this period`,
      href: "/schemes",
      cta: "Review",
      value: `${pct}%`,
    });
  }

  // 8. Wins — top dealer (only if not already flagged as blocked).
  if (topEntry && !out.some((s) => s.id === "top-blocked")) {
    const dealer = distributors.find((d) => d.id === topEntry[0]);
    if (dealer) {
      out.push({
        id: "top-dealer",
        tier: "success",
        label: "TOP DEALER",
        message: `${dealer.name} leads this period`,
        href: `/distributors/${dealer.id}`,
        cta: "View",
      });
    }
  }

  // Sort: destructive → warning → success → neutral. Cap to 6.
  const tierWeight: Record<SignalTier, number> = { destructive: 0, warning: 1, success: 2, neutral: 3 };
  return out.sort((a, b) => tierWeight[a.tier] - tierWeight[b.tier]).slice(0, 6);
}

// ──────────────────────────────────────────────────────────────────────────────
// Time-series helpers for the trend chart

export interface TrendPoint {
  date: string;
  label: string;
  actual: number;
  target: number;
}

export function buildRevenueTrend(
  orders: Order[],
  targets: Target[],
  range: PeriodRange,
  buckets = 12,
): TrendPoint[] {
  const span = range.to.getTime() - range.from.getTime();
  const bucketSize = span / buckets;
  const points: TrendPoint[] = [];

  // Total target across all salesperson targets active in range, distributed evenly.
  const totalTarget = targets
    .filter((t) => t.entityType === "salesperson")
    .reduce((s, t) => s + (t.targetRevenue || 0), 0);
  const perBucketTarget = totalTarget / buckets;

  for (let i = 0; i < buckets; i++) {
    const from = new Date(range.from.getTime() + bucketSize * i);
    const to = new Date(range.from.getTime() + bucketSize * (i + 1));
    let actual = 0;
    for (const o of orders) {
      if (o.deliveryStatus !== "dispatched" && o.deliveryStatus !== "delivered") continue;
      const ref = o.dispatchDate ? new Date(o.dispatchDate) : new Date(o.date);
      if (ref >= from && ref < to) actual += o.total || 0;
    }
    points.push({
      date: from.toISOString(),
      label: from.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
      actual,
      target: perBucketTarget,
    });
  }
  return points;
}

export function pctDelta(curr: number, prev: number): number | null {
  if (!prev) return null;
  return ((curr - prev) / prev) * 100;
}
