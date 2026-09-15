// Aging buckets and dealer risk ordering. Balances themselves come from lib/receivables.ts.

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

/** Sort: worst bucket first, then largest outstanding. */
export function sortByRisk(rows: DealerAgingRow[]): DealerAgingRow[] {
  return [...rows].sort((a, b) => {
    const ra = a.worstBucket ? BUCKET_RANK[a.worstBucket] : -1;
    const rb = b.worstBucket ? BUCKET_RANK[b.worstBucket] : -1;
    if (rb !== ra) return rb - ra;
    return b.totalOutstanding - a.totalOutstanding;
  });
}
