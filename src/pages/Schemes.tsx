import { useState, useCallback, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useApi } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { usePageLoading } from "@/hooks/use-loading";

import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/data/mock-data";
import type { Scheme } from "@/data/mock-data";
import { toast } from "sonner";
import {
  Plus,
  Gift,
  Percent,
  Tag,
  Package,
  Pencil,
  Trash2,
  Search,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

const SCHEME_TYPES = [
  { value: "percentage", label: "Percentage Discount", icon: Percent, description: "e.g. 10% off on orders above ₹5,000" },
  { value: "buy_x_get_y", label: "Buy X Get Y Free", icon: Gift, description: "e.g. Buy 10 packs, get 2 free" },
  { value: "flat_discount", label: "Flat Discount", icon: Tag, description: "e.g. ₹500 off on orders above ₹10,000" },
] as const;

function getSchemeLabel(s: Scheme): string {
  switch (s.schemeType) {
    case "percentage":
      return `${s.discountPercent}% Off${s.minOrderValue > 0 ? ` on orders above ${formatCurrency(s.minOrderValue)}` : ""}`;
    case "buy_x_get_y":
      return `Buy ${s.buyQty} Get ${s.freeQty} Free`;
    case "flat_discount":
      return `${formatCurrency(s.flatAmount)} Off${s.minOrderValue > 0 ? ` on orders above ${formatCurrency(s.minOrderValue)}` : ""}`;
    default:
      return s.name;
  }
}

function getSchemeIcon(type: string) {
  switch (type) {
    case "percentage": return Percent;
    case "buy_x_get_y": return Gift;
    case "flat_discount": return Tag;
    default: return Gift;
  }
}

const emptyScheme: Omit<Scheme, "id"> = {
  name: "",
  description: "",
  schemeType: "percentage",
  discountPercent: 10,
  buyQty: 10,
  freeQty: 2,
  flatAmount: 500,
  minOrderValue: 0,
  minQty: 0,
  productId: null,
  dealerId: null,
  isActive: true,
  validFrom: new Date().toISOString().split("T")[0],
  validUntil: null,
};

export default function Schemes() {
  const api = useApi();
  const { userRole } = useAuth();
  const isLoading = usePageLoading(api.loading);
  const isSuperAdmin = userRole === "super_admin";

  const schemes = api.schemes.list();
  const products = api.products.list();
  const dealers = api.dealers.list();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingScheme, setEditingScheme] = useState<Scheme | null>(null);
  const [form, setForm] = useState<Omit<Scheme, "id">>(emptyScheme);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const handleRefresh = useCallback(async () => {
    if (api.refreshAll) await api.refreshAll();
    else await new Promise((r) => setTimeout(r, 600));
  }, [api]);

  const { containerRef, pullDistance, refreshing } = usePullToRefresh({ onRefresh: handleRefresh });

  const openAdd = () => {
    setEditingScheme(null);
    setForm(emptyScheme);
    setDialogOpen(true);
  };

  const openEdit = (s: Scheme) => {
    setEditingScheme(s);
    setForm({
      name: s.name, description: s.description, schemeType: s.schemeType,
      discountPercent: s.discountPercent, buyQty: s.buyQty, freeQty: s.freeQty,
      flatAmount: s.flatAmount, minOrderValue: s.minOrderValue, minQty: s.minQty,
      productId: s.productId, dealerId: s.dealerId, isActive: s.isActive,
      validFrom: s.validFrom, validUntil: s.validUntil,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      toast.error("Name required", { description: "Please enter a scheme name." });
      return;
    }
    if (editingScheme) {
      api.schemes.update({ ...editingScheme, ...form });
      toast.success("Scheme updated");
    } else {
      api.schemes.create({ id: crypto.randomUUID(), ...form });
      toast.success("Scheme created");
    }
    setDialogOpen(false);
  };

  const handleToggle = (s: Scheme) => {
    api.schemes.update({ ...s, isActive: !s.isActive });
    toast.success(s.isActive ? "Scheme deactivated" : "Scheme activated");
  };

  const confirmDelete = async () => {
    if (deleteId) {
      const ok = await api.schemes.remove(deleteId);
      if (ok) toast.success("Scheme deleted");
      setDeleteId(null);
    }
  };

  const filteredSchemes = useMemo(() => {
    if (!search.trim()) return schemes;
    const q = search.toLowerCase();
    return schemes.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.schemeType.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      (s.productId && products.find(p => p.id === s.productId)?.name.toLowerCase().includes(q)) ||
      (s.dealerId && dealers.find(d => d.id === s.dealerId)?.name.toLowerCase().includes(q))
    );
  }, [schemes, search, products, dealers]);

  const activeSchemes = filteredSchemes.filter(s => s.isActive);
  const inactiveSchemes = filteredSchemes.filter(s => !s.isActive);

  // Blocking page skeleton removed — empty-state handles first-paint.

  return (
    <AppLayout>
      <div ref={containerRef} className="relative">
        {/* Pull-to-refresh */}
        <div
          className="flex items-center justify-center overflow-hidden transition-[height] duration-200 ease-out"
          style={{ height: pullDistance > 0 || refreshing ? `${Math.max(pullDistance, refreshing ? 48 : 0)}px` : "0px" }}
        >
          <div
            className={cn("h-5 w-5 rounded-full border-2 border-primary border-t-transparent", refreshing ? "animate-spin" : "")}
            style={{ opacity: Math.min(pullDistance / 80, 1), transform: `rotate(${pullDistance * 3}deg)` }}
          />
        </div>

        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Schemes</h1>
              <p className="text-sm text-muted-foreground">
                Create offers and discounts that automatically apply to orders
              </p>
            </div>
            {isSuperAdmin && (
              <Button onClick={openAdd} className="gap-1.5">
                <Plus className="h-4 w-4" />
                New Scheme
              </Button>
            )}
          </div>

          {/* Search */}
          {schemes.length > 0 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search schemes by name, type, product, dealer…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          )}

          {/* Empty state */}
          {schemes.length === 0 && (
            <div className="glass-card rounded-md p-8 text-center">
              <Gift className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
              <h3 className="text-sm font-semibold">No schemes yet</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Create your first scheme to automatically apply discounts to orders
              </p>
              {isSuperAdmin && (
                <Button onClick={openAdd} variant="outline" className="mt-4 gap-1.5" size="sm">
                  <Plus className="h-3.5 w-3.5" />
                  Create Scheme
                </Button>
              )}
            </div>
          )}

          {/* Active Schemes */}
          {activeSchemes.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/80">
                Active Schemes ({activeSchemes.length})
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {activeSchemes.map(s => (
                  <SchemeCard
                    key={s.id}
                    scheme={s}
                    products={products}
                    dealers={dealers}
                    isSuperAdmin={isSuperAdmin}
                    onEdit={() => openEdit(s)}
                    onToggle={() => handleToggle(s)}
                    onDelete={() => setDeleteId(s.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Inactive Schemes */}
          {inactiveSchemes.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/80">
                Inactive ({inactiveSchemes.length})
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {inactiveSchemes.map(s => (
                  <SchemeCard
                    key={s.id}
                    scheme={s}
                    products={products}
                    dealers={dealers}
                    isSuperAdmin={isSuperAdmin}
                    onEdit={() => openEdit(s)}
                    onToggle={() => handleToggle(s)}
                    onDelete={() => setDeleteId(s.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[calc(100vw-2rem)] rounded-md sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingScheme ? "Edit Scheme" : "New Scheme"}</DialogTitle>
            <DialogDescription className="sr-only">{editingScheme ? "Edit scheme details" : "Create a new scheme"}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Scheme Name *</Label>
              <Input
                autoFocus
                placeholder="e.g. Diwali Special Offer"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Description (optional)</Label>
              <Textarea
                placeholder="Describe this scheme in plain English..."
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="min-h-[60px]"
              />
            </div>

            {/* Type selector */}
            <div className="space-y-1.5">
              <Label className="text-xs">Scheme Type</Label>
              <div className="grid gap-2">
                {SCHEME_TYPES.map(t => (
                  <button
                    key={t.value}
                    onClick={() => setForm(f => ({ ...f, schemeType: t.value }))}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-all",
                      form.schemeType === t.value
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                        : "border-border hover:border-foreground/20"
                    )}
                  >
                    <t.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="text-xs font-medium">{t.label}</p>
                      <p className="text-[11px] text-muted-foreground">{t.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Type-specific fields */}
            {form.schemeType === "percentage" && (
              <div className="space-y-1.5">
                <Label className="text-xs">Discount Percentage (%)</Label>
                <NumberInput
                  allowDecimal
                  allowEmpty={false}
                  min={0}
                  max={100}
                  value={form.discountPercent}
                  onValueChange={v => setForm(f => ({ ...f, discountPercent: v ?? 0 }))}
                />
              </div>
            )}

            {form.schemeType === "buy_x_get_y" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Buy Quantity</Label>
                  <NumberInput
                    allowEmpty={false}
                    min={1}
                    value={form.buyQty}
                    onValueChange={v => setForm(f => ({ ...f, buyQty: v ?? 1 }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Get Free Quantity</Label>
                  <NumberInput
                    allowEmpty={false}
                    min={1}
                    value={form.freeQty}
                    onValueChange={v => setForm(f => ({ ...f, freeQty: v ?? 1 }))}
                  />
                </div>
              </div>
            )}

            {form.schemeType === "flat_discount" && (
              <div className="space-y-1.5">
                <Label className="text-xs">Discount Amount (₹)</Label>
                <NumberInput
                  allowDecimal
                  allowEmpty={false}
                  min={0}
                  value={form.flatAmount}
                  onValueChange={v => setForm(f => ({ ...f, flatAmount: v ?? 0 }))}
                />
              </div>
            )}

            {/* Conditions */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Min Order Value (₹)</Label>
                <NumberInput
                  allowDecimal
                  allowEmpty={false}
                  min={0}
                  value={form.minOrderValue}
                  onValueChange={v => setForm(f => ({ ...f, minOrderValue: v ?? 0 }))}
                  placeholder="0 = no minimum"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Min Product Qty</Label>
                <NumberInput
                  allowEmpty={false}
                  min={0}
                  value={form.minQty}
                  onValueChange={v => setForm(f => ({ ...f, minQty: v ?? 0 }))}
                  placeholder="0 = no minimum"
                />
              </div>
            </div>

            {/* Product & Dealer filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Specific Product (optional)</Label>
                <Select
                  value={form.productId || "all"}
                  onValueChange={v => setForm(f => ({ ...f, productId: v === "all" ? null : v }))}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="All products" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Products</SelectItem>
                    {products.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Specific Dealer (optional)</Label>
                <Select
                  value={form.dealerId || "all"}
                  onValueChange={v => setForm(f => ({ ...f, dealerId: v === "all" ? null : v }))}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="All dealers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Dealers</SelectItem>
                    {dealers.map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Validity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Valid From</Label>
                <Input
                  type="date"
                  value={form.validFrom}
                  onChange={e => setForm(f => ({ ...f, validFrom: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Valid Until (optional)</Label>
                <Input
                  type="date"
                  value={form.validUntil || ""}
                  onChange={e => setForm(f => ({ ...f, validUntil: e.target.value || null }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>
              {editingScheme ? "Save Changes" : "Create Scheme"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="max-w-[calc(100vw-2rem)] rounded-md sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Scheme</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this scheme? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}

// --- Scheme Card Component ---
function SchemeCard({
  scheme: s,
  products,
  dealers,
  isSuperAdmin,
  onEdit,
  onToggle,
  onDelete,
}: {
  scheme: Scheme;
  products: { id: string; name: string }[];
  dealers: { id: string; name: string }[];
  isSuperAdmin: boolean;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const Icon = getSchemeIcon(s.schemeType);
  const product = s.productId ? products.find(p => p.id === s.productId) : null;
  const dealer = s.dealerId ? dealers.find(d => d.id === s.dealerId) : null;

  const today = new Date().toISOString().split("T")[0];
  const isExpired = s.validUntil && s.validUntil < today;
  const isUpcoming = s.validFrom > today;

  return (
    <div className={cn(
      "glass-card rounded-md p-4 transition-all",
      !s.isActive && "opacity-60",
    )}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg",
            s.isActive ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
          )}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{s.name}</p>
            <p className="text-xs text-muted-foreground">{getSchemeLabel(s)}</p>
          </div>
        </div>
        {isSuperAdmin && (
          <Switch checked={s.isActive} onCheckedChange={onToggle} />
        )}
      </div>

      {s.description && (
        <p className="mt-2 text-[11px] text-muted-foreground leading-relaxed line-clamp-2">{s.description}</p>
      )}

      <div className="mt-3 flex flex-wrap gap-1.5">
        {isExpired && <Badge variant="destructive" className="text-[10px]">Expired</Badge>}
        {isUpcoming && <Badge variant="secondary" className="text-[10px]">Upcoming</Badge>}
        {product && (
          <Badge variant="outline" className="text-[10px] gap-1">
            <Package className="h-2.5 w-2.5" />
            {product.name}
          </Badge>
        )}
        {dealer && (
          <Badge variant="outline" className="text-[10px]">{dealer.name}</Badge>
        )}
        {s.minOrderValue > 0 && (
          <Badge variant="outline" className="text-[10px]">Min {formatCurrency(s.minOrderValue)}</Badge>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>
          {s.validFrom}{s.validUntil ? ` → ${s.validUntil}` : " onwards"}
        </span>
        {isSuperAdmin && (
          <div className="flex gap-1">
            <button onClick={onEdit} className="rounded p-1 hover:bg-muted transition-colors">
              <Pencil className="h-3 w-3" />
            </button>
            <button onClick={onDelete} className="rounded p-1 hover:bg-destructive/10 hover:text-destructive transition-colors">
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
