import type { Order, Distributor } from "@/data/mock-data";

export type AgingBucket = "b0" | "b31" | "b61" | "b90";

export const BUCKET_RANK: Record<AgingBucket, number> = { b0: 0, b31: 1, b61: 2, b90: 3 };

export const BUCKET_LABEL: Record<AgingBucket, string> = {
  b0: "0–30 days",
  b31: "31–60 days",
  b61: "61–90 days",
  b90: "90+ days",
};

export const BUCKET_SHORT: Record<AgingBucket, string> = {
  b0: "0–30",
  b31: "31–60",
  b61: "61–90",
  b90: "90+",
};

/**
 * Tailwind tone tokens per bucket.
 * Brand placement (PR-A): 0-30 stays neutral, 31-60 is a soft warm hint,
 * 61-90 is the canonical Terracotta moment ("this needs you"), 90+ is
 * destructive. `leftBar` is consumed by row renderers to flag attention.
 */
export const BUCKET_TONE: Record<
  AgingBucket,
  { text: string; bg: string; segBg: string; badge: string; leftBar: string }
> = {
  b0: {
    text: "text-muted-foreground",
    bg: "bg-muted/40",
    segBg: "bg-muted-foreground/35",
    badge: "bg-muted text-muted-foreground border border-border",
    leftBar: "",
  },
  b31: {
    // Soft warm hint — not yet a brand moment, just a whisper.
    text: "text-foreground/75",
    bg: "bg-warning/5",
    segBg: "bg-warning/40",
    badge: "bg-warning/10 text-warning/90 border border-warning/20",
    leftBar: "",
  },
  b61: {
    // The canonical Terracotta moment. Wash + bar + bold text.
    text: "text-warning",
    bg: "bg-warning/12",
    segBg: "bg-warning/80",
    badge: "bg-warning/15 text-warning border border-warning/35",
    leftBar: "before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:bg-warning",
  },
  b90: {
    text: "text-destructive",
    bg: "bg-destructive/10",
    segBg: "bg-destructive/80",
    badge: "bg-destructive/15 text-destructive border border-destructive/30",
    leftBar: "before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:bg-destructive",
  },
};

export function bucketize(ageDays: number): AgingBucket {
  if (ageDays > 90) return "b90";
  if (ageDays > 60) return "b61";
  if (ageDays > 30) return "b31";
  return "b0";
}

/** Outstanding for a single order — net of scheme savings, never negative. */
export function orderOutstanding(o: Order): number {
  return Math.max(0, (o.total || 0) - (o.schemeSavings || 0));
}

/** Age in days from delivered_at (fallback: order date) to today. */
export function orderAgeDays(o: Order, today: Date = new Date()): number {
  const ref = o.deliveredAt
    ? new Date(o.deliveredAt)
    : new Date(o.date + "T00:00:00");
  return Math.max(0, Math.floor((today.getTime() - ref.getTime()) / 86400000));
}

export function isOutstandingOrder(o: Order): boolean {
  return (
    o.deliveryStatus === "delivered" &&
    (o.paymentStatus === "pending" || o.paymentStatus === "partial")
  );
}

export interface DealerAgingRow {
  distributorId: string;
  distributorName: string;
  creditLimit: number;
  bucket_0_30: number;
  bucket_31_60: number;
  bucket_61_90: number;
  bucket_90_plus: number;
  totalOutstanding: number;
  oldestAgeDays: number;
  worstBucket: AgingBucket | null;
  partialCount: number;
}

export interface OutstandingOrderRow {
  orderId: string;
  orderNumber: string;
  date: string;
  deliveredAt: string | null;
  paymentStatus: Order["paymentStatus"];
  outstanding: number;
  ageDays: number;
  bucket: AgingBucket;
  total: number;
}

export function outstandingOrdersForDealer(
  orders: Order[],
  distributorId: string,
  today: Date = new Date(),
): OutstandingOrderRow[] {
  return orders
    .filter((o) => o.distributorId === distributorId && isOutstandingOrder(o))
    .map((o) => {
      const ageDays = orderAgeDays(o, today);
      return {
        orderId: o.id,
        orderNumber: o.orderNumber,
        date: o.date,
        deliveredAt: o.deliveredAt ?? null,
        paymentStatus: o.paymentStatus,
        outstanding: orderOutstanding(o),
        ageDays,
        bucket: bucketize(ageDays),
        total: o.total,
      };
    })
    .sort((a, b) => b.ageDays - a.ageDays);
}

export function computeDealerAging(
  orders: Order[],
  distributors: Distributor[],
  today: Date = new Date(),
): DealerAgingRow[] {
  // Pre-bucket orders by distributor
  const byDealer = new Map<
    string,
    { b0: number; b31: number; b61: number; b90: number; oldest: number; partial: number }
  >();

  for (const o of orders) {
    if (!isOutstandingOrder(o)) continue;
    const amt = orderOutstanding(o);
    if (amt <= 0) continue;
    const age = orderAgeDays(o, today);
    const bucket = bucketize(age);
    const cur = byDealer.get(o.distributorId) ?? {
      b0: 0, b31: 0, b61: 0, b90: 0, oldest: 0, partial: 0,
    };
    cur[bucket] += amt;
    if (age > cur.oldest) cur.oldest = age;
    if (o.paymentStatus === "partial") cur.partial += 1;
    byDealer.set(o.distributorId, cur);
  }

  const rows: DealerAgingRow[] = [];
  for (const d of distributors) {
    const agg = byDealer.get(d.id);
    if (!agg) continue;
    const total = agg.b0 + agg.b31 + agg.b61 + agg.b90;
    if (total <= 0) continue;
    rows.push({
      distributorId: d.id,
      distributorName: d.name,
      creditLimit: d.creditLimit || 0,
      bucket_0_30: agg.b0,
      bucket_31_60: agg.b31,
      bucket_61_90: agg.b61,
      bucket_90_plus: agg.b90,
      totalOutstanding: total,
      oldestAgeDays: agg.oldest,
      worstBucket: bucketize(agg.oldest),
      partialCount: agg.partial,
    });
  }
  return rows;
}

/** Sort: worst bucket first, then largest outstanding. */
export function sortByRisk(rows: DealerAgingRow[]): DealerAgingRow[] {
  return [...rows].sort((a, b) => {
    const ra = a.worstBucket ? BUCKET_RANK[a.worstBucket] : -1;
    const rb = b.worstBucket ? BUCKET_RANK[b.worstBucket] : -1;
    if (rb !== ra) return rb - ra;
    return b.totalOutstanding - a.totalOutstanding;
  });
}
