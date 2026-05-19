import { useState, useRef, useEffect, useMemo } from "react";
import { useCan } from "@/hooks/useCan";
import { useDebounce } from "@/hooks/use-debounce";
import { usePagination } from "@/hooks/use-pagination";
import { ListPagination } from "@/components/ui/list-pagination";
import { usePageLoading } from "@/hooks/use-loading";

import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Pencil, Trash2, Package, Warehouse, MapPin, AlertTriangle, PackagePlus, Download } from "lucide-react";
import { exportXlsx, xlsxFilename } from "@/utils/exportXlsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { AppLayout } from "@/components/layout/AppLayout";
import { ListPageSkeleton } from "@/components/ui/page-skeleton";
import { formatCurrency, formatNumber, type Product } from "@/data/mock-data";
import { getStockHealth, type GodownLocation, type StockItem } from "@/data/godown-data";
import { useApi } from "@/services/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SignalCard } from "@/components/ui/signal-card";
import { KpiStrip } from "@/components/ui/kpi-strip";
import { EmptyCard } from "@/components/ui/empty-card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

function HealthBadge({ health }: { health: string }) {
  const dotColor: Record<string, string> = {
    healthy: "bg-success",
    low: "bg-warning",
    critical: "bg-destructive",
  };
  const labels: Record<string, string> = { healthy: "Healthy", low: "Low", critical: "Critical" };
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground">
      <span className={`h-1.5 w-1.5 rounded-full ${dotColor[health] || "bg-muted-foreground"}`} />
      {labels[health] || health}
    </span>
  );
}

