import { useState } from "react";
import { orders, formatCurrency } from "@/data/mock-data";
import { StatusBadge } from "@/components/ui/status-badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TimePeriodFilter, filterByTimePeriod, periodLabel, type TimePeriod } from "./TimePeriodFilter";

export function PaymentReport() {
  const [period, setPeriod] = useState<TimePeriod>("monthly");
  const [filter, setFilter] = useState("all");

  const periodFiltered = filterByTimePeriod(orders, period);
  const filtered = filter === "all" ? periodFiltered : periodFiltered.filter((o) => o.paymentStatus === filter);

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
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex flex-wrap items-center gap-3 text-xs md:gap-6 md:text-sm">
          <span className="text-muted-foreground">
            {periodLabel(period)}: <span className="font-semibold text-foreground">{formatCurrency(filtered.reduce((s, o) => s + o.total, 0))}</span>
          </span>
          <span className="text-muted-foreground">{filtered.length} orders</span>
        </div>
      </div>
      <div className="glass-card overflow-hidden">
        {/* Desktop table */}
        <div className="hidden md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-6 py-3 font-medium">Order</th>
                <th className="px-6 py-3 font-medium">Distributor</th>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium text-right">Amount</th>
                <th className="px-6 py-3 font-medium">Payment</th>
                <th className="px-6 py-3 font-medium">Mode</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">No data for {periodLabel(period).toLowerCase()}</td></tr>
              ) : filtered.map((o) => (
                <tr key={o.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 font-medium text-primary">{o.orderNumber}</td>
                  <td className="px-6 py-4">{o.distributorName}</td>
                  <td className="px-6 py-4 text-muted-foreground">{o.date}</td>
                  <td className="px-6 py-4 text-right font-medium">{formatCurrency(o.total)}</td>
                  <td className="px-6 py-4"><StatusBadge status={o.paymentStatus} /></td>
                  <td className="px-6 py-4 text-muted-foreground capitalize">{o.paymentMode.replace("_", " ")}</td>
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
            <div key={o.id} className="border-b border-border/50 px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-primary">{o.orderNumber}</span>
                <span className="text-sm font-medium">{formatCurrency(o.total)}</span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">{o.distributorName} · {o.date}</p>
              <div className="mt-1.5 flex items-center gap-2">
                <StatusBadge status={o.paymentStatus} />
                <span className="text-[10px] text-muted-foreground capitalize">{o.paymentMode.replace("_", " ")}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
