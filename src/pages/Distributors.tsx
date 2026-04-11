import { useState, useMemo } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { usePagination } from "@/hooks/use-pagination";
import { ListPagination } from "@/components/ui/list-pagination";
import { usePageLoading } from "@/hooks/use-loading";
import { ListPageSkeleton } from "@/components/ui/page-skeleton";
import { motion } from "framer-motion";
import { Search, MapPin, Phone, ShoppingCart, Plus, Pencil, Trash2, Download, FileText } from "lucide-react";
import { exportCsv, csvFilename } from "@/utils/exportCsv";
import { downloadPdf, pdfFilename, formatCurrencyPdf } from "@/utils/exportPdf";
import { ReportPdf } from "@/components/pdf/ReportPdf";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layout/AppLayout";
import { formatCurrency, formatNumber, type Distributor } from "@/data/mock-data";
import { StatusBadge } from "@/components/ui/status-badge";
import { useApi } from "@/services/api";
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
import { formatIndianDate } from "@/utils/formatDate";

export default function Distributors() {
  const api = useApi();
  const items = api.dealers.list();
  const orders = api.orders.list();
  const addDistributor = api.dealers.create;
  const updateDistributor = api.dealers.update;
  const deleteDistributor = api.dealers.remove;
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
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

  const confirmDelete = () => {
    if (!deleteId) return;
    const d = items.find((i) => i.id === deleteId);
    deleteDistributor(deleteId);
    toast.success("Dealer removed", { description: `${d?.name} has been removed.` });
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
              className="flex-1 sm:flex-none"
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
            className="h-11 rounded-lg pl-10 md:h-12 md:max-w-md"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-3">
          {paginatedDealers.map((d, i) => (
            <motion.div
              key={d.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i, 8) * 0.05, duration: 0.3 }}
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
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-10 w-10 active:scale-95" onClick={(e) => openEdit(d, e)} aria-label={`Edit ${d.name}`}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-10 w-10 text-destructive active:scale-95" onClick={(e) => { e.stopPropagation(); setDeleteId(d.id); }} aria-label={`Delete ${d.name}`}>
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

        <ListPagination page={page} totalPages={totalPages} onPageChange={setPage} />

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Search className="h-10 w-10 text-muted-foreground/50" strokeWidth={1.5} />
            <p className="mt-3 text-sm font-medium">No dealers found</p>
            <p className="text-xs text-muted-foreground">Add your first dealer to get started</p>
            <Button size="sm" className="mt-3" onClick={openNew}>
              <Plus className="h-4 w-4" />
              Add Dealer
            </Button>
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
                  <Label className="text-xs md:text-sm">Dealer Name *</Label>
                  <Input value={editItem.name} onChange={(e) => setEditItem({ ...editItem, name: e.target.value })} placeholder="e.g. Sharma Traders" className="h-11 rounded-lg md:h-12" />
                </div>
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div className="space-y-1.5 md:space-y-2">
                    <Label className="text-xs md:text-sm">Location</Label>
                    <Input value={editItem.location} onChange={(e) => setEditItem({ ...editItem, location: e.target.value })} placeholder="e.g. Kochi, Kerala" className="h-11 rounded-lg md:h-12" />
                  </div>
                  <div className="space-y-1.5 md:space-y-2">
                    <Label className="text-xs md:text-sm">Contact *</Label>
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
                  <div className="flex items-center justify-between">
                    <DialogTitle className="text-base md:text-lg">{selected.name}</DialogTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5"
                      onClick={() => {
                        const rows = [
                          ["Location", selected.location],
                          ["Contact", selected.contact],
                          ["Total Orders", String(selected.totalOrders)],
                          ["Total Value", formatCurrencyPdf(selected.totalValue)],
                        ];
                        selectedOrders.forEach((o) => {
                          rows.push([o.orderNumber, `${o.distributorName} — ${formatCurrencyPdf(o.total)}`]);
                        });
                        downloadPdf(
                          pdfFilename("dealer", selected.name.replace(/\s+/g, "-")),
                          ReportPdf({ title: selected.name, subtitle: "Dealer Profile", headers: ["Field", "Value"], rows, companyName: "" })
                        );
                      }}
                    >
                      <FileText className="h-3.5 w-3.5" />
                      Export PDF
                    </Button>
                  </div>
                </DialogHeader>
                <div className="space-y-4 md:space-y-6">
                  <div className="grid grid-cols-2 gap-3 md:gap-4">
                     <div className="rounded-lg border border-border bg-muted/30 p-3 md:p-4">
                       <span className="text-xs text-muted-foreground">Location</span>
                       <p className="mt-0.5 text-xs font-medium md:mt-1 md:text-sm">{selected.location}</p>
                     </div>
                     <div className="rounded-lg border border-border bg-muted/30 p-3 md:p-4">
                       <span className="text-xs text-muted-foreground">Contact</span>
                       <p className="mt-0.5 text-xs font-medium md:mt-1 md:text-sm">{selected.contact}</p>
                     </div>
                     <div className="rounded-lg border border-border bg-muted/30 p-3 md:p-4">
                       <span className="text-xs text-muted-foreground">Total Orders</span>
                       <p className="mt-0.5 text-xs font-medium md:mt-1 md:text-sm">{formatNumber(selected.totalOrders)}</p>
                     </div>
                     <div className="rounded-lg border border-border bg-muted/30 p-3 md:p-4">
                       <span className="text-xs text-muted-foreground">Total Value</span>
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
                                <td className="px-4 py-3 text-muted-foreground">{formatIndianDate(o.date)}</td>
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
                                <span className="text-xs text-muted-foreground">{formatIndianDate(o.date)}</span>
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
