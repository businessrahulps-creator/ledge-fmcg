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
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Salespersons</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage your sales team
            </p>
          </div>
          <Button onClick={openNew}>
            <Plus className="h-4 w-4" />
            Add Salesperson
          </Button>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search salespersons..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-12 rounded-lg pl-10"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              onClick={() => setProfileId(s.id)}
              className="cursor-pointer rounded-xl border border-border bg-card p-6 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <UserCheck className="h-5 w-5 text-primary" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold">{s.name}</h3>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" strokeWidth={1.5} />
                      {s.region}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => openEdit(s, e)}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={(e) => remove(s.id, e)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{s.phone}</span>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-4 text-sm">
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
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{isNew ? "Add Salesperson" : "Edit Salesperson"}</DialogTitle>
            </DialogHeader>
            {editItem && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm">Full Name</Label>
                  <Input value={editItem.name} onChange={(e) => setEditItem({ ...editItem, name: e.target.value })} placeholder="e.g. Rajesh Kumar" className="h-12 rounded-lg" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Phone</Label>
                    <Input value={editItem.phone} onChange={(e) => setEditItem({ ...editItem, phone: e.target.value })} placeholder="+91 98100 55555" className="h-12 rounded-lg" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Region</Label>
                    <Input value={editItem.region} onChange={(e) => setEditItem({ ...editItem, region: e.target.value })} placeholder="North" className="h-12 rounded-lg" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Email</Label>
                  <Input value={editItem.email} onChange={(e) => setEditItem({ ...editItem, email: e.target.value })} placeholder="name@company.com" className="h-12 rounded-lg" />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditItem(null)}>Cancel</Button>
              <Button onClick={save}>{isNew ? "Add Salesperson" : "Save Changes"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Profile Dialog */}
        <Dialog open={!!profileId} onOpenChange={() => setProfileId(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            {profilePerson && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-xl">{profilePerson.name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg border border-border bg-muted/20 p-4">
                      <span className="text-xs text-muted-foreground">Phone</span>
                      <p className="mt-1 text-sm font-medium">{profilePerson.phone}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/20 p-4">
                      <span className="text-xs text-muted-foreground">Email</span>
                      <p className="mt-1 text-sm font-medium">{profilePerson.email}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/20 p-4">
                      <span className="text-xs text-muted-foreground">Region</span>
                      <p className="mt-1 text-sm font-medium">{profilePerson.region}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/20 p-4">
                      <span className="text-xs text-muted-foreground">Total Value</span>
                      <p className="mt-1 text-sm font-medium">{formatCurrency(profilePerson.totalValue)}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="mb-3 text-sm font-semibold">Order History</h3>
                    {profileOrders.length > 0 ? (
                      <div className="rounded-lg border border-border overflow-hidden">
                        <table className="w-full text-sm">
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
