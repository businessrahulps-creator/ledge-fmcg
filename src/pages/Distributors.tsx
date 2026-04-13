import { useState, useMemo } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { usePagination } from "@/hooks/use-pagination";
import { ListPagination } from "@/components/ui/list-pagination";
import { usePageLoading } from "@/hooks/use-loading";
import { ListPageSkeleton } from "@/components/ui/page-skeleton";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, MapPin, Phone, ShoppingCart, Plus, Pencil, Trash2, Download } from "lucide-react";
import { exportCsv, csvFilename } from "@/utils/exportCsv";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layout/AppLayout";
import { formatCurrency, type Distributor } from "@/data/mock-data";
import { useApi } from "@/services/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  const api = useApi();
  const navigate = useNavigate();
  const items = api.dealers.list();
  const addDistributor = api.dealers.create;
  const updateDistributor = api.dealers.update;
  const deleteDistributor = api.dealers.remove;
  const [search, setSearch] = useState("");
  const [editItem, setEditItem] = useState<Distributor | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  

  const isLoading = usePageLoading(api.loading);
  const debouncedSearch = useDebounce(search);

  const filtered = useMemo(() => items.filter(
    (d) =>
      d.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      d.location.toLowerCase().includes(debouncedSearch.toLowerCase())
  ), [items, debouncedSearch]);

  const { page, totalPages, from, to, setPage } = usePagination(filtered.length);
  const paginatedDealers = useMemo(() => filtered.slice(from, to), [filtered, from, to]);
  const deleteDealer = deleteId ? items.find((d) => d.id === deleteId) : null;
  const allOrders = api.orders.list();
  const deleteDealerOrderCount = deleteId ? allOrders.filter(o => o.distributorId === deleteId).length : 0;

  const openNew = () => {
    setEditItem({ id: `d${Date.now()}`, name: "", location: "", contact: "", email: "", address: "", gstin: "", pan: "", stateCode: "", bankName: "", bankAccountName: "", bankAccount: "", bankIfsc: "", totalOrders: 0, totalValue: 0, creditLimit: 0, outstandingAmount: 0 });
    setIsNew(true);
  };

  const openEdit = (d: Distributor, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditItem({ ...d });
    setIsNew(false);
  };

  const save = () => {
    if (!editItem?.name.trim()) {
      toast.error("Name required", { description: "Please enter a dealer name." });
      return;
    }
    if (!editItem?.contact.trim()) {
      toast.error("Contact required", { description: "Please enter a contact number." });
      return;
    }
    if (isNew) {
      addDistributor(editItem);
      toast.success("Dealer added", { description: `${editItem.name} has been added.` });
    } else {
      updateDistributor(editItem);
      toast.success("Dealer updated", { description: `${editItem.name} has been updated.` });
    }
    setEditItem(null);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const d = items.find((i) => i.id === deleteId);
    const ok = await deleteDistributor(deleteId);
    if (ok) toast.success("Dealer removed", { description: `${d?.name} has been removed.` });
    setDeleteId(null);
  };

  if (isLoading) {
    return <AppLayout><ListPageSkeleton /></AppLayout>;
  }

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
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 sm:h-10 sm:w-auto sm:px-4"
              aria-label="Export CSV"
              onClick={() => {
                exportCsv(
                  csvFilename("dealers"),
                  ["Name", "Location", "Contact", "Total Orders", "Total Value"],
                  filtered.map((d) => [
                    d.name,
                    d.location,
                    d.contact,
                    String(d.totalOrders),
                    formatCurrency(d.totalValue),
                  ])
                );
              }}
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export CSV</span>
            </Button>
            <Button onClick={openNew} className="flex-1 sm:flex-none">
              <Plus className="h-4 w-4" />
              Add Dealer
            </Button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search dealers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 rounded-lg pl-10 md:max-w-md"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-3">
          {paginatedDealers.map((d, i) => (
            <div
              key={d.id}
              onClick={() => navigate(`/distributors/${d.id}`)}
              className="cursor-pointer glass-card card-hover p-4 md:p-6"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold md:text-base">{d.name}</h3>
                  {d.location && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground md:mt-2 md:text-sm">
                      <MapPin className="h-3 w-3 md:h-3.5 md:w-3.5" strokeWidth={1.5} />
                      {d.location}
                    </div>
                  )}
                  {d.contact && (
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground md:text-sm">
                      <Phone className="h-3 w-3 md:h-3.5 md:w-3.5" strokeWidth={1.5} />
                      {d.contact}
                    </div>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-10 w-10 active:scale-95" onClick={(e) => openEdit(d, e)} aria-label={`Edit ${d.name}`}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-10 w-10 text-destructive active:scale-95" onClick={(e) => { e.stopPropagation(); setDeleteId(d.id); }} aria-label={`Delete ${d.name}`}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3 md:mt-4 md:pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs md:text-sm">
                    <ShoppingCart className="h-3 w-3 text-muted-foreground md:h-3.5 md:w-3.5" strokeWidth={1.5} />
                    <span>{d.totalOrders} {d.totalOrders === 1 ? "order" : "orders"}</span>
                  </div>
                  <span className="text-xs font-semibold md:text-sm">{formatCurrency(d.totalValue)}</span>
                </div>
                {(() => {
                  const limit = d.creditLimit || 0;
                  const outstanding = d.outstandingAmount || 0;
                  if (limit === 0 && outstanding === 0) return null;
                  const pct = limit > 0 ? (outstanding / limit) * 100 : 0;
                  const color = limit === 0 ? "text-muted-foreground" : pct >= 100 ? "text-red-600 dark:text-red-400" : pct >= 70 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400";
                  const bgColor = limit === 0 ? "bg-muted/50" : pct >= 100 ? "bg-red-500/10" : pct >= 70 ? "bg-amber-500/10" : "bg-emerald-500/10";
                  return (
                    <div className={`flex items-center justify-between rounded-md px-2 py-1 text-[11px] font-medium ${bgColor} ${color}`}>
                      <span>Outstanding</span>
                      <span>{formatCurrency(outstanding)} / {limit > 0 ? formatCurrency(limit) : "Unlimited"}</span>
                    </div>
                  );
                })()}
              </div>
            </div>
          ))}
        </div>

        {filtered.length > 0 ? (
          <ListPagination page={page} totalPages={totalPages} onPageChange={setPage} />
        ) : (
          <div className="glass-card flex flex-col items-center justify-center py-16 text-center">
            {items.length === 0 ? (
              <>
                <MapPin className="h-10 w-10 text-muted-foreground/50" strokeWidth={1.5} />
                <p className="mt-3 text-sm font-medium">No dealers yet</p>
                <p className="text-xs text-muted-foreground">Add your first dealer to start managing your network</p>
                <Button size="sm" className="mt-3" onClick={openNew}>
                  <Plus className="h-4 w-4" />
                  Add Dealer
                </Button>
              </>
            ) : (
              <>
                <Search className="h-10 w-10 text-muted-foreground/50" strokeWidth={1.5} />
                <p className="mt-3 text-sm font-medium">No dealers match your search</p>
                <p className="text-xs text-muted-foreground">Try a different search term</p>
              </>
            )}
          </div>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
          <DialogContent className="max-w-[calc(100vw-2rem)] max-h-[85vh] overflow-y-auto rounded-xl sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-base md:text-lg">{isNew ? "Add Dealer" : "Edit Dealer"}</DialogTitle>
              <DialogDescription className="sr-only">{isNew ? "Add a new dealer" : "Edit dealer details"}</DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); save(); }}>
            {editItem && (
              <div className="space-y-4 md:space-y-5">
                <div className="space-y-3 md:space-y-4">
                  <div className="space-y-1.5 md:space-y-2">
                    <Label className="text-xs md:text-sm">Dealer Name *</Label>
                    <Input value={editItem.name} onChange={(e) => setEditItem({ ...editItem, name: e.target.value })} placeholder="e.g. Sharma Traders" className="h-10 rounded-lg" />
                  </div>
                  <div className="grid grid-cols-2 gap-3 md:gap-4">
                    <div className="space-y-1.5 md:space-y-2">
                      <Label className="text-xs md:text-sm">Location</Label>
                      <Input value={editItem.location} onChange={(e) => setEditItem({ ...editItem, location: e.target.value })} placeholder="e.g. Kochi, Kerala" className="h-10 rounded-lg" />
                    </div>
                    <div className="space-y-1.5 md:space-y-2">
                      <Label className="text-xs md:text-sm">Contact *</Label>
                      <Input value={editItem.contact} onChange={(e) => setEditItem({ ...editItem, contact: e.target.value })} placeholder="+91 98100 55555" className="h-10 rounded-lg" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 md:gap-4">
                    <div className="space-y-1.5 md:space-y-2">
                      <Label className="text-xs md:text-sm">Email</Label>
                      <Input type="email" value={editItem.email} onChange={(e) => setEditItem({ ...editItem, email: e.target.value })} placeholder="dealer@example.com" className="h-10 rounded-lg" />
                    </div>
                    <div className="space-y-1.5 md:space-y-2">
                      <Label className="text-xs md:text-sm">Credit Limit (₹)</Label>
                      <Input type="number" min={0} value={editItem.creditLimit || ""} onChange={(e) => setEditItem({ ...editItem, creditLimit: parseFloat(e.target.value) || 0 })} placeholder="0 = Unlimited" className="h-10 rounded-lg" />
                    </div>
                  </div>
                </div>
                <div className="border-t border-border/50 pt-4">
                  <div className="space-y-1.5 md:space-y-2">
                    <Label className="text-xs md:text-sm">Address</Label>
                    <textarea value={editItem.address} onChange={(e) => setEditItem({ ...editItem, address: e.target.value })} placeholder="Full business address" className="flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
                  </div>
                </div>
                <div className="border-t border-border/50 pt-4">
                  <h3 className="text-sm font-semibold mb-3">Tax Details</h3>
                  <div className="space-y-3 md:space-y-4">
                    <div className="space-y-1.5 md:space-y-2">
                      <Label className="text-xs md:text-sm">GSTIN</Label>
                      <Input value={editItem.gstin} onChange={(e) => setEditItem({ ...editItem, gstin: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 15) })} maxLength={15} className="h-10 rounded-lg max-w-[300px] font-mono" placeholder="22AAAAA0000A1Z5" />
                      <p className="text-[10px] text-muted-foreground md:text-xs">15-digit GST Identification Number</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                      <div className="space-y-1.5 md:space-y-2">
                        <Label className="text-xs md:text-sm">PAN</Label>
                        <Input value={editItem.pan} onChange={(e) => setEditItem({ ...editItem, pan: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10) })} maxLength={10} className="h-10 rounded-lg font-mono" placeholder="ABCDE1234F" />
                      </div>
                      <div className="space-y-1.5 md:space-y-2">
                        <Label className="text-xs md:text-sm">State Code</Label>
                        <Input value={editItem.stateCode} onChange={(e) => setEditItem({ ...editItem, stateCode: e.target.value.replace(/\D/g, "").slice(0, 2) })} maxLength={2} className="h-10 rounded-lg max-w-[100px] font-mono" placeholder="27" />
                        <p className="text-[10px] text-muted-foreground md:text-xs">2-digit GST state code</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="border-t border-border/50 pt-4">
                  <h3 className="text-sm font-semibold mb-3">Bank Details</h3>
                  <div className="space-y-3 md:space-y-4">
                    <div className="space-y-1.5 md:space-y-2">
                      <Label className="text-xs md:text-sm">Bank Name</Label>
                      <Input value={editItem.bankName} onChange={(e) => setEditItem({ ...editItem, bankName: e.target.value })} className="h-10 rounded-lg" placeholder="State Bank of India" />
                    </div>
                    <div className="space-y-1.5 md:space-y-2">
                      <Label className="text-xs md:text-sm">Account Holder Name</Label>
                      <Input value={editItem.bankAccountName} onChange={(e) => setEditItem({ ...editItem, bankAccountName: e.target.value })} className="h-10 rounded-lg" placeholder="Sharma Traders Pvt Ltd" />
                    </div>
                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                      <div className="space-y-1.5 md:space-y-2">
                        <Label className="text-xs md:text-sm">Account Number</Label>
                        <Input value={editItem.bankAccount} onChange={(e) => setEditItem({ ...editItem, bankAccount: e.target.value.replace(/\D/g, "") })} className="h-10 rounded-lg font-mono" placeholder="1234567890" />
                      </div>
                      <div className="space-y-1.5 md:space-y-2">
                        <Label className="text-xs md:text-sm">IFSC Code</Label>
                        <Input value={editItem.bankIfsc} onChange={(e) => setEditItem({ ...editItem, bankIfsc: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 11) })} maxLength={11} className="h-10 rounded-lg font-mono" placeholder="SBIN0001234" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setEditItem(null)}>Cancel</Button>
              <Button type="submit">{isNew ? "Add Dealer" : "Save Changes"}</Button>
            </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent className="max-w-[calc(100vw-2rem)] rounded-xl sm:max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Dealer</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove <span className="font-semibold text-foreground">{deleteDealer?.name}</span>? This action cannot be undone.
                {deleteDealerOrderCount > 0 && (
                  <span className="mt-2 block text-destructive font-medium">
                    ⚠ This dealer has {deleteDealerOrderCount} order{deleteDealerOrderCount > 1 ? "s" : ""} linked. Removing will leave those orders without a dealer reference.
                  </span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <Button variant="destructive" onClick={confirmDelete}>Remove</Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
    </AppLayout>
  );
}
