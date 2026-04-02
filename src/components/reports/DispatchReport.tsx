import { useState } from "react";
import { orders, formatCurrency, type Order } from "@/data/mock-data";
import { StatusBadge } from "@/components/ui/status-badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TimePeriodFilter, filterByTimePeriod, periodLabel, type TimePeriod } from "./TimePeriodFilter";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

export function DispatchReport() {
  const [period, setPeriod] = useState<TimePeriod>("monthly");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<Order | null>(null);

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
        <div className="flex flex-wrap items-center gap-3 text-xs md:gap-6 md:text-sm">
          <span className="text-muted-foreground">{filtered.length} orders</span>
        </div>
      </div>
      <div className="glass-card overflow-hidden">
        <div className="hidden md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-6 py-3 font-medium">Order</th>
                <th className="px-6 py-3 font-medium">Dealer</th>
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
                <tr key={o.id} className="border-b border-border/50 row-hover cursor-pointer" onClick={() => setSelected(o)}>
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
        <div className="md:hidden">
          {filtered.length === 0 ? (
            <div className="px-4 py-12 text-center text-xs text-muted-foreground">No data for {periodLabel(period).toLowerCase()}</div>
          ) : filtered.map((o) => (
            <div key={o.id} className="border-b border-border/50 px-4 py-3 card-hover cursor-pointer" onClick={() => setSelected(o)}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{o.orderNumber}</span>
                <StatusBadge status={o.deliveryStatus} />
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">{o.distributorName} · {o.dispatchDate || "No dispatch date"} · {o.vehicle || "No vehicle"}</p>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.orderNumber}</DialogTitle>
                <p className="text-sm text-muted-foreground">{selected.distributorName} · {selected.date}</p>
              </DialogHeader>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Delivery Status</span>
                <StatusBadge status={selected.deliveryStatus} />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Dispatch Date</span>
                <span className="font-medium">{selected.dispatchDate || "—"}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Vehicle</span>
                <span className="font-medium">{selected.vehicle || "—"}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Driver</span>
                <span className="font-medium">{selected.driverName || "—"}</span>
              </div>
              {selected.dispatchRemarks && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Remarks</span>
                  <span className="font-medium">{selected.dispatchRemarks}</span>
                </div>
              )}
              <Separator />
              <h4 className="text-sm font-medium">Line Items</h4>
              <div className="space-y-2">
                {selected.lines.map((l, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2">
                    <div>
                      <p className="text-sm font-medium">{l.productName}</p>
                      <p className="text-xs text-muted-foreground">{l.quantity} × {formatCurrency(l.unitPrice)}</p>
                    </div>
                    <span className="text-sm font-medium">{formatCurrency(l.lineTotal)}</span>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total</span>
                <span className="font-semibold">{formatCurrency(selected.total)}</span>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
