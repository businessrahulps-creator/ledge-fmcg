import { useMemo } from "react";
import { useApi } from "@/services/api";
import { formatCurrency } from "@/data/mock-data";
import { CommandKpiCard } from "../CommandKpiCard";
import { CommandLineChart } from "../CommandLineChart";
import { LeaderboardCard } from "../LeaderboardCard";
import { CreditAtRiskCard } from "../CreditAtRiskCard";
import { HeroBand } from "../HeroBand";
import { AgingStrip } from "../AgingStrip";
import { ActivityFeed } from "../ActivityFeed";
import { PipelineFunnel } from "../PipelineFunnel";
import { RunRatePill } from "../RunRatePill";
import { KpiRowSkeleton, ChartSkeleton, CardSkeleton } from "../CommandSkeleton";
import { Card } from "@/components/ui/card";
import { Users, Package } from "lucide-react";
import {
  buildRevenueTrend,
  collectionsInPeriod,
  dispatchedRevenue,
  ordersInPeriod,
  outstandingTotal,
  pctDelta,
  PERIOD_LABELS,
  type CommandPeriod,
  type PeriodRange,
} from "@/lib/command-signals";

interface Props {
  range: PeriodRange;
  period?: CommandPeriod;
}

export function OverviewTab({ range, period = "30d" }: Props) {
  const api = useApi();
  const loading = api.loading;
  const orders = api.orders.list();
  const distributors = api.dealers.list();
  const products = api.products.list();
  const targets = api.targets.list();
  const claims = api.claims.list();

  const computed = useMemo(() => {
    const prevRange: PeriodRange = {
      from: range.prevFrom,
      to: range.prevTo,
      prevFrom: range.prevFrom,
      prevTo: range.prevTo,
    };
    const revenue = dispatchedRevenue(orders, range);
    const prevRevenue = dispatchedRevenue(orders, prevRange);
    const orderCount = ordersInPeriod(orders, range).length;
    const prevOrderCount = ordersInPeriod(orders, prevRange).length;
    const collections = collectionsInPeriod(orders, range);
    const prevCollections = collectionsInPeriod(orders, prevRange);
    const outstanding = outstandingTotal(distributors);

    const trend = buildRevenueTrend(orders, targets, range);

    // Leaderboards (in-period)
    const periodOrders = ordersInPeriod(orders, range);
    const dealerRev = new Map<string, number>();
    const skuRev = new Map<string, number>();
    const skuName = new Map<string, string>();
    for (const o of periodOrders) {
      dealerRev.set(o.distributorId, (dealerRev.get(o.distributorId) || 0) + (o.total || 0));
      for (const l of o.lines) {
        skuRev.set(l.productId, (skuRev.get(l.productId) || 0) + (l.lineTotal || 0));
        skuName.set(l.productId, l.productName);
      }
    }
    const topDealers = [...dealerRev.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, v]) => {
        const d = distributors.find((x) => x.id === id);
        return {
          id,
          name: d?.name || "Unknown dealer",
          primary: formatCurrency(v),
          secondary: d?.location,
          href: `/distributors/${id}`,
        };
      });
    const topSkus = [...skuRev.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, v]) => {
        const p = products.find((x) => x.id === id);
        return {
          id,
          name: skuName.get(id) || p?.name || "Unknown SKU",
          primary: formatCurrency(v),
          secondary: p?.sku,
        };
      });

    // 7-bucket sparklines for KPI cards (within the selected period).
    const buckets = 7;
    const span = range.to.getTime() - range.from.getTime();
    const bucketSize = span / buckets;
    const revSpark = new Array(buckets).fill(0);
    const ordSpark = new Array(buckets).fill(0);
    const colSpark = new Array(buckets).fill(0);
    for (const o of orders) {
      const od = new Date(o.date);
      if (od < range.from || od > range.to) continue;
      const idx = Math.min(buckets - 1, Math.max(0, Math.floor((od.getTime() - range.from.getTime()) / bucketSize)));
      ordSpark[idx] += 1;
      if (o.paymentStatus === "paid") colSpark[idx] += o.total || 0;
      if (o.deliveryStatus === "dispatched" || o.deliveryStatus === "delivered") {
        const ref = o.dispatchDate ? new Date(o.dispatchDate) : od;
        if (ref >= range.from && ref <= range.to) {
          const ridx = Math.min(buckets - 1, Math.max(0, Math.floor((ref.getTime() - range.from.getTime()) / bucketSize)));
          revSpark[ridx] += o.total || 0;
        }
      }
    }

    // Period target — sum salesperson monthly targets, scaled to period length.
    const monthlyTargetTotal = targets
      .filter((t) => t.entityType === "salesperson")
      .reduce((s, t) => s + (t.targetRevenue || 0), 0);
    const daysTotal = Math.max(1, Math.round((range.to.getTime() - range.from.getTime()) / 86400_000));
    const now = Date.now();
    const daysElapsed = Math.max(1, Math.min(daysTotal, Math.round((Math.min(now, range.to.getTime()) - range.from.getTime()) / 86400_000)));
    const periodTarget = Math.round(monthlyTargetTotal * (daysTotal / 30));

    return {
      revenue,
      prevRevenue,
      orderCount,
      prevOrderCount,
      collections,
      prevCollections,
      outstanding,
      trend,
      topDealers,
      topSkus,
      revSpark,
      ordSpark,
      colSpark,
      periodTarget,
      daysElapsed,
      daysTotal,
    };
  }, [orders, distributors, products, targets, range]);

  const periodLabel = PERIOD_LABELS[period] ?? "Period";

  return (
    <div className="space-y-4 md:space-y-6">
      {loading ? (
        <CardSkeleton height={140} />
      ) : (
        <HeroBand
          collected={computed.collections}
          newInvoiced={computed.revenue}
          prevCollected={computed.prevCollections}
          periodLabel={periodLabel}
        />
      )}

      {loading ? (
        <KpiRowSkeleton />
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <CommandKpiCard
            index={0}
            label="Revenue (dispatched)"
            value={formatCurrency(computed.revenue)}
            pct={pctDelta(computed.revenue, computed.prevRevenue)}
            spark={computed.revSpark}
            href="/orders?filter=dispatched"
          />
          <CommandKpiCard
            index={1}
            label="Orders"
            value={String(computed.orderCount)}
            pct={pctDelta(computed.orderCount, computed.prevOrderCount)}
            spark={computed.ordSpark}
            href="/orders"
          />
          <CommandKpiCard
            index={2}
            label="Collections"
            value={formatCurrency(computed.collections)}
            pct={pctDelta(computed.collections, computed.prevCollections)}
            spark={computed.colSpark}
            href="/orders?filter=paid"
          />
          <CommandKpiCard
            index={3}
            label="Outstanding"
            value={formatCurrency(computed.outstanding)}
            pct={null}
            inverse
            hint={
              computed.collections > 0
                ? `−${formatCurrency(computed.collections)} collected this period`
                : "From all dealers"
            }
            href="/distributors?filter=outstanding"
          />
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {loading ? (
          <>
            <CardSkeleton height={200} />
            <CardSkeleton height={200} />
          </>
        ) : (
          <>
            <AgingStrip orders={orders} distributors={distributors} />
            <PipelineFunnel orders={orders} />
          </>
        )}
      </div>

      {!loading && (
        <RunRatePill
          actualRevenue={computed.revenue}
          actualCollections={computed.collections}
          periodTarget={computed.periodTarget}
          daysElapsed={computed.daysElapsed}
          daysTotal={computed.daysTotal}
        />
      )}

      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Revenue trend</h3>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-success" /> Actual</span>
            <span className="flex items-center gap-1"><span className="h-px w-3 bg-primary" style={{ borderTop: "1px dashed" }} /> Target</span>
          </div>
        </div>
        {loading ? <ChartSkeleton /> : <CommandLineChart data={computed.trend} />}
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {loading ? (
          <>
            <CardSkeleton height={260} />
            <CardSkeleton height={260} />
            <CardSkeleton height={260} />
          </>
        ) : (
          <>
            <LeaderboardCard
              title="Top dealers"
              icon={Users}
              rows={computed.topDealers}
              emptyTitle="No dealer revenue yet this period"
              emptyHint="Logged orders will rank here."
              viewAllHref="/distributors"
            />
            <LeaderboardCard
              title="Top SKUs"
              icon={Package}
              rows={computed.topSkus}
              emptyTitle="No SKU revenue yet this period"
              viewAllHref="/stock"
            />
            <ActivityFeed orders={orders} claims={claims} />
          </>
        )}
      </div>

      {loading ? <CardSkeleton height={200} /> : <CreditAtRiskCard distributors={distributors} orders={orders} />}
    </div>
  );
}
