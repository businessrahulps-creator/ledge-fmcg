import { memo } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/data/mock-data";
import { BUCKET_TONE, computeDealerAging, type AgingBucket } from "@/lib/aging";
import type { Order, Distributor } from "@/data/mock-data";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

interface Props {
  orders: Order[];
  distributors: Distributor[];
}

const BUCKETS: { key: AgingBucket; label: string; field: keyof ReturnType<typeof rowField>; href: string }[] = [
  { key: "b0", label: "0–30 days", field: "bucket_0_30", href: "/distributors?filter=outstanding&age=0-30" },
  { key: "b31", label: "31–60 days", field: "bucket_31_60", href: "/distributors?filter=outstanding&age=31-60" },
  { key: "b61", label: "61–90 days", field: "bucket_61_90", href: "/distributors?filter=outstanding&age=61-90" },
  { key: "b90", label: "90+ days", field: "bucket_90_plus", href: "/distributors?filter=outstanding&age=90plus" },
];

function rowField() {
  return { bucket_0_30: 0, bucket_31_60: 0, bucket_61_90: 0, bucket_90_plus: 0 };
}

function AgingStripInner({ orders, distributors }: Props) {
  const rows = computeDealerAging(orders, distributors);
  const totals = rows.reduce(
    (acc, r) => ({
      bucket_0_30: acc.bucket_0_30 + r.bucket_0_30,
      bucket_31_60: acc.bucket_31_60 + r.bucket_31_60,
      bucket_61_90: acc.bucket_61_90 + r.bucket_61_90,
      bucket_90_plus: acc.bucket_90_plus + r.bucket_90_plus,
    }),
    rowField(),
  );
  const dealerCounts = BUCKETS.reduce<Record<AgingBucket, number>>(
    (acc, b) => {
      acc[b.key] = rows.filter((r) => r[b.field] > 0).length;
      return acc;
    },
    { b0: 0, b31: 0, b61: 0, b90: 0 },
  );

  const grandTotal =
    totals.bucket_0_30 + totals.bucket_31_60 + totals.bucket_61_90 + totals.bucket_90_plus;

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Outstanding by age</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {grandTotal > 0
              ? `Total ${formatCurrency(grandTotal)} across ${rows.length} dealer${rows.length === 1 ? "" : "s"}.`
              : "No outstanding balances right now."}
          </p>
        </div>
      </div>

      {grandTotal === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">All caught up.</p>
      ) : (
        <>
          {/* Stacked proportional bar */}
          <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted/50">
            {BUCKETS.map((b) => {
              const v = totals[b.field];
              if (v === 0) return null;
              const pct = (v / grandTotal) * 100;
              return (
                <div
                  key={b.key}
                  className={cn("h-full transition-[width] duration-500", BUCKET_TONE[b.key].segBg)}
                  style={{ width: `${pct}%` }}
                  title={`${b.label}: ${formatCurrency(v)}`}
                />
              );
            })}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
            {BUCKETS.map((b) => {
              const v = totals[b.field];
              const count = dealerCounts[b.key];
              const tone = BUCKET_TONE[b.key];
              return (
                <Link
                  key={b.key}
                  to={b.href}
                  className={cn(
                    "group flex flex-col rounded-md border border-border/60 px-3 py-2.5 transition-colors hover:bg-muted/40",
                    v > 0 ? tone.bg : "bg-muted/20",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className={cn("text-[10px] font-semibold uppercase tracking-[0.14em]", v > 0 ? tone.text : "text-muted-foreground")}>
                      {b.label}
                    </span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                  <span className="num mt-1 text-base font-semibold text-foreground tabular-nums truncate">
                    {formatCurrency(v)}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {count} dealer{count === 1 ? "" : "s"}
                  </span>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </Card>
  );
}

export const AgingStrip = memo(AgingStripInner);
