import { useState } from "react";
import { orders, distributors, formatCurrency } from "@/data/mock-data";
import { TimePeriodFilter, filterByTimePeriod, periodLabel, type TimePeriod } from "./TimePeriodFilter";

export function DistributorReport() {
  const [period, setPeriod] = useState<TimePeriod>("monthly");
  const filteredOrders = filterByTimePeriod(orders, period);

  const data = distributors.map((d) => {
    const dOrders = filteredOrders.filter((o) => o.distributorId === d.id);
    const total = dOrders.reduce((s, o) => s + o.total, 0);
    return { ...d, orderCount: dOrders.length, revenue: total };
  }).filter((d) => d.orderCount > 0).sort((a, b) => b.revenue - a.revenue);

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
          <span className="text-muted-foreground">{data.length} dealers</span>
        </div>
      </div>
      <div className="glass-card overflow-hidden">
        {/* Desktop table */}
        <div className="hidden md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-6 py-3 font-medium">Dealer</th>
                <th className="px-6 py-3 font-medium">Location</th>
                <th className="px-6 py-3 font-medium text-right">Orders</th>
                <th className="px-6 py-3 font-medium text-right">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">No data for {periodLabel(period).toLowerCase()}</td></tr>
              ) : data.map((d) => (
                <tr key={d.id} className="border-b border-border/50 row-hover">
                  <td className="px-6 py-4 font-medium">{d.name}</td>
                  <td className="px-6 py-4 text-muted-foreground">{d.location}</td>
                  <td className="px-6 py-4 text-right">{d.orderCount}</td>
                  <td className="px-6 py-4 text-right font-medium">{formatCurrency(d.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Mobile cards */}
        <div className="md:hidden">
          {data.length === 0 ? (
            <div className="px-4 py-12 text-center text-xs text-muted-foreground">No data for {periodLabel(period).toLowerCase()}</div>
          ) : data.map((d) => (
            <div key={d.id} className="border-b border-border/50 px-4 py-3 card-hover">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{d.name}</span>
                <span className="text-sm font-medium">{formatCurrency(d.revenue)}</span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">{d.location} · {d.orderCount} orders</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
