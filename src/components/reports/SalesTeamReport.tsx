import { useState } from "react";
import { orders, salespersons, formatCurrency, formatNumber } from "@/data/mock-data";
import { TimePeriodFilter, filterByTimePeriod, periodLabel, type TimePeriod } from "./TimePeriodFilter";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/ui/status-badge";

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

  type MemberRow = typeof data[number];
  const [selected, setSelected] = useState<MemberRow | null>(null);

  const selectedOrders = selected ? filteredOrders.filter((o) => o.salespersonId === selected.id) : [];

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
                <tr key={s.id} className="border-b border-border/50 row-hover cursor-pointer" onClick={() => setSelected(s)}>
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
            <div key={s.id} className="border-b border-border/50 px-4 py-3 card-hover cursor-pointer" onClick={() => setSelected(s)}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{s.name}</span>
                <span className="text-sm font-medium">{formatCurrency(s.revenue)}</span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">{s.region} · {s.orderCount} orders</p>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-[calc(100vw-2rem)] max-h-[85vh] overflow-y-auto rounded-xl p-4 md:p-6 sm:max-w-2xl">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="text-base md:text-xl">{selected.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 md:space-y-5">
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div className="rounded-lg border border-border bg-muted/20 p-3">
                    <span className="text-[10px] text-muted-foreground md:text-xs">Region</span>
                    <p className="mt-0.5 text-xs font-medium md:text-sm">{selected.region}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/20 p-3">
                    <span className="text-[10px] text-muted-foreground md:text-xs">Phone</span>
                    <p className="mt-0.5 text-xs font-medium md:text-sm">{selected.phone}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/20 p-3">
                    <span className="text-[10px] text-muted-foreground md:text-xs">Orders</span>
                    <p className="mt-0.5 text-xs font-semibold md:text-sm">{selected.orderCount}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/20 p-3">
                    <span className="text-[10px] text-muted-foreground md:text-xs">Revenue</span>
                    <p className="mt-0.5 text-xs font-semibold md:text-sm">{formatCurrency(selected.revenue)}</p>
                  </div>
                </div>

                <div>
                  <h3 className="mb-2 text-xs font-semibold md:text-sm">Orders ({periodLabel(period).toLowerCase()})</h3>
                  <div className="rounded-lg border border-border overflow-hidden">
                    <table className="w-full text-xs md:text-sm">
                      <thead>
                        <tr className="border-b border-border text-left text-[10px] text-muted-foreground md:text-xs">
                          <th className="px-3 py-2 font-medium md:px-4">Order</th>
                          <th className="px-3 py-2 font-medium md:px-4">Dealer</th>
                          <th className="px-3 py-2 font-medium md:px-4">Status</th>
                          <th className="px-3 py-2 font-medium text-right md:px-4">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedOrders.map((o) => (
                          <tr key={o.id} className="border-b border-border/50">
                            <td className="px-3 py-2.5 font-medium md:px-4">{o.orderNumber}</td>
                            <td className="px-3 py-2.5 text-muted-foreground md:px-4">{o.distributorName}</td>
                            <td className="px-3 py-2.5 md:px-4"><StatusBadge status={o.paymentStatus} /></td>
                            <td className="px-3 py-2.5 text-right font-medium md:px-4">{formatCurrency(o.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
