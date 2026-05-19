import { useMemo } from "react";
import { useApi } from "@/services/api";
import { formatCurrency } from "@/data/mock-data";
import { CommandKpiCard } from "../CommandKpiCard";
import { CommandLineChart } from "../CommandLineChart";
import { LeaderboardCard } from "../LeaderboardCard";
import { CreditAtRiskCard } from "../CreditAtRiskCard";
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
  type PeriodRange,
} from "@/lib/command-signals";

interface Props {
  range: PeriodRange;
}

export function OverviewTab({ range }: Props) {
  const api = useApi();
  const loading = api.loading;
  const orders = api.orders.list();
  const distributors = api.dealers.list();
  const products = api.products.list();
  const targets = api.targets.list();

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
    };
  }, [orders, distributors, products, targets, range]);

  return (
    <div className="space-y-4 md:space-y-6">
      {loading ? (
        <KpiRowSkeleton />
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <CommandKpiCard
            label="Revenue (dispatched)"
            value={formatCurrency(computed.revenue)}
            pct={pctDelta(computed.revenue, computed.prevRevenue)}
          />
          <CommandKpiCard
            label="Orders"
            value={String(computed.orderCount)}
            pct={pctDelta(computed.orderCount, computed.prevOrderCount)}
          />
          <CommandKpiCard
            label="Collections"
            value={formatCurrency(computed.collections)}
            pct={pctDelta(computed.collections, computed.prevCollections)}
          />
          <CommandKpiCard
            label="Outstanding"
            value={formatCurrency(computed.outstanding)}
            pct={null}
            inverse
            hint="From all dealers"
          />
        </div>
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

      <div className="grid gap-4 md:grid-cols-2">
        {loading ? (
          <>
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
          </>
        )}
      </div>

      {loading ? <CardSkeleton height={200} /> : <CreditAtRiskCard distributors={distributors} />}
    </div>
  );
}
