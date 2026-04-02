import { useState } from "react";
import { orders, salespersons, formatCurrency, formatNumber } from "@/data/mock-data";
import { TimePeriodFilter, filterByTimePeriod, periodLabel, type TimePeriod } from "./TimePeriodFilter";

export function SalesTeamReport() {
  const [period, setPeriod] = useState<TimePeriod>("monthly");
  const filteredOrders = filterByTimePeriod(orders, period);

  const data = salespersons.map((s) => {
    const sOrders = filteredOrders.filter((o) => o.salespersonId === s.id);
    const revenue = sOrders.reduce((sum, o) => sum + o.total, 0);
    return { ...s, orderCount: sOrders.length, revenue };
  }).filter((s) => s.orderCount > 0).sort((a, b) => b.revenue - a.revenue);

  const totalRevenue = data.reduce((s, d) => s + d.revenue, 0);
  const totalOrders = data.reduce((s, d) => s + d.orderCount, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
        <TimePeriodFilter value={period} onChange={setPeriod} />
        <div className="flex flex-wrap items-center gap-3 text-xs md:gap-6 md:text-sm">
          <span className="text-muted-foreground">
            {periodLabel(period)}: <span className="font-semibold text-foreground">{formatCurrency(totalRevenue)}</span>
          </span>
          <span className="text-muted-foreground">{totalOrders} orders</span>
          <span className="text-muted-foreground">{data.length} members</span>
        </div>
      </div>
      <div className="glass-card overflow-hidden">
        <div className="hidden md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Region</th>
                <th className="px-6 py-3 font-medium text-right">Orders</th>
                <th className="px-6 py-3 font-medium text-right">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">No data for {periodLabel(period).toLowerCase()}</td></tr>
              ) : data.map((s) => (
                <tr key={s.id} className="border-b border-border/50 row-hover">
                  <td className="px-6 py-4 font-medium">{s.name}</td>
                  <td className="px-6 py-4 text-muted-foreground">{s.region}</td>
                  <td className="px-6 py-4 text-right">{s.orderCount}</td>
                  <td className="px-6 py-4 text-right font-medium">{formatCurrency(s.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="md:hidden">
          {data.length === 0 ? (
            <div className="px-4 py-12 text-center text-xs text-muted-foreground">No data for {periodLabel(period).toLowerCase()}</div>
          ) : data.map((s) => (
            <div key={s.id} className="border-b border-border/50 px-4 py-3 card-hover">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{s.name}</span>
                <span className="text-sm font-medium">{formatCurrency(s.revenue)}</span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">{s.region} · {s.orderCount} orders</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
