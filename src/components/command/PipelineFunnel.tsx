import { memo } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/data/mock-data";
import type { Order } from "@/data/mock-data";
import { cn } from "@/lib/utils";

interface Props {
  orders: Order[];
}

interface Stage {
  key: string;
  label: string;
  count: number;
  value: number;
  href: string;
  tone: string;
}

function PipelineFunnelInner({ orders }: Props) {
  // Confirmed = pending delivery; Dispatched; Delivered (unpaid); Invoiced (partial); Collected (paid)
  const buckets = {
    confirmed: { count: 0, value: 0 },
    dispatched: { count: 0, value: 0 },
    delivered: { count: 0, value: 0 },
    invoiced: { count: 0, value: 0 },
    collected: { count: 0, value: 0 },
  };

  for (const o of orders) {
    const v = o.total || 0;
    if (o.paymentStatus === "paid") {
      buckets.collected.count++;
      buckets.collected.value += v;
      continue;
    }
    if (o.paymentStatus === "partial") {
      buckets.invoiced.count++;
      buckets.invoiced.value += v;
      continue;
    }
    if (o.deliveryStatus === "delivered") {
      buckets.delivered.count++;
      buckets.delivered.value += v;
    } else if (o.deliveryStatus === "dispatched") {
      buckets.dispatched.count++;
      buckets.dispatched.value += v;
    } else {
      buckets.confirmed.count++;
      buckets.confirmed.value += v;
    }
  }

  const stages: Stage[] = [
    { key: "confirmed", label: "Confirmed", ...buckets.confirmed, href: "/orders?status=pending", tone: "bg-muted-foreground/35" },
    { key: "dispatched", label: "Dispatched", ...buckets.dispatched, href: "/orders?status=dispatched", tone: "bg-primary/40" },
    { key: "delivered", label: "Delivered", ...buckets.delivered, href: "/orders?status=delivered", tone: "bg-primary/60" },
    { key: "invoiced", label: "Partial pay", ...buckets.invoiced, href: "/orders?filter=partial", tone: "bg-warning/70" },
    { key: "collected", label: "Collected", ...buckets.collected, href: "/orders?filter=paid", tone: "bg-success/80" },
  ];

  const maxValue = Math.max(1, ...stages.map((s) => s.value));
  const totalCount = stages.reduce((s, x) => s + x.count, 0);

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Order pipeline</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {totalCount > 0
              ? `${totalCount} order${totalCount === 1 ? "" : "s"} across the pipeline`
              : "No orders in the pipeline yet"}
          </p>
        </div>
      </div>

      {totalCount === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">Logged orders will appear here as they progress.</p>
      ) : (
        <div className="space-y-2">
          {stages.map((s) => {
            const pct = s.value > 0 ? (s.value / maxValue) * 100 : 0;
            return (
              <Link
                key={s.key}
                to={s.href}
                className="group block rounded-md px-2 py-1 transition-colors hover:bg-muted/40"
              >
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="font-medium text-foreground">{s.label}</span>
                  <span className="num shrink-0 text-muted-foreground">
                    {s.count} · {formatCurrency(s.value)}
                  </span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted/50">
                  <div
                    className={cn("h-full transition-[width] duration-500", s.tone)}
                    style={{ width: `${Math.max(pct, s.value > 0 ? 4 : 0)}%` }}
                  />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </Card>
  );
}

export const PipelineFunnel = memo(PipelineFunnelInner);
