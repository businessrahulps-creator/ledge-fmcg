import { useState, useMemo } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { usePagination } from "@/hooks/use-pagination";
import { ListPagination } from "@/components/ui/list-pagination";
import { usePageLoading } from "@/hooks/use-loading";

import { useNavigate } from "react-router-dom";

import { Plus, Search, Pencil, Trash2, UserCheck, Download } from "lucide-react";
import { exportXlsx, xlsxFilename } from "@/utils/exportXlsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppLayout } from "@/components/layout/AppLayout";
import { KpiStrip } from "@/components/ui/kpi-strip";
import { EmptyCard } from "@/components/ui/empty-card";
import { EntityAvatar } from "@/components/ui/entity-avatar";
import { EntityCard } from "@/components/ui/entity-card";
import { formatCurrency, type Salesperson } from "@/data/mock-data";
import { useApi } from "@/services/api";
import { isValidIndianPhone, normalizeIndianPhone } from "@/utils/validators";
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
  const orders = api.orders.list();

  // dealers-served per salesperson (distinct dealerIds)
  const dealersServedBySp = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const o of orders) {
      if (!o.salespersonId) continue;
      const set = map.get(o.salespersonId) ?? new Set<string>();
      set.add(o.distributorId);
      map.set(o.salespersonId, set);
    }
    return map;
  }, [orders]);
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
    if (!isValidIndianPhone(editItem.phone)) { toast.error("Invalid phone", { description: "Enter a valid 10-digit Indian mobile number." }); return; }
    if (!editItem?.region.trim()) { toast.error("Region required"); return; }
    if (editItem.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editItem.email)) { toast.error("Invalid email"); return; }
    const normalizedPhone = normalizeIndianPhone(editItem.phone);
    const itemToSave = { ...editItem, phone: normalizedPhone || editItem.phone.trim() };
    if (isNew) {
      addSalesperson(itemToSave);
      toast.success("Team member added", { description: `${itemToSave.name} has been added.` });
    } else {
      updateSalesperson(itemToSave);
      toast.success("Team member updated", { description: `${itemToSave.name} has been updated.` });
    }
    setEditItem(null);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const s = items.find((i) => i.id === deleteId);
    const ok = await deleteSalesperson(deleteId);
    if (ok) toast.success("Team member removed", { description: `${s?.name} has been removed.` });
    setDeleteId(null);
  };

  // Blocking page skeleton removed — empty-state handles first-paint.

  return (
    <AppLayout>
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="h1-display">Sales Team</h1>
            <p className="mt-0.5 text-xs text-muted-foreground md:mt-1 md:text-sm">Manage your sales team</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 sm:h-10 sm:w-auto sm:px-4"
              aria-label="Export CSV"
              onClick={() => {
                exportXlsx(
                  xlsxFilename("sales-team"),
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

        {(() => {
          const totalRevenue = items.reduce((s, m) => s + (m.totalValue || 0), 0);
          const totalOrders = items.reduce((s, m) => s + (m.totalOrders || 0), 0);
          const top = items.length > 0 ? items.reduce((a, b) => (b.totalValue || 0) > (a.totalValue || 0) ? b : a) : null;
          return (
            <KpiStrip
              cells={[
                { label: "Team size", value: items.length, zero: items.length === 0 },
                { label: "Total revenue", value: formatCurrency(totalRevenue), zero: totalRevenue === 0 },
                { label: "Total orders", value: totalOrders, zero: totalOrders === 0 },
                { label: "Top performer", value: top?.name || "—", zero: !top },
              ]}
            />
          );
        })()}

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search sales team..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-10 rounded-lg pl-10 md:max-w-md" />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-3">
          {paginatedSales.map((s) => {
            const avgOrder = s.totalOrders > 0 ? s.totalValue / s.totalOrders : 0;
            const dealersServed = dealersServedBySp.get(s.id)?.size ?? 0;
            const tier: "success" | "warning" | "muted" =
              s.totalValue > 0 ? "success" : s.totalOrders > 0 ? "warning" : "muted";
            return (
              <EntityCard
                key={s.id}
                tier={tier}
                avatar={<EntityAvatar name={s.name} size="md" />}
                title={s.name}
                subtitle={s.region || undefined}
                tertiary={s.phone || undefined}
                hero={{
                  value: formatCurrency(s.totalValue),
                  label: "Lifetime revenue",
                }}
                cells={[
                  { label: "Orders", value: s.totalOrders, zero: s.totalOrders === 0 },
                  { label: "Avg order", value: avgOrder > 0 ? formatCurrency(avgOrder) : "—", zero: avgOrder === 0 },
                  { label: "Dealers", value: dealersServed, zero: dealersServed === 0 },
                ]}
                menu={[
                  { label: "Edit member", icon: Pencil, onSelect: () => openEdit(s, { stopPropagation: () => {} } as React.MouseEvent) },
                  { label: "Remove member", icon: Trash2, destructive: true, separator: true, onSelect: () => setDeleteId(s.id) },
                ]}
                onClick={() => navigate(`/salespersons/${s.id}`)}
              />
            );
          })}
        </div>


        {filtered.length > 0 ? (
          <ListPagination page={page} totalPages={totalPages} onPageChange={setPage} />
        ) : (
          items.length === 0 ? (
            <EmptyCard
              icon={UserCheck}
              title="No team members yet."
              description="Add your first team member to start tracking their orders and revenue."
              actionLabel="Add team member"
              onAction={openNew}
            />
          ) : (
            <EmptyCard
              icon={Search}
              title="No team members match your search."
              description="Try a different name, phone, or region."
            />
          )
        )}

        {/* Add/Edit Dialog */}
        {editItem && (
          <Dialog open onOpenChange={() => setEditItem(null)}>
            <DialogContent className="max-w-[calc(100vw-2rem)] rounded-md sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-base md:text-lg">{isNew ? "Add Team Member" : "Edit Team Member"}</DialogTitle>
                <DialogDescription className="sr-only">{isNew ? "Add a new team member" : "Edit team member details"}</DialogDescription>
              </DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); save(); }}>
              <div className="space-y-3 md:space-y-4">
                <div className="space-y-1.5 md:space-y-2">
                  <Label className="text-xs md:text-sm">Full Name *</Label>
                  <Input autoFocus value={editItem.name} onChange={(e) => setEditItem({ ...editItem, name: e.target.value })} placeholder="e.g. Rajesh Kumar" className="h-10 rounded-lg" />
                </div>
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div className="space-y-1.5 md:space-y-2">
                    <Label className="text-xs md:text-sm">Phone *</Label>
                    <Input type="tel" inputMode="tel" autoComplete="tel" value={editItem.phone} onChange={(e) => setEditItem({ ...editItem, phone: e.target.value })} placeholder="+91 98100 55555" className="h-10 rounded-lg" />
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
              <DialogFooter className="gap-2 sm:gap-0 mt-4">
                <Button type="button" variant="outline" onClick={() => setEditItem(null)}>Cancel</Button>
                <Button type="submit">{isNew ? "Add Member" : "Save Changes"}</Button>
              </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}

        {/* Delete Confirmation */}
        {deleteId && (
          <AlertDialog open onOpenChange={() => setDeleteId(null)}>
            <AlertDialogContent className="max-w-[calc(100vw-2rem)] rounded-md sm:max-w-md">
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
