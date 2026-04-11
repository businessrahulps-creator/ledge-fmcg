import { useState, useRef, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useDebounce } from "@/hooks/use-debounce";
import { usePagination } from "@/hooks/use-pagination";
import { ListPagination } from "@/components/ui/list-pagination";
import { usePageLoading } from "@/hooks/use-loading";
import { ListPageSkeleton } from "@/components/ui/page-skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Pencil, Trash2, Package, Warehouse, MapPin, AlertTriangle, PackagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppLayout } from "@/components/layout/AppLayout";
import { formatCurrency, formatNumber, type Product } from "@/data/mock-data";
import { getStockHealth, type GodownLocation, type StockItem } from "@/data/godown-data";
import { useApi } from "@/services/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

function HealthBadge({ health }: { health: string }) {
  const styles: Record<string, string> = {
    healthy: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400",
    low: "bg-amber-50 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400",
    critical: "bg-red-50 text-red-500 dark:bg-red-500/20 dark:text-red-400",
  };
  const labels: Record<string, string> = { healthy: "Healthy", low: "Low", critical: "Critical" };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${styles[health] || ""}`}>
      {labels[health] || health}
    </span>
  );
}

export default function Stock() {
  const { isAccountant } = useAuth();
  const api = useApi();
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

  const [editStockItem, setEditStockItem] = useState<StockItem | null>(null);

  const [addStockOpen, setAddStockOpen] = useState(false);
  const [addStockProductId, setAddStockProductId] = useState("");
  const [addStockQty, setAddStockQty] = useState(0);

  const inventoryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedWarehouse && inventoryRef.current) {
      setTimeout(() => {
        inventoryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 350);
    }
  }, [selectedWarehouse]);

  const getProductStock = (productId: string) =>
    stockItemsList.filter((si) => si.productId === productId).reduce((sum, si) => sum + si.quantity, 0);

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
    setEditProduct({ id: `p${Date.now()}`, name: "", sku: "", unit: "Pack", basePrice: 0, totalSold: 0 });
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

  const confirmDeleteProduct = () => {
    if (!deleteProductId) return;
    const p = products.find((i) => i.id === deleteProductId);
    deleteProductCtx(deleteProductId);
    toast.success("Product deleted", { description: `${p?.name} has been removed.` });
    setDeleteProductId(null);
  };

  const activeLocations = locations.filter((l) => l.isActive);

  const getWarehouseStats = (warehouseId: string) => {
    const items = stockItemsList.filter((si) => si.godownId === warehouseId);
    const totalSKUs = items.length;
    const totalValue = items.reduce((sum, si) => sum + si.quantity * si.basePrice, 0);
    const lowStockCount = items.filter((si) => getStockHealth(si.quantity, si.threshold) !== "healthy").length;
    return { totalSKUs, totalValue, lowStockCount };
  };

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

  const confirmDeleteWarehouse = () => {
    if (!deleteWarehouseLoc) return;
    deleteLocation(deleteWarehouseLoc.id);
    setStockItems((prev) => prev.filter((si) => si.godownId !== deleteWarehouseLoc.id));
    if (selectedWarehouse === deleteWarehouseLoc.id) setSelectedWarehouse(null);
    toast.success("Warehouse deleted", { description: `${deleteWarehouseLoc.name} and all its inventory have been removed.` });
    setDeleteWarehouseLoc(null);
    setDeleteConfirmText("");
  };

  const saveStockItemFn = () => {
    if (!editStockItem) return;
    updateStockItem(editStockItem);
    toast.success("Inventory updated", { description: `${editStockItem.productName} has been updated.` });
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

  if (isLoading) {
    return <AppLayout><ListPageSkeleton cards={4} /></AppLayout>;
  }

  return (
    <AppLayout>
      <div className="space-y-4 md:space-y-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight md:text-2xl">Stock</h1>
          <p className="mt-0.5 text-xs text-muted-foreground md:mt-1 md:text-sm">
            Manage your products and warehouse inventory
          </p>
        </div>

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
                    className="h-11 rounded-lg pl-10 md:h-12 md:max-w-md"
                  />
                </div>
                {!isAccountant && (
                  <Button onClick={openNewProduct} className="w-full sm:w-auto">
                    <Plus className="h-4 w-4" />
                    Add Product
                  </Button>
                )}
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
                        {!isAccountant && <th className="px-6 py-3 font-medium text-right">Actions</th>}
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
                          {!isAccountant && (
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => { setEditProduct({ ...p }); setIsNewProduct(false); }}>
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => setDeleteProductId(p.id)}>
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
                        <p className="text-[10px] text-muted-foreground font-mono">{p.sku} · {p.unit}</p>
                        <div className="mt-1 flex items-center gap-3">
                          <span className="text-xs font-semibold">{formatCurrency(p.basePrice)}</span>
                          <span className="text-[10px] font-medium text-muted-foreground">
                            Stock: {formatNumber(getProductStock(p.id))}
                          </span>
                        </div>
                      </div>
                      {!isAccountant && (
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
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Package className="h-10 w-10 text-muted-foreground/50" strokeWidth={1.5} />
                    <p className="mt-3 text-sm font-medium">No products found</p>
                    <p className="text-xs text-muted-foreground">Add your first product to get started</p>
                    {!isAccountant && (
                      <Button size="sm" className="mt-3" onClick={openNewProduct}>
                        <Plus className="h-4 w-4" />
                        Add Product
                      </Button>
                    )}
                  </div>
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
                {!isAccountant && (
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
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05, duration: 0.3 }}
                      onClick={() => setSelectedWarehouse(isSelected ? null : loc.id)}
                      className={`cursor-pointer glass-card card-hover p-4 md:p-5 transition-all ${isSelected ? "ring-2 ring-primary" : ""}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted">
                            <Warehouse className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold md:text-base">{loc.name}</h3>
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground md:text-xs">
                              <MapPin className="h-3 w-3" strokeWidth={1.5} />
                              {loc.address.split(",").slice(-2).join(",").trim()}
                            </div>
                          </div>
                        </div>
                        {!isAccountant && (
                          <div className="flex gap-0.5">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); setEditWarehouse({ ...loc }); setIsNewWarehouse(false); }}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteWarehouseLoc(loc); }}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>
                      <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-xs md:text-sm">
                        <span className="text-muted-foreground">{stats.totalSKUs} products</span>
                        <span className="font-semibold">{formatCurrency(stats.totalValue)}</span>
                      </div>
                      {stats.lowStockCount > 0 && (
                        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-amber-600 md:text-xs">
                          <AlertTriangle className="h-3 w-3" />
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
                </div>
              )}

              <AnimatePresence>
                {selectedWarehouse && (
                  <motion.div
                    ref={inventoryRef}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-3 overflow-hidden"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <h3 className="text-sm font-semibold md:text-base">
                        Inventory — {locations.find((l) => l.id === selectedWarehouse)?.name}
                      </h3>
                      <div className="flex gap-2">
                        <div className="relative flex-1 sm:flex-initial">
                          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            placeholder="Search inventory..."
                            value={warehouseSearch}
                            onChange={(e) => setWarehouseSearch(e.target.value)}
                            className="h-10 rounded-lg pl-10 md:max-w-xs"
                          />
                        </div>
                        {!isAccountant && (
                          <Button onClick={() => setAddStockOpen(true)} className="shrink-0">
                            <PackagePlus className="h-4 w-4" />
                            Add Stock
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
                                <tr key={si.id} onClick={isAccountant ? undefined : () => setEditStockItem({ ...si })} className={`border-b border-border/50 row-hover ${isAccountant ? "" : "cursor-pointer"}`}>
                                  <td className="px-6 py-4 font-medium">{si.productName}</td>
                                  <td className="px-6 py-4 text-muted-foreground font-mono text-xs">{si.sku}</td>
                                  <td className={`px-6 py-4 text-right font-semibold ${health === "critical" ? "text-red-500" : health === "low" ? "text-amber-600" : ""}`}>
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
                            <div key={si.id} onClick={isAccountant ? undefined : () => setEditStockItem({ ...si })} className={`border-b border-border/50 px-4 py-3 card-hover ${isAccountant ? "" : "cursor-pointer"}`}>
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium truncate">{si.productName}</span>
                                <HealthBadge health={health} />
                              </div>
                              <div className="mt-1 flex items-center justify-between">
                                <span className="text-[10px] text-muted-foreground font-mono">{si.sku}</span>
                                <span className={`text-xs font-semibold ${health === "critical" ? "text-red-500" : health === "low" ? "text-amber-600" : ""}`}>
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

        {!isAccountant && (<>
        {/* Add/Edit Product Dialog */}
        <Dialog open={!!editProduct} onOpenChange={() => setEditProduct(null)}>
          <DialogContent className="max-w-[calc(100vw-2rem)] rounded-xl sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base md:text-lg">{isNewProduct ? "Add Product" : "Edit Product"}</DialogTitle>
            </DialogHeader>
            {editProduct && (
              <div className="space-y-3 md:space-y-4">
                <div className="space-y-1.5 md:space-y-2">
                  <Label className="text-xs md:text-sm">Product Name *</Label>
                  <Input value={editProduct.name} onChange={(e) => setEditProduct({ ...editProduct, name: e.target.value })} placeholder="e.g. Premium Basmati Rice 5kg" className="h-11 rounded-lg md:h-12" />
                </div>
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div className="space-y-1.5 md:space-y-2">
                    <Label className="text-xs md:text-sm">SKU *</Label>
                    <Input value={editProduct.sku} onChange={(e) => setEditProduct({ ...editProduct, sku: e.target.value })} placeholder="RIC-BAS-5K" className="h-11 rounded-lg md:h-12" />
                  </div>
                  <div className="space-y-1.5 md:space-y-2">
                    <Label className="text-xs md:text-sm">Unit</Label>
                    <Input value={editProduct.unit} onChange={(e) => setEditProduct({ ...editProduct, unit: e.target.value })} placeholder="Pack" className="h-11 rounded-lg md:h-12" />
                  </div>
                </div>
                <div className="space-y-1.5 md:space-y-2">
                  <Label className="text-xs md:text-sm">Base Price (₹) *</Label>
                  <Input type="number" value={editProduct.basePrice} onChange={(e) => setEditProduct({ ...editProduct, basePrice: parseFloat(e.target.value) || 0 })} className="h-11 rounded-lg md:h-12" />
                </div>
              </div>
            )}
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setEditProduct(null)}>Cancel</Button>
              <Button onClick={saveProduct}>{isNewProduct ? "Add Product" : "Save Changes"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Product */}
        <AlertDialog open={!!deleteProductId} onOpenChange={() => setDeleteProductId(null)}>
          <AlertDialogContent className="max-w-[calc(100vw-2rem)] rounded-xl sm:max-w-md">
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
          <DialogContent className="max-w-[calc(100vw-2rem)] rounded-xl sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base md:text-lg">{isNewWarehouse ? "Add Warehouse" : "Edit Warehouse"}</DialogTitle>
            </DialogHeader>
            {editWarehouse && (
              <div className="space-y-3 md:space-y-4">
                <div className="space-y-1.5 md:space-y-2">
                  <Label className="text-xs md:text-sm">Warehouse Name *</Label>
                  <Input value={editWarehouse.name} onChange={(e) => setEditWarehouse({ ...editWarehouse, name: e.target.value })} placeholder="e.g. Main Warehouse — Kochi" className="h-11 rounded-lg md:h-12" />
                </div>
                <div className="space-y-1.5 md:space-y-2">
                  <Label className="text-xs md:text-sm">Address</Label>
                  <Input value={editWarehouse.address} onChange={(e) => setEditWarehouse({ ...editWarehouse, address: e.target.value })} placeholder="Full address" className="h-11 rounded-lg md:h-12" />
                </div>
              </div>
            )}
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setEditWarehouse(null)}>Cancel</Button>
              <Button onClick={saveWarehouse}>{isNewWarehouse ? "Add Warehouse" : "Save Changes"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Warehouse */}
        <AlertDialog open={!!deleteWarehouseLoc} onOpenChange={() => { setDeleteWarehouseLoc(null); setDeleteConfirmText(""); }}>
          <AlertDialogContent className="max-w-[calc(100vw-2rem)] rounded-xl sm:max-w-md">
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
          <DialogContent className="max-w-[calc(100vw-2rem)] rounded-xl sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base md:text-lg">Edit Inventory</DialogTitle>
            </DialogHeader>
            {editStockItem && (
              <div className="space-y-3 md:space-y-4">
                <div className="rounded-lg border border-border bg-muted/20 p-3 overflow-hidden">
                  <span className="text-[10px] text-muted-foreground md:text-xs">Product</span>
                  <p className="mt-0.5 text-sm font-medium">{editStockItem.productName}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">{editStockItem.sku}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div className="space-y-1.5 md:space-y-2">
                    <Label className="text-xs md:text-sm">Quantity</Label>
                    <Input
                      type="number"
                      min={0}
                      value={editStockItem.quantity}
                      onChange={(e) => setEditStockItem({ ...editStockItem, quantity: parseInt(e.target.value) || 0 })}
                      className="h-11 rounded-lg md:h-12"
                    />
                  </div>
                  <div className="space-y-1.5 md:space-y-2">
                    <Label className="text-xs md:text-sm">Low Stock Threshold</Label>
                    <Input
                      type="number"
                      min={0}
                      value={editStockItem.threshold}
                      onChange={(e) => setEditStockItem({ ...editStockItem, threshold: parseInt(e.target.value) || 0 })}
                      className="h-11 rounded-lg md:h-12"
                    />
                  </div>
                </div>
              </div>
            )}
            <DialogFooter className="w-full flex-col gap-2 sm:flex-col sm:space-x-0">
              <Button variant="destructive" onClick={deleteStockItemFn} className="w-full">
                Remove from Warehouse
              </Button>
              <div className="grid w-full grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => setEditStockItem(null)} className="w-full">Cancel</Button>
                <Button onClick={saveStockItemFn} className="w-full">Save Changes</Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Stock */}
        <Dialog open={addStockOpen} onOpenChange={setAddStockOpen}>
          <DialogContent className="max-w-[calc(100vw-2rem)] rounded-xl sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base md:text-lg">Add Stock</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 md:space-y-4">
              <div className="space-y-1.5 md:space-y-2">
                <Label className="text-xs md:text-sm">Product *</Label>
                <Select value={addStockProductId} onValueChange={setAddStockProductId}>
                  <SelectTrigger className="h-11 rounded-lg md:h-12">
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 md:space-y-2">
                <Label className="text-xs md:text-sm">Quantity to Add *</Label>
                <Input
                  type="number"
                  min={1}
                  value={addStockQty}
                  onChange={(e) => setAddStockQty(parseInt(e.target.value) || 0)}
                  className="h-11 rounded-lg md:h-12"
                />
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setAddStockOpen(false)}>Cancel</Button>
              <Button onClick={handleAddStock}>Add Stock</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </>)}
      </div>
    </AppLayout>
  );
}
