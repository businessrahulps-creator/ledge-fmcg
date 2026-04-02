import { useState } from "react";
import { orders } from "@/data/mock-data";
import { StatusBadge } from "@/components/ui/status-badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TimePeriodFilter, filterByTimePeriod, periodLabel, type TimePeriod } from "./TimePeriodFilter";

export function DispatchReport() {
  const [period, setPeriod] = useState<TimePeriod>("monthly");
  const [filter, setFilter] = useState("all");

  const periodFiltered = filterByTimePeriod(orders, period);
  const filtered = filter === "all" ? periodFiltered : periodFiltered.filter((o) => o.deliveryStatus === filter);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
        <TimePeriodFilter value={period} onChange={setPeriod} />
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="h-10 w-full rounded-lg sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="dispatched">Dispatched</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground md:text-sm">{filtered.length} orders</span>
      </div>
      <div className="glass-card overflow-hidden">
        {/* Desktop table */}
        <div className="hidden md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-6 py-3 font-medium">Order</th>
                <th className="px-6 py-3 font-medium">Distributor</th>
                <th className="px-6 py-3 font-medium">Dispatch Date</th>
                <th className="px-6 py-3 font-medium">Vehicle</th>
                <th className="px-6 py-3 font-medium">Driver</th>
                <th className="px-6 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">No data for {periodLabel(period).toLowerCase()}</td></tr>
              ) : filtered.map((o) => (
                <tr key={o.id} className="border-b border-border/50 row-hover">
                  <td className="px-6 py-4 font-medium text-primary">{o.orderNumber}</td>
                  <td className="px-6 py-4">{o.distributorName}</td>
                  <td className="px-6 py-4 text-muted-foreground">{o.dispatchDate || "—"}</td>
                  <td className="px-6 py-4 text-muted-foreground">{o.vehicle || "—"}</td>
                  <td className="px-6 py-4 text-muted-foreground">{o.driverName || "—"}</td>
                  <td className="px-6 py-4"><StatusBadge status={o.deliveryStatus} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Mobile cards */}
        <div className="md:hidden">
          {filtered.length === 0 ? (
            <div className="px-4 py-12 text-center text-xs text-muted-foreground">No data for {periodLabel(period).toLowerCase()}</div>
          ) : filtered.map((o) => (
            <div key={o.id} className="border-b border-border/50 px-4 py-3 card-hover">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-primary">{o.orderNumber}</span>
                <StatusBadge status={o.deliveryStatus} />
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">{o.distributorName}</p>
              <p className="text-[10px] text-muted-foreground">{o.dispatchDate || "No dispatch date"} · {o.vehicle || "No vehicle"}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
