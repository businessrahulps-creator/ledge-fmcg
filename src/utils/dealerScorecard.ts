import type { Order } from "@/data/mock-data";

export type ChurnRisk = "low" | "medium" | "high";

export interface DealerScorecard {
  orders30d: number;
  orders60d: number;
  orders90d: number;
  ordersPrev30d: number;
  totalValue30d: number;
  totalValue90d: number;
  avgOrderValue: number;
  paymentTimeliness: number; // 0-100
  churnRisk: ChurnRisk;
  daysSinceLastOrder: number | null;
}

export function getChurnRisk(dealerOrders: Order[]): ChurnRisk {
  if (dealerOrders.length === 0) return "high";
  const now = new Date();
  const sorted = [...dealerOrders].sort((a, b) => b.date.localeCompare(a.date));
  const daysSinceLastOrder = (now.getTime() - new Date(sorted[0].date + "T00:00:00").getTime()) / 86400000;
  const paidPct = (dealerOrders.filter(o => o.paymentStatus === "paid").length / dealerOrders.length) * 100;

  if (daysSinceLastOrder <= 30 && paidPct >= 60) return "low";
  if (daysSinceLastOrder <= 60 && paidPct >= 30) return "medium";
  return "high";
}

export function buildScorecard(dealerOrders: Order[]): DealerScorecard {
  const now = new Date();
  const d30 = new Date(now); d30.setDate(d30.getDate() - 30);
  const d60 = new Date(now); d60.setDate(d60.getDate() - 60);
  const d90 = new Date(now); d90.setDate(d90.getDate() - 90);

  const inWindow = (o: Order, from: Date) => new Date(o.date + "T00:00:00") >= from;
  const inRange = (o: Order, from: Date, to: Date) => {
    const d = new Date(o.date + "T00:00:00");
    return d >= from && d < to;
  };

  const last30 = dealerOrders.filter(o => inWindow(o, d30));
  const last60 = dealerOrders.filter(o => inWindow(o, d60));
  const last90 = dealerOrders.filter(o => inWindow(o, d90));
  const prev30 = dealerOrders.filter(o => inRange(o, d60, d30));

  const totalValue30d = last30.reduce((s, o) => s + o.total, 0);
  const totalValue90d = last90.reduce((s, o) => s + o.total, 0);
  const avgOrderValue = dealerOrders.length > 0
    ? dealerOrders.reduce((s, o) => s + o.total, 0) / dealerOrders.length
    : 0;

  const paidCount = dealerOrders.filter(o => o.paymentStatus === "paid").length;
  const paymentTimeliness = dealerOrders.length > 0 ? (paidCount / dealerOrders.length) * 100 : 0;

  let daysSinceLastOrder: number | null = null;
  if (dealerOrders.length > 0) {
    const sorted = [...dealerOrders].sort((a, b) => b.date.localeCompare(a.date));
    daysSinceLastOrder = Math.max(0, Math.floor((now.getTime() - new Date(sorted[0].date + "T00:00:00").getTime()) / 86400000));
  }

  return {
    orders30d: last30.length,
    orders60d: last60.length,
    orders90d: last90.length,
    ordersPrev30d: prev30.length,
    totalValue30d,
    totalValue90d,
    avgOrderValue,
    paymentTimeliness,
    churnRisk: getChurnRisk(dealerOrders),
    daysSinceLastOrder,
  };
}

export const churnRiskConfig: Record<ChurnRisk, { label: string; color: string; bg: string; dot: string }> = {
  low: {
    label: "Low Risk",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10",
    dot: "bg-emerald-500",
  },
  medium: {
    label: "Medium Risk",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10",
    dot: "bg-amber-500",
  },
  high: {
    label: "High Risk",
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-500/10",
    dot: "bg-red-500",
  },
};
