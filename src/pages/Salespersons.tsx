import { useState, useMemo } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { usePagination } from "@/hooks/use-pagination";
import { ListPagination } from "@/components/ui/list-pagination";
import { usePageLoading } from "@/hooks/use-loading";
import { ListPageSkeleton } from "@/components/ui/page-skeleton";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Search, Pencil, Trash2, UserCheck, Phone, MapPin, Download } from "lucide-react";
import { exportCsv, csvFilename } from "@/utils/exportCsv";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppLayout } from "@/components/layout/AppLayout";
import { formatCurrency, type Salesperson } from "@/data/mock-data";
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

export default function Salespersons() {
  const api = useApi();
  const navigate = useNavigate();
  const items = api.salespersons.list();
  const addSalesperson = api.salespersons.create;
  const updateSalesperson = api.salespersons.update;
  const deleteSalesperson = api.salespersons.remove;
  const [search, setSearch] = useState("");
  const [editItem, setEditItem] = useState<Salesperson | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const isLoading = usePageLoading(api.loading);
  const debouncedSearch = useDebounce(search);

  const filtered = useMemo(() => items.filter(
    (s) =>
      s.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      s.region.toLowerCase().includes(debouncedSearch.toLowerCase())
  ), [items, debouncedSearch]);

  const { page, totalPages, from, to, setPage } = usePagination(filtered.length);
  const paginatedSales = useMemo(() => filtered.slice(from, to), [filtered, from, to]);
  const deletePerson = deleteId ? items.find((s) => s.id === deleteId) : null;

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
    if (!editItem?.name.trim()) { toast.error("Name required"); return; }
    if (!editItem?.phone.trim()) { toast.error("Phone required"); return; }
    if (!editItem?.region.trim()) { toast.error("Region required"); return; }
    if (editItem.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editItem.email)) { toast.error("Invalid email"); return; }
    if (isNew) {
      addSalesperson(editItem);
      toast.success("Team member added", { description: `${editItem.name} has been added.` });
    } else {
      updateSalesperson(editItem);
      toast.success("Team member updated", { description: `${editItem.name} has been updated.` });
    }
    setEditItem(null);
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    const s = items.find((i) => i.id === deleteId);
    deleteSalesperson(deleteId);
    toast.success("Team member removed", { description: `${s?.name} has been removed.` });
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
            <h1 className="text-xl font-bold tracking-tight md:text-2xl">Sales Team</h1>
            <p className="mt-0.5 text-xs text-muted-foreground md:mt-1 md:text-sm">Manage your sales team</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 sm:h-10 sm:w-auto sm:px-4"
              onClick={() => {
                exportCsv(
                  csvFilename("sales-team"),
                  ["Name", "Phone", "Email", "Region", "Total Orders", "Total Value"],
                  filtered.map((s) => [s.name, s.phone, s.email, s.region, String(s.totalOrders), formatCurrency(s.totalValue)])
                );
              }}
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export CSV</span>
            </Button>
            <Button onClick={openNew} className="flex-1 sm:flex-none">
              <Plus className="h-4 w-4" />
              Add Member
            </Button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search sales team..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-10 rounded-lg pl-10 md:max-w-md" />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-3">
          {paginatedSales.map((s, i) => (
            <div
              key={s.id}
              onClick={() => navigate(`/salespersons/${s.id}`)}
              className="cursor-pointer glass-card card-hover p-4 md:p-6"
            >
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5 md:gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 md:h-10 md:w-10">
                    <UserCheck className="h-4 w-4 text-primary md:h-5 md:w-5" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold md:text-base">{s.name}</h3>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground md:text-xs">
                      <MapPin className="h-3 w-3" strokeWidth={1.5} />
                      {s.region}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-10 w-10 active:scale-95" onClick={(e) => openEdit(s, e)} aria-label={`Edit ${s.name}`}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-10 w-10 text-destructive active:scale-95" onClick={(e) => { e.stopPropagation(); setDeleteId(s.id); }} aria-label={`Delete ${s.name}`}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground md:mt-3">
                <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{s.phone}</span>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-xs md:mt-4 md:pt-4 md:text-sm">
                <span>{s.totalOrders} orders</span>
                <span className="font-semibold">{formatCurrency(s.totalValue)}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {filtered.length > 0 ? (
          <ListPagination page={page} totalPages={totalPages} onPageChange={setPage} />
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <UserCheck className="h-10 w-10 text-muted-foreground/50" strokeWidth={1.5} />
            <p className="mt-3 text-sm font-medium">No team members found</p>
            <p className="text-xs text-muted-foreground">Add your first team member to get started</p>
            <Button size="sm" className="mt-3" onClick={openNew}>
              <Plus className="h-4 w-4" />
              Add Team Member
            </Button>
          </div>
        )}

        {/* Add/Edit Dialog */}
        {editItem && (
          <Dialog open onOpenChange={() => setEditItem(null)}>
            <DialogContent className="max-w-[calc(100vw-2rem)] rounded-xl sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-base md:text-lg">{isNew ? "Add Team Member" : "Edit Team Member"}</DialogTitle>
                <DialogDescription className="sr-only">{isNew ? "Add a new team member" : "Edit team member details"}</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 md:space-y-4">
                <div className="space-y-1.5 md:space-y-2">
                  <Label className="text-xs md:text-sm">Full Name *</Label>
                  <Input value={editItem.name} onChange={(e) => setEditItem({ ...editItem, name: e.target.value })} placeholder="e.g. Rajesh Kumar" className="h-10 rounded-lg" />
                </div>
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div className="space-y-1.5 md:space-y-2">
                    <Label className="text-xs md:text-sm">Phone *</Label>
                    <Input value={editItem.phone} onChange={(e) => setEditItem({ ...editItem, phone: e.target.value })} placeholder="+91 98100 55555" className="h-10 rounded-lg" />
                  </div>
                  <div className="space-y-1.5 md:space-y-2">
                    <Label className="text-xs md:text-sm">Region *</Label>
                    <Input value={editItem.region} onChange={(e) => setEditItem({ ...editItem, region: e.target.value })} placeholder="North" className="h-10 rounded-lg" />
                  </div>
                </div>
                <div className="space-y-1.5 md:space-y-2">
                  <Label className="text-xs md:text-sm">Email</Label>
                  <Input value={editItem.email} onChange={(e) => setEditItem({ ...editItem, email: e.target.value })} placeholder="name@company.com" className="h-10 rounded-lg" />
                </div>
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => setEditItem(null)}>Cancel</Button>
                <Button onClick={save}>{isNew ? "Add Member" : "Save Changes"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Delete Confirmation */}
        {deleteId && (
          <AlertDialog open onOpenChange={() => setDeleteId(null)}>
            <AlertDialogContent className="max-w-[calc(100vw-2rem)] rounded-xl sm:max-w-md">
              <AlertDialogHeader>
                <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to remove <span className="font-semibold text-foreground">{deletePerson?.name}</span>? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <Button variant="destructive" onClick={confirmDelete}>Remove</Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </AppLayout>
  );
}
