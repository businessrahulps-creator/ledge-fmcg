import { useState } from "react";
import { motion } from "framer-motion";
import { Search, MapPin, Phone, ShoppingCart, Plus, Pencil, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layout/AppLayout";
import { distributors as initialDealers, orders, formatCurrency, formatNumber, type Distributor } from "@/data/mock-data";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export default function Distributors() {
  const [items, setItems] = useState<Distributor[]>(initialDealers);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<Distributor | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = items.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.location.toLowerCase().includes(search.toLowerCase())
  );

  const selected = items.find((d) => d.id === selectedId);
  const selectedOrders = orders.filter((o) => o.distributorId === selectedId);
  const deleteDealer = deleteId ? items.find((d) => d.id === deleteId) : null;

  const openNew = () => {
    setEditItem({ id: `d${Date.now()}`, name: "", location: "", contact: "", totalOrders: 0, totalValue: 0 });
    setIsNew(true);
  };

  const openEdit = (d: Distributor, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditItem({ ...d });
    setIsNew(false);
  };

  const save = () => {
    if (!editItem?.name) return;
    if (isNew) {
      setItems((prev) => [...prev, editItem]);
      toast.success("Dealer added", { description: `${editItem.name} has been added.` });
    } else {
      setItems((prev) => prev.map((d) => (d.id === editItem.id ? editItem : d)));
      toast.success("Dealer updated", { description: `${editItem.name} has been updated.` });
    }
    setEditItem(null);
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    const d = items.find((i) => i.id === deleteId);
    setItems((prev) => prev.filter((i) => i.id !== deleteId));
    toast.success("Dealer removed", { description: `${d?.name} has been removed.` });
    setDeleteId(null);
  };

  return (
    <AppLayout>
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight md:text-2xl">Dealers</h1>
            <p className="mt-0.5 text-xs text-muted-foreground md:mt-1 md:text-sm">
              Manage your dealer network
            </p>
          </div>
          <Button onClick={openNew} className="w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            Add Dealer
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search dealers..."
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
              className="cursor-pointer glass-card card-hover p-4 md:p-6"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold md:text-base">{d.name}</h3>
                  <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground md:mt-2 md:text-sm">
                    <MapPin className="h-3 w-3 md:h-3.5 md:w-3.5" strokeWidth={1.5} />
                    {d.location}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground md:text-sm">
                    <Phone className="h-3 w-3 md:h-3.5 md:w-3.5" strokeWidth={1.5} />
                    {d.contact}
                  </div>
                </div>
                <div className="flex gap-0.5">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => openEdit(d, e)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteId(d.id); }}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
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
            <p className="mt-3 text-sm font-medium">No dealers found</p>
            <p className="text-xs text-muted-foreground">Add your first dealer to get started</p>
          </div>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
          <DialogContent className="max-w-[calc(100vw-2rem)] rounded-xl sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base md:text-lg">{isNew ? "Add Dealer" : "Edit Dealer"}</DialogTitle>
            </DialogHeader>
            {editItem && (
              <div className="space-y-3 md:space-y-4">
                <div className="space-y-1.5 md:space-y-2">
                  <Label className="text-xs md:text-sm">Dealer Name</Label>
                  <Input value={editItem.name} onChange={(e) => setEditItem({ ...editItem, name: e.target.value })} placeholder="e.g. Sharma Traders" className="h-11 rounded-lg md:h-12" />
                </div>
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div className="space-y-1.5 md:space-y-2">
                    <Label className="text-xs md:text-sm">Location</Label>
                    <Input value={editItem.location} onChange={(e) => setEditItem({ ...editItem, location: e.target.value })} placeholder="e.g. Kochi, Kerala" className="h-11 rounded-lg md:h-12" />
                  </div>
                  <div className="space-y-1.5 md:space-y-2">
                    <Label className="text-xs md:text-sm">Contact</Label>
                    <Input value={editItem.contact} onChange={(e) => setEditItem({ ...editItem, contact: e.target.value })} placeholder="+91 98100 55555" className="h-11 rounded-lg md:h-12" />
                  </div>
                </div>
              </div>
            )}
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setEditItem(null)}>Cancel</Button>
              <Button onClick={save}>{isNew ? "Add Dealer" : "Save Changes"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent className="max-w-[calc(100vw-2rem)] rounded-xl sm:max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Dealer</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove <span className="font-semibold text-foreground">{deleteDealer?.name}</span>? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <Button variant="destructive" onClick={confirmDelete}>Remove</Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Dealer Profile Dialog */}
        <Dialog open={!!selectedId} onOpenChange={() => setSelectedId(null)}>
          <DialogContent className="max-w-[calc(100vw-2rem)] max-h-[80vh] overflow-y-auto rounded-xl sm:max-w-2xl">
            {selected && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-base md:text-lg">{selected.name}</DialogTitle>
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
