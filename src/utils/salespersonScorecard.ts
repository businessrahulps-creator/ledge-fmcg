import type { Order } from "@/data/mock-data";

export type PerformanceHealth = "high" | "medium" | "low";

export interface SalespersonScorecard {
  orders30d: number;
  orders60d: number;
  orders90d: number;
  ordersPrev30d: number;
  totalRevenue: number;
  totalRevenue30d: number;
  avgOrderValue: number;
  orderFrequency: number; // orders per week over 90d
  paymentCollectionEfficiency: number; // 0-100
  daysSinceLastOrder: number | null;
}

export function getPerformanceHealth(spOrders: Order[]): PerformanceHealth {
  if (spOrders.length === 0) return "low";
  const now = new Date();
  const sorted = [...spOrders].sort((a, b) => b.date.localeCompare(a.date));
  const daysSince = (now.getTime() - new Date(sorted[0].date + "T00:00:00").getTime()) / 86400000;
  const paidPct = (spOrders.filter(o => o.paymentStatus === "paid").length / spOrders.length) * 100;

  if (daysSince <= 30 && paidPct >= 60) return "high";
  if (daysSince <= 60 && paidPct >= 30) return "medium";
  return "low";
}

export function getPerformanceInsight(health: PerformanceHealth, sc: SalespersonScorecard): string {
  if (health === "high") {
    if (sc.paymentCollectionEfficiency >= 80) return "Consistent performer — strong sales and payment collection";
    return "Strong closer but payment collection needs improvement";
  }
  if (health === "medium") {
    if (sc.orders30d > 0 && sc.paymentCollectionEfficiency < 40) return "Active seller but slow payment collection";
    if (sc.orders30d === 0 && sc.ordersPrev30d > 0) return "Recent slowdown — was active last month";
    return "Moderate activity — room for improvement";
  }
  if (sc.daysSinceLastOrder !== null && sc.daysSinceLastOrder > 60) return "Needs attention — no recent activity";
  return "Low activity — needs support and motivation";
}

export function buildSalespersonScorecard(spOrders: Order[]): SalespersonScorecard {
  const now = new Date();
  const d30 = new Date(now); d30.setDate(d30.getDate() - 30);
  const d60 = new Date(now); d60.setDate(d60.getDate() - 60);
  const d90 = new Date(now); d90.setDate(d90.getDate() - 90);

  const inWindow = (o: Order, from: Date) => new Date(o.date + "T00:00:00") >= from;
  const inRange = (o: Order, from: Date, to: Date) => {
    const d = new Date(o.date + "T00:00:00");
    return d >= from && d < to;
  };

  const last30 = spOrders.filter(o => inWindow(o, d30));
  const last60 = spOrders.filter(o => inWindow(o, d60));
  const last90 = spOrders.filter(o => inWindow(o, d90));
  const prev30 = spOrders.filter(o => inRange(o, d60, d30));

  const effectiveTotal = (o: Order) => o.total - (o.schemeSavings || 0);

  const totalRevenue = spOrders.reduce((s, o) => s + effectiveTotal(o), 0);
  const totalRevenue30d = last30.reduce((s, o) => s + effectiveTotal(o), 0);
  const avgOrderValue = spOrders.length > 0 ? totalRevenue / spOrders.length : 0;
  const orderFrequency = last90.length > 0 ? +(last90.length / (90 / 7)).toFixed(1) : 0;

  const paidCount = spOrders.filter(o => o.paymentStatus === "paid").length;
  const paymentCollectionEfficiency = spOrders.length > 0 ? (paidCount / spOrders.length) * 100 : 0;

  let daysSinceLastOrder: number | null = null;
  if (spOrders.length > 0) {
    const sorted = [...spOrders].sort((a, b) => b.date.localeCompare(a.date));
    daysSinceLastOrder = Math.max(0, Math.floor((now.getTime() - new Date(sorted[0].date + "T00:00:00").getTime()) / 86400000));
  }

  return {
    orders30d: last30.length,
    orders60d: last60.length,
    orders90d: last90.length,
    ordersPrev30d: prev30.length,
    totalRevenue,
    totalRevenue30d,
    avgOrderValue,
    orderFrequency,
    paymentCollectionEfficiency,
    daysSinceLastOrder,
  };
}

export const performanceHealthConfig: Record<PerformanceHealth, { label: string; color: string; bg: string; dot: string }> = {
  high: {
    label: "High Performer",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10",
    dot: "bg-emerald-500",
  },
  medium: {
    label: "Moderate",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10",
    dot: "bg-amber-500",
  },
  low: {
    label: "Needs Attention",
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-500/10",
    dot: "bg-red-500",
  },
};
