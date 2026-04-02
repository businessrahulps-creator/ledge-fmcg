import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Pencil, Trash2, UserCheck, Phone, Mail, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppLayout } from "@/components/layout/AppLayout";
import { salespersons as initialData, orders, formatCurrency, formatNumber, type Salesperson } from "@/data/mock-data";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

export default function Salespersons() {
  const [items, setItems] = useState<Salesperson[]>(initialData);
  const [search, setSearch] = useState("");
  const [editItem, setEditItem] = useState<Salesperson | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const { toast } = useToast();

  const filtered = items.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.region.toLowerCase().includes(search.toLowerCase())
  );

  const openNew = () => {
    setEditItem({ id: `s${Date.now()}`, name: "", phone: "", email: "", region: "", totalOrders: 0, totalValue: 0 });
    setIsNew(true);
  };

  const openEdit = (s: Salesperson, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditItem({ ...s });
    setIsNew(false);
  };

  const save = () => {
    if (!editItem?.name) return;
    if (isNew) {
      setItems((prev) => [...prev, editItem]);
      toast({ title: "Salesperson added", description: `${editItem.name} has been added.` });
    } else {
      setItems((prev) => prev.map((s) => (s.id === editItem.id ? editItem : s)));
      toast({ title: "Salesperson updated", description: `${editItem.name} has been updated.` });
    }
    setEditItem(null);
  };

  const remove = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const s = items.find((i) => i.id === id);
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast({ title: "Salesperson removed", description: `${s?.name} has been removed.` });
  };

  const profilePerson = items.find((s) => s.id === profileId);
  const profileOrders = orders.filter((o) => o.salespersonId === profileId);

  return (
    <AppLayout>
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight md:text-2xl">Salespersons</h1>
            <p className="mt-0.5 text-xs text-muted-foreground md:mt-1 md:text-sm">
              Manage your sales team
            </p>
          </div>
          <Button onClick={openNew} className="w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            Add Salesperson
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search salespersons..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 rounded-lg pl-10 md:h-12 md:max-w-md"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-3">
          {filtered.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              onClick={() => setProfileId(s.id)}
              className="cursor-pointer glass-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg active:scale-[0.98] md:p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5 md:gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 md:h-10 md:w-10">
                    <UserCheck className="h-4 w-4 text-primary md:h-5 md:w-5" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold md:text-base">{s.name}</h3>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground md:text-xs">
                      <MapPin className="h-3 w-3" strokeWidth={1.5} />
                      {s.region}
                    </div>
                  </div>
                </div>
                <div className="flex gap-0.5 md:gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 md:h-9 md:w-9" onClick={(e) => openEdit(s, e)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive md:h-9 md:w-9" onClick={(e) => remove(s.id, e)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-3 text-[10px] text-muted-foreground md:mt-3 md:text-xs">
                <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{s.phone}</span>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-xs md:mt-4 md:pt-4 md:text-sm">
                <span>{s.totalOrders} orders</span>
                <span className="font-semibold">{formatCurrency(s.totalValue)}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <UserCheck className="h-10 w-10 text-muted-foreground/50" strokeWidth={1.5} />
            <p className="mt-3 text-sm font-medium">No salespersons found</p>
            <p className="text-xs text-muted-foreground">Add your first salesperson to get started</p>
          </div>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
          <DialogContent className="max-w-[calc(100vw-2rem)] rounded-xl sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base md:text-lg">{isNew ? "Add Salesperson" : "Edit Salesperson"}</DialogTitle>
            </DialogHeader>
            {editItem && (
              <div className="space-y-3 md:space-y-4">
                <div className="space-y-1.5 md:space-y-2">
                  <Label className="text-xs md:text-sm">Full Name</Label>
                  <Input value={editItem.name} onChange={(e) => setEditItem({ ...editItem, name: e.target.value })} placeholder="e.g. Rajesh Kumar" className="h-11 rounded-lg md:h-12" />
                </div>
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div className="space-y-1.5 md:space-y-2">
                    <Label className="text-xs md:text-sm">Phone</Label>
                    <Input value={editItem.phone} onChange={(e) => setEditItem({ ...editItem, phone: e.target.value })} placeholder="+91 98100 55555" className="h-11 rounded-lg md:h-12" />
                  </div>
                  <div className="space-y-1.5 md:space-y-2">
                    <Label className="text-xs md:text-sm">Region</Label>
                    <Input value={editItem.region} onChange={(e) => setEditItem({ ...editItem, region: e.target.value })} placeholder="North" className="h-11 rounded-lg md:h-12" />
                  </div>
                </div>
                <div className="space-y-1.5 md:space-y-2">
                  <Label className="text-xs md:text-sm">Email</Label>
                  <Input value={editItem.email} onChange={(e) => setEditItem({ ...editItem, email: e.target.value })} placeholder="name@company.com" className="h-11 rounded-lg md:h-12" />
                </div>
              </div>
            )}
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setEditItem(null)}>Cancel</Button>
              <Button onClick={save}>{isNew ? "Add Salesperson" : "Save Changes"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Profile Dialog */}
        <Dialog open={!!profileId} onOpenChange={() => setProfileId(null)}>
          <DialogContent className="max-w-[calc(100vw-2rem)] max-h-[80vh] overflow-y-auto rounded-xl sm:max-w-2xl">
            {profilePerson && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-base md:text-xl">{profilePerson.name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 md:space-y-6">
                  <div className="grid grid-cols-2 gap-3 md:gap-4">
                    <div className="rounded-lg border border-border bg-muted/20 p-3 md:p-4">
                      <span className="text-[10px] text-muted-foreground md:text-xs">Phone</span>
                      <p className="mt-0.5 text-xs font-medium md:mt-1 md:text-sm">{profilePerson.phone}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/20 p-3 md:p-4">
                      <span className="text-[10px] text-muted-foreground md:text-xs">Email</span>
                      <p className="mt-0.5 text-xs font-medium md:mt-1 md:text-sm truncate">{profilePerson.email}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/20 p-3 md:p-4">
                      <span className="text-[10px] text-muted-foreground md:text-xs">Region</span>
                      <p className="mt-0.5 text-xs font-medium md:mt-1 md:text-sm">{profilePerson.region}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/20 p-3 md:p-4">
                      <span className="text-[10px] text-muted-foreground md:text-xs">Total Value</span>
                      <p className="mt-0.5 text-xs font-medium md:mt-1 md:text-sm">{formatCurrency(profilePerson.totalValue)}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="mb-2 text-xs font-semibold md:mb-3 md:text-sm">Order History</h3>
                    {profileOrders.length > 0 ? (
                      <div className="rounded-lg border border-border overflow-hidden">
                        {/* Desktop */}
                        <table className="hidden w-full text-sm md:table">
                          <thead>
                            <tr className="border-b border-border text-left text-xs text-muted-foreground">
                              <th className="px-4 py-2.5 font-medium">Order</th>
                              <th className="px-4 py-2.5 font-medium">Distributor</th>
                              <th className="px-4 py-2.5 font-medium text-right">Amount</th>
                              <th className="px-4 py-2.5 font-medium">Payment</th>
                            </tr>
                          </thead>
                          <tbody>
                            {profileOrders.map((o) => (
                              <tr key={o.id} className="border-b border-border/50">
                                <td className="px-4 py-3 font-medium text-primary">{o.orderNumber}</td>
                                <td className="px-4 py-3 text-muted-foreground">{o.distributorName}</td>
                                <td className="px-4 py-3 text-right font-medium">{formatCurrency(o.total)}</td>
                                <td className="px-4 py-3"><StatusBadge status={o.paymentStatus} /></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {/* Mobile */}
                        <div className="md:hidden">
                          {profileOrders.map((o) => (
                            <div key={o.id} className="border-b border-border/50 px-3 py-2.5">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-primary">{o.orderNumber}</span>
                                <span className="text-xs font-medium">{formatCurrency(o.total)}</span>
                              </div>
                              <div className="mt-0.5 flex items-center gap-2">
                                <span className="text-[10px] text-muted-foreground">{o.distributorName}</span>
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
