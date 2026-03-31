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
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Distributors</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your distributor network
          </p>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search distributors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-12 rounded-lg pl-10"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((d, i) => (
            <motion.div
              key={d.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              onClick={() => setSelectedId(d.id)}
              className="cursor-pointer rounded-xl border border-border bg-card p-6 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg"
            >
              <h3 className="text-base font-semibold">{d.name}</h3>
              <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" strokeWidth={1.5} />
                {d.location}
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <Phone className="h-3.5 w-3.5" strokeWidth={1.5} />
                {d.contact}
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                <div className="flex items-center gap-1.5 text-sm">
                  <ShoppingCart className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
                  <span>{d.totalOrders} orders</span>
                </div>
                <span className="text-sm font-semibold">{formatCurrency(d.totalValue)}</span>
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
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            {selected && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-xl">{selected.name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg border border-border bg-muted/20 p-4">
                      <span className="text-xs text-muted-foreground">Location</span>
                      <p className="mt-1 text-sm font-medium">{selected.location}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/20 p-4">
                      <span className="text-xs text-muted-foreground">Contact</span>
                      <p className="mt-1 text-sm font-medium">{selected.contact}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/20 p-4">
                      <span className="text-xs text-muted-foreground">Total Orders</span>
                      <p className="mt-1 text-sm font-medium">{formatNumber(selected.totalOrders)}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/20 p-4">
                      <span className="text-xs text-muted-foreground">Total Value</span>
                      <p className="mt-1 text-sm font-medium">{formatCurrency(selected.totalValue)}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-3 text-sm font-semibold">Order History</h3>
                    {selectedOrders.length > 0 ? (
                      <div className="rounded-lg border border-border overflow-hidden">
                        <table className="w-full text-sm">
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
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No orders yet</p>
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