export default function Stock() {
  const canManageStock = useCan("manage_stock");
  const api = useApi();
  const { companyInfo } = api;
  const products = api.products.list();
  const addProduct = api.products.create;
  const updateProduct = api.products.update;
  const deleteProductCtx = api.products.remove;
  const locations = api.stock.locations.list();
  const addLocation = api.stock.locations.create;
  const updateLocation = api.stock.locations.update;
  const deleteLocation = api.stock.locations.remove;
  const stockItemsList = api.stock.items.list();
  const addStockItem = api.stock.items.create;
  const updateStockItem = api.stock.items.update;
  const deleteStockItemCtx = api.stock.items.remove;
  const setStockItems = api.stock.items.setAll;

  const [productSearch, setProductSearch] = useState("");
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [isNewProduct, setIsNewProduct] = useState(false);
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);

  const [editWarehouse, setEditWarehouse] = useState<GodownLocation | null>(null);
  const [isNewWarehouse, setIsNewWarehouse] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string | null>(null);
  const [warehouseSearch, setWarehouseSearch] = useState("");

  const [deleteWarehouseLoc, setDeleteWarehouseLoc] = useState<GodownLocation | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const [confirmDeleteStockItem, setConfirmDeleteStockItem] = useState(false);
  const [editStockItem, setEditStockItem] = useState<StockItem | null>(null);
  // Original quantity captured when opening the Edit dialog (so we can compute deltas).
  const [editOriginalQty, setEditOriginalQty] = useState<number>(0);
  // Adjustment intent for the Edit Inventory dialog.
  type AdjustIntent = "add" | "remove" | "set";
  const [adjustIntent, setAdjustIntent] = useState<AdjustIntent>("add");
  // Delta value entered by the user (null = empty field).
  const [adjustDelta, setAdjustDelta] = useState<number | null>(null);

  const [addStockOpen, setAddStockOpen] = useState(false);
  const [addStockProductId, setAddStockProductId] = useState("");
  const [addStockQty, setAddStockQty] = useState(0);

  // Reset adjustment state whenever the Edit dialog opens with a new item.
  useEffect(() => {
    if (editStockItem) {
      setEditOriginalQty(editStockItem.quantity);
      setAdjustIntent("add");
      setAdjustDelta(null);
    }
  }, [editStockItem?.id]);

  // Compute the resulting quantity based on intent + delta.
  const computedNewQty = useMemo(() => {
    const d = adjustDelta ?? 0;
    if (adjustIntent === "add") return editOriginalQty + d;
    if (adjustIntent === "remove") return Math.max(0, editOriginalQty - d);
    return d; // "set"
  }, [adjustIntent, adjustDelta, editOriginalQty]);

  const inventoryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedWarehouse && inventoryRef.current) {
      setTimeout(() => {
        inventoryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 350);
    }
  }, [selectedWarehouse]);

  // Precompute per-product total stock once per render. Eliminates the
  // per-row .filter().reduce() scan that ran for every product card.
  const stockByProduct = useMemo(() => {
    const map = new Map<string, number>();
    for (const si of stockItemsList) {
      map.set(si.productId, (map.get(si.productId) || 0) + si.quantity);
    }
    return map;
  }, [stockItemsList]);
  const getProductStock = (productId: string) => stockByProduct.get(productId) || 0;

  // Aggregate stock health across all warehouses for hero strip + signal surface.
  const stockSummary = useMemo(() => {
    let totalValue = 0;
    let lowCount = 0;
    let criticalCount = 0;
    let atRiskValue = 0;
    for (const si of stockItemsList) {
      totalValue += si.quantity * si.basePrice;
      const h = getStockHealth(si.quantity, si.threshold);
      if (h === "critical") { criticalCount += 1; atRiskValue += si.threshold * si.basePrice; }
      else if (h === "low") { lowCount += 1; }
    }
    return { totalValue, lowCount, criticalCount, atRiskValue };
  }, [stockItemsList]);

  const isLoading = usePageLoading(api.loading);
  const debouncedProductSearch = useDebounce(productSearch);
  const debouncedWarehouseSearch = useDebounce(warehouseSearch);

  const filteredProducts = useMemo(() => products.filter(
    (p) =>
      p.name.toLowerCase().includes(debouncedProductSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(debouncedProductSearch.toLowerCase())
  ), [products, debouncedProductSearch]);

  const productsPagination = usePagination(filteredProducts.length);
  const paginatedProducts = useMemo(() => filteredProducts.slice(productsPagination.from, productsPagination.to), [filteredProducts, productsPagination.from, productsPagination.to]);

  const openNewProduct = () => {
    setEditProduct({ id: `p${Date.now()}`, name: "", sku: "", unit: "Pack", basePrice: 0, hsnCode: "", totalSold: 0 });
    setIsNewProduct(true);
  };

  const saveProduct = () => {
    if (!editProduct?.name.trim()) {
      toast.error("Name required", { description: "Please enter a product name." });
      return;
    }
    if (!editProduct?.sku.trim()) {
      toast.error("SKU required", { description: "Please enter a SKU." });
      return;
    }
    if (editProduct.basePrice <= 0) {
      toast.error("Invalid price", { description: "Base price must be greater than 0." });
      return;
    }
    if (isNewProduct) {
      addProduct(editProduct);
      toast.success("Product added", { description: `${editProduct.name} has been added.` });
    } else {
      updateProduct(editProduct);
      toast.success("Product updated", { description: `${editProduct.name} has been updated.` });
    }
    setEditProduct(null);
  };

  const confirmDeleteProduct = async () => {
    if (!deleteProductId) return;
    const p = products.find((i) => i.id === deleteProductId);
    const ok = await deleteProductCtx(deleteProductId);
    if (ok) toast.success("Product deleted", { description: `${p?.name} has been removed.` });
    setDeleteProductId(null);
  };

  const activeLocations = locations.filter((l) => l.isActive);

  // Precompute warehouse stats in a single pass instead of three filters per warehouse card.
  const statsByWarehouse = useMemo(() => {
    const map = new Map<string, { totalSKUs: number; totalValue: number; lowStockCount: number }>();
    for (const si of stockItemsList) {
      const cur = map.get(si.godownId) || { totalSKUs: 0, totalValue: 0, lowStockCount: 0 };
      cur.totalSKUs += 1;
      cur.totalValue += si.quantity * si.basePrice;
      if (getStockHealth(si.quantity, si.threshold) !== "healthy") cur.lowStockCount += 1;
      map.set(si.godownId, cur);
    }
    return map;
  }, [stockItemsList]);
  const getWarehouseStats = (warehouseId: string) =>
    statsByWarehouse.get(warehouseId) || { totalSKUs: 0, totalValue: 0, lowStockCount: 0 };

  const openNewWarehouse = () => {
    setEditWarehouse({ id: `g${Date.now()}`, name: "", address: "", isActive: true });
    setIsNewWarehouse(true);
  };

  const saveWarehouse = () => {
    if (!editWarehouse?.name.trim()) {
      toast.error("Name required", { description: "Please enter a warehouse name." });
      return;
    }
    if (isNewWarehouse) {
      addLocation(editWarehouse);
      toast.success("Warehouse added", { description: `${editWarehouse.name} has been added.` });
    } else {
      updateLocation(editWarehouse);
      toast.success("Warehouse updated", { description: `${editWarehouse.name} has been updated.` });
    }
    setEditWarehouse(null);
  };

  const confirmDeleteWarehouse = async () => {
    if (!deleteWarehouseLoc) return;
    const ok = await deleteLocation(deleteWarehouseLoc.id);
    if (ok) {
      setStockItems((prev) => prev.filter((si) => si.godownId !== deleteWarehouseLoc.id));
      if (selectedWarehouse === deleteWarehouseLoc.id) setSelectedWarehouse(null);
      toast.success("Warehouse deleted", { description: `${deleteWarehouseLoc.name} and all its inventory have been removed.` });
    }
    setDeleteWarehouseLoc(null);
    setDeleteConfirmText("");
  };

  const saveStockItemFn = () => {
    if (!editStockItem) return;
    // Validate: if intent is add/remove, delta must be > 0. For "set" allow 0.
    if (adjustIntent !== "set" && (!adjustDelta || adjustDelta <= 0)) {
      toast.error("Enter a quantity", {
        description: adjustIntent === "add" ? "Type how many units to add." : "Type how many units to remove.",
      });
      return;
    }
    if (adjustIntent === "remove" && (adjustDelta ?? 0) > editOriginalQty) {
      toast.error("Cannot remove more than current stock", {
        description: `Only ${editOriginalQty} units are currently in stock.`,
      });
      return;
    }
    const finalQty = computedNewQty;
    const delta = finalQty - editOriginalQty;
    const updated: StockItem = { ...editStockItem, quantity: finalQty };
    updateStockItem(updated);
    const verb = delta > 0 ? "Added" : delta < 0 ? "Removed" : "Updated";
    const absDelta = Math.abs(delta);
    toast.success(
      delta === 0 ? "Inventory updated" : `${verb} ${absDelta} ${editStockItem.unit || "units"}`,
      { description: `${editStockItem.productName}: ${editOriginalQty} → ${finalQty}` },
    );
    setEditStockItem(null);
  };

  const deleteStockItemFn = () => {
    if (!editStockItem) return;
    deleteStockItemCtx(editStockItem.id);
    toast.success("Inventory removed", { description: `${editStockItem.productName} removed from warehouse.` });
    setEditStockItem(null);
  };

  const warehouseInventory = useMemo(() => selectedWarehouse
    ? stockItemsList
        .filter((si) => si.godownId === selectedWarehouse)
        .filter(
          (si) =>
            si.productName.toLowerCase().includes(debouncedWarehouseSearch.toLowerCase()) ||
            si.sku.toLowerCase().includes(debouncedWarehouseSearch.toLowerCase())
        )
    : [], [selectedWarehouse, stockItemsList, debouncedWarehouseSearch]);

  const inventoryPagination = usePagination(warehouseInventory.length);
  const paginatedInventory = useMemo(() => warehouseInventory.slice(inventoryPagination.from, inventoryPagination.to), [warehouseInventory, inventoryPagination.from, inventoryPagination.to]);

  const handleAddStock = () => {
    if (!addStockProductId || !selectedWarehouse) {
      toast.error("Product required", { description: "Please select a product." });
      return;
    }
    if (addStockQty <= 0) {
      toast.error("Invalid quantity", { description: "Quantity must be greater than 0." });
      return;
    }
    const existing = stockItemsList.find(
      (si) => si.productId === addStockProductId && si.godownId === selectedWarehouse
    );
    if (existing) {
      updateStockItem({ ...existing, quantity: existing.quantity + addStockQty });
    } else {
      const product = products.find((p) => p.id === addStockProductId);
      const warehouse = locations.find((l) => l.id === selectedWarehouse);
      if (product && warehouse) {
        const newItem: StockItem = {
          id: `si${Date.now()}`,
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          unit: product.unit,
          godownId: warehouse.id,
          godownName: warehouse.name,
          quantity: addStockQty,
          threshold: 50,
          basePrice: product.basePrice,
          lastDeductedDate: null,
        };
        addStockItem(newItem);
      }
    }
    toast.success("Stock added", { description: `${addStockQty} units added successfully.` });
    setAddStockOpen(false);
    setAddStockProductId("");
    setAddStockQty(0);
  };

  const deleteProductName = deleteProductId ? products.find((p) => p.id === deleteProductId)?.name : "";

  // First-paint skeleton for cold loads (no cached products + still fetching)
  if (isLoading && products.length === 0 && locations.length === 0) {
    return (
      <AppLayout>
        <ListPageSkeleton cards={6} />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-4 md:space-y-6">
        <div>
          <h1 className="h1-display">Stock</h1>
          <p className="mt-0.5 text-xs text-muted-foreground md:mt-1 md:text-sm">
            Manage your products and warehouse inventory
          </p>
        </div>

        {(stockSummary.criticalCount > 0 || stockSummary.lowCount > 0) && (
          <SignalCard
            tier={stockSummary.criticalCount > 0 ? "destructive" : "warning"}
            icon={AlertTriangle}
            label={stockSummary.criticalCount > 0 ? "OUT OF STOCK" : "LOW STOCK"}
            caption={
              stockSummary.criticalCount > 0
                ? `${stockSummary.criticalCount} SKU${stockSummary.criticalCount !== 1 ? "s" : ""} below reorder threshold — refill before next dispatch`
                : `${stockSummary.lowCount} SKU${stockSummary.lowCount !== 1 ? "s" : ""} approaching reorder point`
            }
            subCaption={stockSummary.atRiskValue > 0 ? `≈ ${formatCurrency(stockSummary.atRiskValue)} revenue at risk` : undefined}
            value={stockSummary.criticalCount > 0 ? stockSummary.criticalCount : stockSummary.lowCount}
            valueSuffix="SKUs"
          />
        )}

        <KpiStrip
          cells={[
            { label: "Total SKUs", value: formatNumber(products.length), zero: products.length === 0 },
            ...(!canManageStock ? [] : [{ label: "Stock value", value: formatCurrency(stockSummary.totalValue), zero: stockSummary.totalValue === 0 }]),
            { label: "Low stock", value: formatNumber(stockSummary.lowCount + stockSummary.criticalCount), zero: stockSummary.lowCount + stockSummary.criticalCount === 0 },
            { label: "Warehouses", value: formatNumber(activeLocations.length), zero: activeLocations.length === 0 },
          ]}
        />

        <Tabs defaultValue="products" className="space-y-4 md:space-y-6">
          <div className="overflow-x-auto -mx-3 px-3 md:mx-0 md:px-0">
            <TabsList className="h-10 w-max rounded-lg bg-muted/50 p-1 md:h-12 md:w-auto">
              <TabsTrigger value="products" className="rounded-md px-3 py-1.5 text-xs md:px-4 md:py-2 md:text-sm">Products</TabsTrigger>
              <TabsTrigger value="warehouses" className="rounded-md px-3 py-1.5 text-xs md:px-4 md:py-2 md:text-sm">Warehouses</TabsTrigger>
            </TabsList>
          </div>

          {/* PRODUCTS TAB */}
          <TabsContent value="products">
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search products..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="h-10 rounded-lg pl-10 md:max-w-md"
                  />
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 sm:h-10 sm:w-auto sm:px-4"
                    aria-label="Export CSV"
                    onClick={() => {
                      exportXlsx(
                        xlsxFilename("products"),
                        ["Product Name", "SKU", "Unit", "Base Price", "Total Sold", "Total Stock"],
                        filteredProducts.map((p) => [
                          p.name,
                          p.sku,
                          p.unit,
                          formatCurrency(p.basePrice),
                          String(p.totalSold),
                          String(getProductStock(p.id)),
                        ])
                      );
                    }}
                  >
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">Export CSV</span>
                  </Button>
                  {canManageStock && (
                    <Button onClick={openNewProduct} className="flex-1 sm:flex-none">
                      <Plus className="h-4 w-4" />
                      Add Product
                    </Button>
                  )}
                </div>
              </div>

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
                        <th className="px-6 py-3 font-medium text-right">Total Stock</th>
                        {canManageStock && <th className="px-6 py-3 font-medium text-right">Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedProducts.map((p) => (
                        <tr key={p.id} className="group border-b border-border/50 row-hover">
                          <td className="px-6 py-4 font-medium">{p.name}</td>
                          <td className="px-6 py-4 text-muted-foreground font-mono text-xs">{p.sku}</td>
                          <td className="px-6 py-4 text-muted-foreground">{p.unit}</td>
                          <td className="px-6 py-4 text-right font-medium">{formatCurrency(p.basePrice)}</td>
                          <td className="px-6 py-4 text-right text-muted-foreground">{formatNumber(p.totalSold)}</td>
                          <td className="px-6 py-4 text-right font-semibold">{formatNumber(getProductStock(p.id))}</td>
                          {canManageStock && (
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => { setEditProduct({ ...p }); setIsNewProduct(false); }}>
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground" onClick={() => setDeleteProductId(p.id)}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="space-y-0 md:hidden">
                  {paginatedProducts.map((p) => (
                    <div key={p.id} className="flex items-center justify-between border-b border-border/50 px-4 py-3 card-hover">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{p.sku} · {p.unit}</p>
                        <div className="mt-1 flex items-center gap-3">
                          <span className="text-xs font-semibold">{formatCurrency(p.basePrice)}</span>
                          <span className="text-xs font-medium text-muted-foreground">
                            Stock: {formatNumber(getProductStock(p.id))}
                          </span>
                        </div>
                      </div>
                      {canManageStock && (
                        <div className="flex gap-1 shrink-0 ml-2">
                          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => { setEditProduct({ ...p }); setIsNewProduct(false); }}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => setDeleteProductId(p.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <ListPagination page={productsPagination.page} totalPages={productsPagination.totalPages} onPageChange={productsPagination.setPage} />

                {filteredProducts.length === 0 && (
                  <EmptyCard
                    icon={Package}
                    title="No products in your catalog."
                    description="Add a product so you can stock and sell it."
                    actionLabel={canManageStock ? "Add product" : undefined}
                    onAction={canManageStock ? openNewProduct : undefined}
                  />
                )}
              </div>
            </div>
          </TabsContent>

          {/* WAREHOUSES TAB */}
          <TabsContent value="warehouses">
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground md:text-sm">
                  {activeLocations.length} active warehouse{activeLocations.length !== 1 ? "s" : ""}
                </p>
                {canManageStock && (
                  <Button onClick={openNewWarehouse} className="w-full sm:w-auto">
                    <Plus className="h-4 w-4" />
                    Add Warehouse
                  </Button>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-3">
                {locations.map((loc, i) => {
                  const stats = getWarehouseStats(loc.id);
                  const isSelected = selectedWarehouse === loc.id;
                  return (
                    <motion.div
                      key={loc.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04, type: "spring", damping: 26, stiffness: 200 }}
                      onClick={() => setSelectedWarehouse(isSelected ? null : loc.id)}
                      className={`cursor-pointer glass-card card-hover p-5 md:p-6 transition-all ${isSelected ? "ring-2 ring-primary" : ""}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-semibold md:text-base">{loc.name}</h3>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {loc.address.split(",").slice(-2).join(",").trim()}
                          </p>
                        </div>
                        {canManageStock && (
                          <div className="flex gap-0.5 shrink-0">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={(e) => { e.stopPropagation(); setEditWarehouse({ ...loc }); setIsNewWarehouse(false); }}>
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={(e) => { e.stopPropagation(); setDeleteWarehouseLoc(loc); }}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                      <div className="mt-4 flex items-center justify-between border-t border-border/30 pt-4 text-xs md:text-sm">
                        <span className="text-muted-foreground">{stats.totalSKUs} products</span>
                        <span className="font-semibold">{formatCurrency(stats.totalValue)}</span>
                      </div>
                      {stats.lowStockCount > 0 && (
                        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground md:text-xs">
                          <span className="h-1.5 w-1.5 rounded-full bg-warning" />
                          {stats.lowStockCount} low stock item{stats.lowStockCount !== 1 ? "s" : ""}
                        </div>
                      )}
                      {isSelected && (
                        <p className="mt-2 text-[10px] text-primary md:text-xs">Inventory shown below ↓</p>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {locations.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Warehouse className="h-10 w-10 text-muted-foreground/50" strokeWidth={1.5} />
                  <p className="mt-3 text-sm font-medium">No warehouses yet</p>
                  <p className="text-xs text-muted-foreground">Add your first warehouse to start tracking inventory</p>
                  {canManageStock && (
                    <Button size="sm" className="mt-3" onClick={openNewWarehouse}>
                      <Plus className="h-4 w-4" />
                      Add Warehouse
                    </Button>
                  )}
                </div>
              )}

              <AnimatePresence>
                {selectedWarehouse && (
                  <motion.div
                    ref={inventoryRef}
                    initial={{ opacity: 0, scaleY: 0.95 }}
                    animate={{ opacity: 1, scaleY: 1 }}
                    exit={{ opacity: 0, scaleY: 0.95 }}
                    transition={{ type: "spring", damping: 26, stiffness: 200 }}
                    style={{ transformOrigin: "top" }}
                    className="space-y-3 overflow-hidden"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <h3 className="text-sm font-semibold md:text-base">
                        Inventory — {locations.find((l) => l.id === selectedWarehouse)?.name}
                      </h3>
                        <div className="flex flex-wrap gap-2">
                          <div className="relative flex-1 sm:flex-initial">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              placeholder="Search inventory..."
                              value={warehouseSearch}
                              onChange={(e) => setWarehouseSearch(e.target.value)}
                              className="h-10 rounded-lg pl-10 md:max-w-xs"
                            />
                          </div>
                          <Button
                            variant="outline"
                            className="shrink-0"
                            onClick={() => {
                              const whName = locations.find((l) => l.id === selectedWarehouse)?.name || "warehouse";
                              exportXlsx(
                                xlsxFilename(`inventory-${whName.toLowerCase().replace(/\s+/g, "-")}`),
                                ["Product Name", "SKU", "Unit", "Quantity", "Threshold", "Health", "Base Price", "Stock Value"],
                                warehouseInventory.map((si) => {
                                  const health = getStockHealth(si.quantity, si.threshold);
                                  return [
                                    si.productName,
                                    si.sku,
                                    si.unit,
                                    String(si.quantity),
                                    String(si.threshold),
                                    health.charAt(0).toUpperCase() + health.slice(1),
                                    formatCurrency(si.basePrice),
                                    formatCurrency(si.quantity * si.basePrice),
                                  ];
                                })
                              );
                            }}
                          >
                            <Download className="h-4 w-4" />
                            <span className="hidden sm:inline">Export CSV</span>
                          </Button>
                          {canManageStock && (
                            <Button onClick={() => setAddStockOpen(true)} className="shrink-0">
                              <PackagePlus className="h-4 w-4" />
                              <span className="hidden sm:inline">Add Product</span>
                              <span className="sm:hidden">Add</span>
                            </Button>
                          )}
                        </div>
                    </div>

                    <div className="glass-card overflow-hidden">
                      <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border text-left text-xs text-muted-foreground">
                              <th className="px-6 py-3 font-medium">Product</th>
                              <th className="px-6 py-3 font-medium">SKU</th>
                              <th className="px-6 py-3 font-medium text-right">Quantity</th>
                              <th className="px-6 py-3 font-medium text-right">Threshold</th>
                              <th className="px-6 py-3 font-medium text-right">Est. Value</th>
                              <th className="px-6 py-3 font-medium">Health</th>
                            </tr>
                          </thead>
                          <tbody>
                            {paginatedInventory.map((si) => {
                              const health = getStockHealth(si.quantity, si.threshold);
                              return (
                                <tr key={si.id} onClick={!canManageStock ? undefined : () => setEditStockItem({ ...si })} className={`border-b border-border/50 row-hover ${!canManageStock ? "" : "cursor-pointer"}`}>
                                  <td className="px-6 py-4 font-medium">{si.productName}</td>
                                  <td className="px-6 py-4 text-muted-foreground font-mono text-xs">{si.sku}</td>
                                  <td className={`px-6 py-4 text-right font-semibold ${health === "critical" ? "text-destructive" : health === "low" ? "text-warning" : ""}`}>
                                    {formatNumber(si.quantity)}
                                  </td>
                                  <td className="px-6 py-4 text-right text-muted-foreground">{si.threshold}</td>
                                  <td className="px-6 py-4 text-right text-muted-foreground">
                                    {formatCurrency(si.quantity * si.basePrice)}
                                  </td>
                                  <td className="px-6 py-4"><HealthBadge health={health} /></td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      <div className="md:hidden">
                        {paginatedInventory.map((si) => {
                          const health = getStockHealth(si.quantity, si.threshold);
                          return (
                            <div key={si.id} onClick={!canManageStock ? undefined : () => setEditStockItem({ ...si })} className={`border-b border-border/50 px-4 py-3 card-hover ${!canManageStock ? "" : "cursor-pointer"}`}>
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium truncate">{si.productName}</span>
                                <HealthBadge health={health} />
                              </div>
                              <div className="mt-1 flex items-center justify-between">
                                <span className="text-[10px] text-muted-foreground font-mono">{si.sku}</span>
                                <span className={`text-xs font-semibold ${health === "critical" ? "text-destructive" : health === "low" ? "text-warning" : ""}`}>
                                  {formatNumber(si.quantity)} {si.unit}s
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <ListPagination page={inventoryPagination.page} totalPages={inventoryPagination.totalPages} onPageChange={inventoryPagination.setPage} />
                      {warehouseInventory.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                          <Package className="h-8 w-8 text-muted-foreground/50" strokeWidth={1.5} />
                          <p className="mt-2 text-sm font-medium">No inventory in this warehouse</p>
                          <p className="text-xs text-muted-foreground">Add stock to get started</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </TabsContent>
        </Tabs>

        {canManageStock && (<>
        {/* Add/Edit Product Dialog */}
        <Dialog open={!!editProduct} onOpenChange={() => setEditProduct(null)}>
          <DialogContent className="max-w-[calc(100vw-2rem)] rounded-md sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base md:text-lg">{isNewProduct ? "Add Product" : "Edit Product"}</DialogTitle>
              <DialogDescription className="sr-only">{isNewProduct ? "Add a new product" : "Edit product details"}</DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); saveProduct(); }}>
            {editProduct && (
              <div className="space-y-3 md:space-y-4">
                <div className="space-y-1.5 md:space-y-2">
                  <Label className="text-xs md:text-sm">Product Name *</Label>
                  <Input autoFocus value={editProduct.name} onChange={(e) => setEditProduct({ ...editProduct, name: e.target.value })} placeholder="e.g. Premium Basmati Rice 5kg" className="h-10 rounded-lg" />
                </div>
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div className="space-y-1.5 md:space-y-2">
                    <Label className="text-xs md:text-sm">SKU *</Label>
                    <Input value={editProduct.sku} onChange={(e) => setEditProduct({ ...editProduct, sku: e.target.value })} placeholder="RIC-BAS-5K" className="h-10 rounded-lg" />
                  </div>
                  <div className="space-y-1.5 md:space-y-2">
                    <Label className="text-xs md:text-sm">Unit</Label>
                    <Input value={editProduct.unit} onChange={(e) => setEditProduct({ ...editProduct, unit: e.target.value })} placeholder="Pack" className="h-10 rounded-lg" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div className="space-y-1.5 md:space-y-2">
                    <Label className="text-xs md:text-sm">HSN Code</Label>
                    <Input value={editProduct.hsnCode} onChange={(e) => setEditProduct({ ...editProduct, hsnCode: e.target.value })} placeholder="e.g. 1006" className="h-10 rounded-lg font-mono" />
                  </div>
                  <div className="space-y-1.5 md:space-y-2">
                    <Label className="text-xs md:text-sm">Base Price (₹) *</Label>
                    <NumberInput allowDecimal allowEmpty={false} min={0} value={editProduct.basePrice} onValueChange={(v) => setEditProduct({ ...editProduct, basePrice: v ?? 0 })} className="h-10 rounded-lg" />
                  </div>
                </div>
              </div>
            )}
            <DialogFooter className="gap-2 sm:gap-0 mt-4">
              <Button type="button" variant="outline" onClick={() => setEditProduct(null)}>Cancel</Button>
              <Button type="submit">{isNewProduct ? "Add Product" : "Save Changes"}</Button>
            </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Product */}
        <AlertDialog open={!!deleteProductId} onOpenChange={() => setDeleteProductId(null)}>
          <AlertDialogContent className="max-w-[calc(100vw-2rem)] rounded-md sm:max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Product</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete <span className="font-semibold text-foreground">{deleteProductName}</span>? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <Button variant="destructive" onClick={confirmDeleteProduct}>Delete</Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Add/Edit Warehouse */}
        <Dialog open={!!editWarehouse} onOpenChange={() => setEditWarehouse(null)}>
          <DialogContent className="max-w-[calc(100vw-2rem)] rounded-md sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base md:text-lg">{isNewWarehouse ? "Add Warehouse" : "Edit Warehouse"}</DialogTitle>
              <DialogDescription className="sr-only">{isNewWarehouse ? "Add a new warehouse" : "Edit warehouse details"}</DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); saveWarehouse(); }}>
            {editWarehouse && (
              <div className="space-y-3 md:space-y-4">
                <div className="space-y-1.5 md:space-y-2">
                  <Label className="text-xs md:text-sm">Warehouse Name *</Label>
                  <Input autoFocus value={editWarehouse.name} onChange={(e) => setEditWarehouse({ ...editWarehouse, name: e.target.value })} placeholder="e.g. Main Warehouse — Kochi" className="h-10 rounded-lg" />
                </div>
                <div className="space-y-1.5 md:space-y-2">
                  <Label className="text-xs md:text-sm">Address</Label>
                  <Input value={editWarehouse.address} onChange={(e) => setEditWarehouse({ ...editWarehouse, address: e.target.value })} placeholder="Full address" className="h-10 rounded-lg" />
                </div>
              </div>
            )}
            <DialogFooter className="gap-2 sm:gap-0 mt-4">
              <Button type="button" variant="outline" onClick={() => setEditWarehouse(null)}>Cancel</Button>
              <Button type="submit">{isNewWarehouse ? "Add Warehouse" : "Save Changes"}</Button>
            </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Warehouse */}
        <AlertDialog open={!!deleteWarehouseLoc} onOpenChange={() => { setDeleteWarehouseLoc(null); setDeleteConfirmText(""); }}>
          <AlertDialogContent className="max-w-[calc(100vw-2rem)] rounded-md sm:max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Warehouse</AlertDialogTitle>
              <AlertDialogDescription className="space-y-3">
                <span>This will permanently delete <span className="font-semibold text-foreground">{deleteWarehouseLoc?.name}</span> and all its inventory. This action cannot be undone.</span>
                <span className="block text-xs">Type <span className="font-mono font-semibold text-foreground">{deleteWarehouseLoc?.name}</span> to confirm:</span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <Input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type warehouse name..."
              className="h-11 rounded-lg"
            />
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteConfirmText("")}>Cancel</AlertDialogCancel>
              <Button
                variant="destructive"
                onClick={confirmDeleteWarehouse}
                disabled={deleteConfirmText !== deleteWarehouseLoc?.name}
              >
                Delete Warehouse
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Edit Stock Item */}
        <Dialog open={!!editStockItem} onOpenChange={() => setEditStockItem(null)}>
          <DialogContent className="max-w-[calc(100vw-2rem)] rounded-md sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base md:text-lg">Edit Inventory</DialogTitle>
              <DialogDescription className="sr-only">Edit stock item quantity and threshold</DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); saveStockItemFn(); }}>
            {editStockItem && (
              <div className="space-y-3 md:space-y-4">
                <div className="rounded-lg border border-border bg-muted/20 p-3 overflow-hidden">
                  <span className="text-[10px] text-muted-foreground md:text-xs">Product</span>
                  <p className="mt-0.5 text-sm font-medium">{editStockItem.productName}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">{editStockItem.sku}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Current stock: <span className="font-semibold text-foreground">{editOriginalQty} {editStockItem.unit || "units"}</span>
                  </p>
                </div>

                {/* Intent picker */}
                <div className="space-y-1.5 md:space-y-2">
                  <Label className="text-xs md:text-sm">What do you want to do?</Label>
                  <div className="grid grid-cols-3 gap-1 rounded-lg bg-muted/40 p-1">
                    {([
                      { id: "add", label: "Add stock" },
                      { id: "remove", label: "Remove stock" },
                      { id: "set", label: "Set exact" },
                    ] as { id: AdjustIntent; label: string }[]).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => { setAdjustIntent(opt.id); setAdjustDelta(null); }}
                        className={`h-9 rounded-md text-xs font-medium transition-colors ${
                          adjustIntent === opt.id
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Delta input */}
                <div className="space-y-1.5 md:space-y-2">
                  <Label className="text-xs md:text-sm">
                    {adjustIntent === "add" && "Quantity to add"}
                    {adjustIntent === "remove" && "Quantity to remove"}
                    {adjustIntent === "set" && "New quantity"}
                  </Label>
                  <NumberInput
                    allowEmpty
                    min={0}
                    value={adjustDelta}
                    onValueChange={setAdjustDelta}
                    placeholder={adjustIntent === "set" ? String(editOriginalQty) : "0"}
                    autoFocus
                    className="h-10 rounded-lg"
                  />
                </div>

                {/* Live preview */}
                {(adjustDelta !== null && adjustDelta >= 0) && (
                  <div
                    className={`rounded-lg border px-3 py-2.5 text-xs ${
                      adjustIntent === "remove" && (adjustDelta ?? 0) > editOriginalQty
                        ? "border-destructive/40 bg-destructive/5 text-destructive"
                        : "border-border bg-muted/30 text-foreground"
                    }`}
                  >
                    {adjustIntent === "add" && (
                      <>New stock will be: <span className="font-semibold">{editOriginalQty} + {adjustDelta} = {computedNewQty} {editStockItem.unit || "units"}</span></>
                    )}
                    {adjustIntent === "remove" && (
                      (adjustDelta ?? 0) > editOriginalQty
                        ? <>Cannot remove {adjustDelta} units — only {editOriginalQty} in stock.</>
                        : <>New stock will be: <span className="font-semibold">{editOriginalQty} − {adjustDelta} = {computedNewQty} {editStockItem.unit || "units"}</span></>
                    )}
                    {adjustIntent === "set" && (
                      <>Stock will be set to: <span className="font-semibold">{computedNewQty} {editStockItem.unit || "units"}</span> (was {editOriginalQty})</>
                    )}
                  </div>
                )}

                {/* Threshold (kept as direct edit) */}
                <div className="space-y-1.5 md:space-y-2">
                  <Label className="text-xs md:text-sm">Low Stock Threshold</Label>
                  <NumberInput
                    allowEmpty={false}
                    min={0}
                    value={editStockItem.threshold}
                    onValueChange={(v) => setEditStockItem({ ...editStockItem, threshold: v ?? 0 })}
                    className="h-10 rounded-lg"
                  />
                  <p className="text-[10px] text-muted-foreground">Get notified when stock drops to or below this number.</p>
                </div>
              </div>
            )}
            <DialogFooter className="w-full flex-col gap-2 sm:flex-col sm:space-x-0 mt-4">
              <AlertDialog open={confirmDeleteStockItem} onOpenChange={setConfirmDeleteStockItem}>
                <Button type="button" variant="destructive" onClick={() => setConfirmDeleteStockItem(true)} className="w-full">
                  Remove from Warehouse
                </Button>
                <AlertDialogContent className="max-w-[calc(100vw-2rem)] rounded-md sm:max-w-md">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove Inventory Item</AlertDialogTitle>
                    <AlertDialogDescription>
                      Remove <span className="font-semibold text-foreground">{editStockItem?.productName}</span> from this warehouse? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <Button variant="destructive" onClick={() => { setConfirmDeleteStockItem(false); deleteStockItemFn(); }}>Remove</Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <div className="grid w-full grid-cols-2 gap-2">
                <Button type="button" variant="outline" onClick={() => setEditStockItem(null)} className="w-full">Cancel</Button>
                <Button type="submit" className="w-full">Save Changes</Button>
              </div>
            </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Add New Product to Warehouse — only lists products NOT already stocked here.
            For products already in this warehouse, users adjust via the row's Edit dialog. */}
        <Dialog open={addStockOpen} onOpenChange={setAddStockOpen}>
          <DialogContent className="max-w-[calc(100vw-2rem)] rounded-md sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base md:text-lg">Add Product to Warehouse</DialogTitle>
              <DialogDescription className="text-xs">
                Add a product that isn't yet stocked in this warehouse. To change the quantity of a product already here, click its row in the inventory list.
              </DialogDescription>
            </DialogHeader>
            {(() => {
              const stockedProductIds = new Set(
                stockItemsList.filter((si) => si.godownId === selectedWarehouse).map((si) => si.productId),
              );
              const availableProducts = products.filter((p) => !stockedProductIds.has(p.id));
              const noneAvailable = availableProducts.length === 0;
              return (
                <div className="space-y-3 md:space-y-4">
                  <div className="space-y-1.5 md:space-y-2">
                    <Label className="text-xs md:text-sm">Product *</Label>
                    <EntityPicker
                      value={addStockProductId}
                      onChange={setAddStockProductId}
                      disabled={noneAvailable}
                      placeholder={noneAvailable ? "All products already stocked here" : "Search for a product"}
                      searchPlaceholder="Search by name or SKU…"
                      emptyHint="No matching products."
                      options={availableProducts.map((p) => ({
                        value: p.id,
                        label: p.name,
                        hint: (p as any).sku || undefined,
                      }))}
                      helperText={
                        noneAvailable
                          ? "Every product already exists in this warehouse. Tap a row in the inventory list to update its quantity."
                          : undefined
                      }
                    />
                  </div>
                  {!noneAvailable && (
                    <div className="space-y-1.5 md:space-y-2">
                      <Label className="text-xs md:text-sm">Initial Quantity *</Label>
                      <NumberInput
                        allowEmpty={false}
                        min={1}
                        value={addStockQty}
                        onValueChange={(v) => setAddStockQty(v ?? 1)}
                        className="h-10 rounded-lg"
                      />
                    </div>
                  )}
                </div>
              );
            })()}
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setAddStockOpen(false)}>Cancel</Button>
              <Button onClick={handleAddStock} disabled={!addStockProductId}>Add to Warehouse</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </>)}
      </div>
    </AppLayout>
  );
}
