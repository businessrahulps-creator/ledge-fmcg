import { useState } from "react";
import { motion } from "framer-motion";
import { Search, MapPin, Phone, ShoppingCart, IndianRupee } from "lucide-react";
import { Input } from "@/components/ui/input";
import { AppLayout } from "@/components/layout/AppLayout";
import { distributors, orders, formatCurrency, formatNumber } from "@/data/mock-data";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Distributors() {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = distributors.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.location.toLowerCase().includes(search.toLowerCase())
  );

  const selected = distributors.find((d) => d.id === selectedId);
  const selectedOrders = orders.filter((o) => o.distributorId === selectedId);

  return (
    <AppLayout>
      <div className="space-y-4 md:space-y-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight md:text-2xl">Distributors</h1>
          <p className="mt-0.5 text-xs text-muted-foreground md:mt-1 md:text-sm">
            Manage your distributor network
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search distributors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 rounded-lg pl-10 md:h-12 md:max-w-md"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-3">
          {filtered.map((d, i) => (
            <motion.div
              key={d.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              onClick={() => setSelectedId(d.id)}
              className="cursor-pointer rounded-xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg active:scale-[0.98] md:p-6"
            >
              <h3 className="text-sm font-semibold md:text-base">{d.name}</h3>
              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground md:mt-2 md:text-sm">
                <MapPin className="h-3 w-3 md:h-3.5 md:w-3.5" strokeWidth={1.5} />
                {d.location}
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground md:text-sm">
                <Phone className="h-3 w-3 md:h-3.5 md:w-3.5" strokeWidth={1.5} />
                {d.contact}
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-border pt-3 md:mt-4 md:pt-4">
                <div className="flex items-center gap-1.5 text-xs md:text-sm">
                  <ShoppingCart className="h-3 w-3 text-muted-foreground md:h-3.5 md:w-3.5" strokeWidth={1.5} />
                  <span>{d.totalOrders} orders</span>
                </div>
                <span className="text-xs font-semibold md:text-sm">{formatCurrency(d.totalValue)}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Search className="h-10 w-10 text-muted-foreground/50" strokeWidth={1.5} />
            <p className="mt-3 text-sm font-medium">No distributors found</p>
          </div>
        )}

        {/* Distributor Profile Dialog */}
        <Dialog open={!!selectedId} onOpenChange={() => setSelectedId(null)}>
          <DialogContent className="max-w-[calc(100vw-2rem)] max-h-[80vh] overflow-y-auto rounded-xl sm:max-w-2xl">
            {selected && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-base md:text-xl">{selected.name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 md:space-y-6">
                  <div className="grid grid-cols-2 gap-3 md:gap-4">
                    <div className="rounded-lg border border-border bg-muted/20 p-3 md:p-4">
                      <span className="text-[10px] text-muted-foreground md:text-xs">Location</span>
                      <p className="mt-0.5 text-xs font-medium md:mt-1 md:text-sm">{selected.location}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/20 p-3 md:p-4">
                      <span className="text-[10px] text-muted-foreground md:text-xs">Contact</span>
                      <p className="mt-0.5 text-xs font-medium md:mt-1 md:text-sm">{selected.contact}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/20 p-3 md:p-4">
                      <span className="text-[10px] text-muted-foreground md:text-xs">Total Orders</span>
                      <p className="mt-0.5 text-xs font-medium md:mt-1 md:text-sm">{formatNumber(selected.totalOrders)}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/20 p-3 md:p-4">
                      <span className="text-[10px] text-muted-foreground md:text-xs">Total Value</span>
                      <p className="mt-0.5 text-xs font-medium md:mt-1 md:text-sm">{formatCurrency(selected.totalValue)}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-2 text-xs font-semibold md:mb-3 md:text-sm">Order History</h3>
                    {selectedOrders.length > 0 ? (
                      <div className="rounded-lg border border-border overflow-hidden">
                        <table className="hidden w-full text-sm md:table">
                          <thead>
                            <tr className="border-b border-border text-left text-xs text-muted-foreground">
                              <th className="px-4 py-2.5 font-medium">Order</th>
                              <th className="px-4 py-2.5 font-medium">Date</th>
                              <th className="px-4 py-2.5 font-medium text-right">Amount</th>
                              <th className="px-4 py-2.5 font-medium">Payment</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedOrders.map((o) => (
                              <tr key={o.id} className="border-b border-border/50">
                                <td className="px-4 py-3 font-medium text-primary">{o.orderNumber}</td>
                                <td className="px-4 py-3 text-muted-foreground">{o.date}</td>
                                <td className="px-4 py-3 text-right font-medium">{formatCurrency(o.total)}</td>
                                <td className="px-4 py-3"><StatusBadge status={o.paymentStatus} /></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div className="md:hidden">
                          {selectedOrders.map((o) => (
                            <div key={o.id} className="border-b border-border/50 px-3 py-2.5">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-primary">{o.orderNumber}</span>
                                <span className="text-xs font-medium">{formatCurrency(o.total)}</span>
                              </div>
                              <div className="mt-0.5 flex items-center gap-2">
                                <span className="text-[10px] text-muted-foreground">{o.date}</span>
                                <StatusBadge status={o.paymentStatus} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground md:text-sm">No orders yet</p>
                    )}
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
