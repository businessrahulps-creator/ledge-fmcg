import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Pencil, Trash2, Package, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppLayout } from "@/components/layout/AppLayout";
import { products as initialProducts, formatCurrency, formatNumber, type Product } from "@/data/mock-data";
import { stockItems } from "@/data/godown-data";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

export default function Products() {
  const [items, setItems] = useState<Product[]>(initialProducts);
  const [search, setSearch] = useState("");
  const [editItem, setEditItem] = useState<Product | null>(null);
  const [isNew, setIsNew] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const getProductStock = (productId: string) => {
    const entries = stockItems.filter(si => si.productId === productId);
    return entries.reduce((sum, si) => sum + si.quantity, 0);
  };

  const filtered = items.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const openNew = () => {
    setEditItem({ id: `p${Date.now()}`, name: "", sku: "", unit: "Pack", basePrice: 0, totalSold: 0 });
    setIsNew(true);
  };

  const openEdit = (p: Product) => {
    setEditItem({ ...p });
    setIsNew(false);
  };

  const save = () => {
    if (!editItem?.name || !editItem?.sku) return;
    if (isNew) {
      setItems((prev) => [...prev, editItem]);
      toast({ title: "Product added", description: `${editItem.name} has been added.` });
    } else {
      setItems((prev) => prev.map((p) => (p.id === editItem.id ? editItem : p)));
      toast({ title: "Product updated", description: `${editItem.name} has been updated.` });
    }
    setEditItem(null);
  };

  const remove = (id: string) => {
    const p = items.find((i) => i.id === id);
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast({ title: "Product deleted", description: `${p?.name} has been removed.` });
  };

  return (
    <AppLayout>
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight md:text-2xl">Products</h1>
            <p className="mt-0.5 text-xs text-muted-foreground md:mt-1 md:text-sm">
              Manage your product catalogue
            </p>
          </div>
          <Button onClick={openNew} className="w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 rounded-lg pl-10 md:h-12 md:max-w-md"
          />
        </div>

        {/* Desktop Table */}
        <div className="glass-card overflow-hidden">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="px-6 py-3 font-medium">Product Name</th>
                  <th className="px-6 py-3 font-medium">SKU</th>
                  <th className="px-6 py-3 font-medium">Unit</th>
                  <th className="px-6 py-3 font-medium text-right">Base Price</th>
                  <th className="px-6 py-3 font-medium text-right">Total Sold</th>
                  <th className="px-6 py-3 font-medium text-right">Stock</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="group border-b border-border/50 row-hover">
                    <td className="px-6 py-4 font-medium">{p.name}</td>
                    <td className="px-6 py-4 text-muted-foreground font-mono text-xs">{p.sku}</td>
                    <td className="px-6 py-4 text-muted-foreground">{p.unit}</td>
                    <td className="px-6 py-4 text-right font-medium">{formatCurrency(p.basePrice)}</td>
                    <td className="px-6 py-4 text-right text-muted-foreground">{formatNumber(p.totalSold)}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/godown/inventory?location=all&search=${encodeURIComponent(p.sku)}`); }}
                        className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                      >
                        {formatNumber(getProductStock(p.id))}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => openEdit(p)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => remove(p.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-0 md:hidden">
            {filtered.map((p) => (
              <div key={p.id} className="flex items-center justify-between border-b border-border/50 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  <p className="text-[10px] text-muted-foreground font-mono md:text-xs">{p.sku} · {p.unit}</p>
                  <div className="mt-1 flex items-center gap-3">
                    <span className="text-xs font-semibold">{formatCurrency(p.basePrice)}</span>
                    <button
                      onClick={() => navigate(`/godown/inventory?location=all&search=${encodeURIComponent(p.sku)}`)}
                      className="text-[10px] font-medium text-primary"
                    >
                      Stock: {formatNumber(getProductStock(p.id))}
                    </button>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0 ml-2">
                  <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => openEdit(p)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => remove(p.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Package className="h-10 w-10 text-muted-foreground/50" strokeWidth={1.5} />
              <p className="mt-3 text-sm font-medium">No products found</p>
              <p className="text-xs text-muted-foreground">Add your first product to get started</p>
            </div>
          )}
        </div>

        {/* Add/Edit Dialog */}
        <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
          <DialogContent className="max-w-[calc(100vw-2rem)] rounded-xl sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base md:text-lg">{isNew ? "Add Product" : "Edit Product"}</DialogTitle>
            </DialogHeader>
            {editItem && (
              <div className="space-y-3 md:space-y-4">
                <div className="space-y-1.5 md:space-y-2">
                  <Label className="text-xs md:text-sm">Product Name</Label>
                  <Input
                    value={editItem.name}
                    onChange={(e) => setEditItem({ ...editItem, name: e.target.value })}
                    placeholder="e.g. Premium Basmati Rice 5kg"
                    className="h-11 rounded-lg md:h-12"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div className="space-y-1.5 md:space-y-2">
                    <Label className="text-xs md:text-sm">SKU</Label>
                    <Input
                      value={editItem.sku}
                      onChange={(e) => setEditItem({ ...editItem, sku: e.target.value })}
                      placeholder="RIC-BAS-5K"
                      className="h-11 rounded-lg md:h-12"
                    />
                  </div>
                  <div className="space-y-1.5 md:space-y-2">
                    <Label className="text-xs md:text-sm">Unit</Label>
                    <Input
                      value={editItem.unit}
                      onChange={(e) => setEditItem({ ...editItem, unit: e.target.value })}
                      placeholder="Pack"
                      className="h-11 rounded-lg md:h-12"
                    />
                  </div>
                </div>
                <div className="space-y-1.5 md:space-y-2">
                  <Label className="text-xs md:text-sm">Base Price (₹)</Label>
                  <Input
                    type="number"
                    value={editItem.basePrice}
                    onChange={(e) => setEditItem({ ...editItem, basePrice: parseFloat(e.target.value) || 0 })}
                    className="h-11 rounded-lg md:h-12"
                  />
                </div>
              </div>
            )}
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setEditItem(null)}>Cancel</Button>
              <Button onClick={save}>{isNew ? "Add Product" : "Save Changes"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
