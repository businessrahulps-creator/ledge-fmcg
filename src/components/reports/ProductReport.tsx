import { useState } from "react";
import { orders, products, formatCurrency, formatNumber } from "@/data/mock-data";
import { TimePeriodFilter, filterByTimePeriod, periodLabel, type TimePeriod } from "./TimePeriodFilter";

export function ProductReport() {
  const [period, setPeriod] = useState<TimePeriod>("monthly");
  const filteredOrders = filterByTimePeriod(orders, period);

  const data = products.map((p) => {
    let qty = 0;
    let rev = 0;
    filteredOrders.forEach((o) => {
      o.lines.forEach((l) => {
        if (l.productId === p.id) {
          qty += l.quantity;
          rev += l.lineTotal;
        }
      });
    });
    return { ...p, qtySold: qty, revenue: rev };
  }).filter((p) => p.qtySold > 0).sort((a, b) => b.revenue - a.revenue);

  const totalRevenue = data.reduce((s, p) => s + p.revenue, 0);
  const totalQty = data.reduce((s, p) => s + p.qtySold, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
        <TimePeriodFilter value={period} onChange={setPeriod} />
        <div className="flex flex-wrap items-center gap-3 text-xs md:gap-6 md:text-sm">
          <span className="text-muted-foreground">
            {periodLabel(period)}: <span className="font-semibold text-foreground">{formatCurrency(totalRevenue)}</span>
          </span>
          <span className="text-muted-foreground">{formatNumber(totalQty)} units sold</span>
        </div>
      </div>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {/* Desktop table */}
        <div className="hidden md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-6 py-3 font-medium">Product</th>
                <th className="px-6 py-3 font-medium">SKU</th>
                <th className="px-6 py-3 font-medium text-right">Qty Sold</th>
                <th className="px-6 py-3 font-medium text-right">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">No data for {periodLabel(period).toLowerCase()}</td></tr>
              ) : data.map((p) => (
                <tr key={p.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 font-medium">{p.name}</td>
                  <td className="px-6 py-4 text-muted-foreground font-mono text-xs">{p.sku}</td>
                  <td className="px-6 py-4 text-right">{formatNumber(p.qtySold)}</td>
                  <td className="px-6 py-4 text-right font-medium">{formatCurrency(p.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Mobile cards */}
        <div className="md:hidden">
          {data.length === 0 ? (
            <div className="px-4 py-12 text-center text-xs text-muted-foreground">No data for {periodLabel(period).toLowerCase()}</div>
          ) : data.map((p) => (
            <div key={p.id} className="border-b border-border/50 px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{p.name}</span>
                <span className="text-sm font-medium">{formatCurrency(p.revenue)}</span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">{p.sku} · {formatNumber(p.qtySold)} sold</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
