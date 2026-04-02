import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Download, PackageOpen, Eye, ArrowLeftRight } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { stockItems, godownLocations, getStockHealth, getTimeAgo, type StockItem } from "@/data/godown-data";
import { formatCurrency, formatNumber, products } from "@/data/mock-data";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { StockDetailPanel } from "@/components/godown/StockDetailPanel";
import { TransferStockModal } from "@/components/godown/TransferStockModal";

const healthFilters = ["all", "healthy", "low", "critical"] as const;

function HealthBadge({ health }: { health: string }) {
  const styles: Record<string, string> = {
    healthy: "bg-success/10 text-success",
    low: "bg-warning/10 text-warning",
    critical: "bg-destructive/10 text-destructive",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${styles[health] || ""}`}>
      {health === "low" ? "Low Stock" : health === "critical" ? "Critical" : "Healthy"}
    </span>
  );
}

function QtyDisplay({ quantity, threshold }: { quantity: number; threshold: number }) {
  const health = getStockHealth(quantity, threshold);
  const color = health === "healthy" ? "text-success" : health === "low" ? "text-warning" : "text-destructive";
  return <span className={`text-lg font-bold ${color}`}>{quantity}</span>;
}

export default function GodownInventory() {
  const [searchParams] = useSearchParams();
  const locationFilter = searchParams.get("location") || "all";
  const [search, setSearch] = useState("");
  const [godownFilter, setGodownFilter] = useState(locationFilter);
  const [healthFilter, setHealthFilter] = useState<string>("all");
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);
  const [transferItem, setTransferItem] = useState<StockItem | null>(null);
  const navigate = useNavigate();

  const getProductData = (productId: string) => products.find(p => p.id === productId);

  const filtered = stockItems.filter((si) => {
    const matchSearch = si.productName.toLowerCase().includes(search.toLowerCase()) || si.sku.toLowerCase().includes(search.toLowerCase());
    const matchGodown = godownFilter === "all" || si.godownId === godownFilter;
    const matchHealth = healthFilter === "all" || getStockHealth(si.quantity, si.threshold) === healthFilter;
    return matchSearch && matchGodown && matchHealth;
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Finished Stocks</h1>
            <p className="mt-1 text-sm text-muted-foreground">Inventory across all godown locations</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-3 py-1 text-xs font-medium text-success">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" /> Live
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search product or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-12 rounded-xl pl-10"
            />
          </div>
          <Select value={godownFilter} onValueChange={setGodownFilter}>
            <SelectTrigger className="h-12 w-full rounded-xl sm:w-52">
              <SelectValue placeholder="All Godowns" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Godowns</SelectItem>
              {godownLocations.map(g => (
                <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-1 rounded-xl border border-border p-1">
            {healthFilters.map(f => (
              <button
                key={f}
                onClick={() => setHealthFilter(f)}
                className={`rounded-lg px-3 py-2 text-xs font-medium capitalize transition-colors ${
                  healthFilter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f === "all" ? "All" : f === "low" ? "Low Stock" : f === "critical" ? "Critical" : "Healthy"}
              </button>
            ))}
          </div>
          <Button variant="outline" className="h-12 rounded-xl">
            <Download className="h-4 w-4 mr-2" /> Export
          </Button>
        </div>

        {/* Table - Desktop */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-6 py-3">Product</th>
                  <th className="px-6 py-3">Godown</th>
                  <th className="px-6 py-3 text-right">Qty Available</th>
                  <th className="px-6 py-3">Unit</th>
                  <th className="px-6 py-3 text-right">Base Price</th>
                   <th className="px-6 py-3 text-right">Total Sold</th>
                   <th className="px-6 py-3 text-right">Est. Value</th>
                   <th className="px-6 py-3">Last Deducted</th>
                  <th className="px-6 py-3">Health</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, i) => {
                  const health = getStockHealth(item.quantity, item.threshold);
                  return (
                    <motion.tr
                      key={item.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className={`group border-b border-border/50 transition-colors hover:bg-muted/20 cursor-pointer ${
                        i % 2 === 0 ? "bg-card" : "bg-transparent"
                      }`}
                      style={{ minHeight: 64 }}
                      onClick={() => setSelectedItem(item)}
                    >
                      <td className="px-6 py-4">
                        <div className="font-medium">{item.productName}</div>
                        <div className="text-xs text-muted-foreground">{item.sku}</div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{item.godownName}</td>
                      <td className="px-6 py-4 text-right">
                        <QtyDisplay quantity={item.quantity} threshold={item.threshold} />
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{item.unit}</td>
                      <td className="px-6 py-4 text-right font-medium">{formatCurrency(item.quantity * item.basePrice)}</td>
                      <td className="px-6 py-4 text-muted-foreground">{item.lastDeductedDate ? getTimeAgo(item.lastDeductedDate) : "—"}</td>
                      <td className="px-6 py-4"><HealthBadge health={health} /></td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            className="rounded-lg p-2 hover:bg-muted/50 transition-colors"
                            onClick={(e) => { e.stopPropagation(); setSelectedItem(item); }}
                          >
                            <Eye className="h-4 w-4" strokeWidth={1.5} />
                          </button>
                          <button
                            className="rounded-lg p-2 hover:bg-muted/50 transition-colors"
                            onClick={(e) => { e.stopPropagation(); setTransferItem(item); }}
                          >
                            <ArrowLeftRight className="h-4 w-4" strokeWidth={1.5} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile card view */}
          <div className="space-y-0 md:hidden">
            {filtered.map((item) => {
              const health = getStockHealth(item.quantity, item.threshold);
              return (
                <div
                  key={item.id}
                  className="border-b border-border/50 p-4 transition-colors hover:bg-muted/20"
                  onClick={() => setSelectedItem(item)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium">{item.productName}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{item.sku} · {item.godownName}</div>
                    </div>
                    <QtyDisplay quantity={item.quantity} threshold={item.threshold} />
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <HealthBadge health={health} />
                    <span className="text-xs text-muted-foreground">{formatCurrency(item.quantity * item.basePrice)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <PackageOpen className="h-16 w-16 text-muted-foreground/30" strokeWidth={1.5} />
              <p className="mt-4 text-sm font-medium">No stock data yet.</p>
              <p className="text-xs text-muted-foreground mt-1">Stock will appear here once orders are dispatched.</p>
            </div>
          )}
        </div>
      </div>

      {selectedItem && (
        <StockDetailPanel
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onTransfer={(item) => { setSelectedItem(null); setTransferItem(item); }}
        />
      )}

      {transferItem && (
        <TransferStockModal
          item={transferItem}
          onClose={() => setTransferItem(null)}
        />
      )}
    </AppLayout>
  );
}
