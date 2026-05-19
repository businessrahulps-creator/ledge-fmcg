import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Package, Truck, FileWarning, ShoppingCart } from "lucide-react";
import { formatCurrency } from "@/data/mock-data";
import type { Order } from "@/data/mock-data";
import type { Claim } from "@/context/DataContext";
import { cn } from "@/lib/utils";

interface Props {
  orders: Order[];
  claims: Claim[];
  /** Hours of history to show. Default 48. */
  windowHours?: number;
}

type FeedItem = {
  id: string;
  ts: number;
  icon: typeof ShoppingCart;
  tone: string;
  label: string;
  message: string;
  href: string;
};

function safeTime(s: string | null | undefined): number {
  if (!s) return 0;
  const t = new Date(s).getTime();
  return Number.isFinite(t) ? t : 0;
}

function timeAgoShort(ts: number): string {
  const mins = Math.max(0, Math.floor((Date.now() - ts) / 60000));
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export function ActivityFeed({ orders, claims, windowHours = 48 }: Props) {
  const cutoff = Date.now() - windowHours * 3600_000;
  const items: FeedItem[] = [];

  for (const o of orders) {
    const placedTs = safeTime(o.date);
    if (placedTs >= cutoff) {
      items.push({
        id: `order-${o.id}`,
        ts: placedTs,
        icon: ShoppingCart,
        tone: "text-foreground",
        label: "Order placed",
        message: `${o.distributorName} · ${formatCurrency(o.total)}`,
        href: `/orders/${o.id}`,
      });
    }
    const dispatchedTs = safeTime(o.dispatchDate);
    if (dispatchedTs >= cutoff && (o.deliveryStatus === "dispatched" || o.deliveryStatus === "delivered")) {
      items.push({
        id: `dispatch-${o.id}`,
        ts: dispatchedTs,
        icon: Truck,
        tone: "text-foreground",
        label: "Dispatched",
        message: `${o.distributorName} · ${o.vehicle || "vehicle pending"}`,
        href: `/orders/${o.id}`,
      });
    }
    const deliveredTs = safeTime(o.deliveredAt);
    if (deliveredTs >= cutoff && o.deliveryStatus === "delivered") {
      items.push({
        id: `delivered-${o.id}`,
        ts: deliveredTs,
        icon: Package,
        tone: "text-foreground",
        label: "Delivered",
        message: `${o.distributorName}`,
        href: `/orders/${o.id}`,
      });
    }
    if (o.paymentStatus === "paid" && deliveredTs >= cutoff) {
      items.push({
        id: `paid-${o.id}`,
        ts: deliveredTs,
        icon: CheckCircle2,
        tone: "text-success",
        label: "Payment received",
        message: `${o.distributorName} · ${formatCurrency(o.total)}`,
        href: `/orders/${o.id}`,
      });
    }
  }

  for (const c of claims) {
    const ts = safeTime(c.createdAt);
    if (ts >= cutoff) {
      items.push({
        id: `claim-${c.id}`,
        ts,
        icon: FileWarning,
        tone: "text-warning",
        label: "Claim raised",
        message: `${c.distributorName || "Dealer"} · ${formatCurrency(c.totalClaimValue || 0)}`,
        href: "/claims",
      });
    }
  }

  items.sort((a, b) => b.ts - a.ts);
  const top = items.slice(0, 8);

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Recent activity</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">Last {windowHours} hours</p>
        </div>
        {top.length > 0 && (
          <Link to="/orders" className="text-xs font-medium text-muted-foreground hover:text-foreground">
            View all
          </Link>
        )}
      </div>

      {top.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">No activity in the last {windowHours} hours.</p>
      ) : (
        <ul className="space-y-2">
          {top.map((it) => {
            const Icon = it.icon;
            return (
              <li key={it.id}>
                <Link
                  to={it.href}
                  className="flex items-start gap-3 rounded-md px-2 py-1.5 transition-colors hover:bg-muted/40"
                >
                  <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", it.tone)} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      {it.label}
                    </p>
                    <p className="truncate text-sm text-foreground">{it.message}</p>
                  </div>
                  <span className="num shrink-0 text-[11px] text-muted-foreground">{timeAgoShort(it.ts)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
