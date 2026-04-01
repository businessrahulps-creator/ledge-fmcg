import { AlertTriangle, PackageCheck } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { stockItems, getStockHealth } from "@/data/godown-data";
import { motion } from "framer-motion";
import { useState } from "react";
import { TransferStockModal } from "@/components/godown/TransferStockModal";
import type { StockItem } from "@/data/godown-data";

export default function GodownAlerts() {
  const [transferItem, setTransferItem] = useState<StockItem | null>(null);
  const alertItems = stockItems.filter(si => getStockHealth(si.quantity, si.threshold) !== "healthy");
  const criticalCount = alertItems.filter(si => getStockHealth(si.quantity, si.threshold) === "critical").length;
  const lowCount = alertItems.filter(si => getStockHealth(si.quantity, si.threshold) === "low").length;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Low Stock Alerts</h1>
          <p className="mt-1 text-sm text-muted-foreground">Products that need attention across your godowns</p>
        </div>

        {alertItems.length > 0 ? (
          <>
            {/* Summary strip */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-warning/40 bg-muted/30 px-4 py-3 text-sm"
            >
              <span className="font-medium">{alertItems.length} items need attention</span>
              <span className="text-muted-foreground"> — {criticalCount} critical, {lowCount} low stock</span>
            </motion.div>

            {/* Alert cards */}
            <div className="space-y-3">
              {alertItems.map((item, i) => {
                const health = getStockHealth(item.quantity, item.threshold);
                const isCritical = health === "critical";
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`rounded-xl border border-border bg-card p-6 ${
                      isCritical ? "border-l-4 border-l-destructive" : "border-l-4 border-l-warning"
                    }`}
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className={`h-5 w-5 mt-0.5 shrink-0 ${isCritical ? "text-destructive" : "text-warning"}`} strokeWidth={1.5} />
                        <div>
                          <p className="text-base font-semibold">{item.productName}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{item.sku}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-6 text-sm">
                        <div>
                          <span className="text-muted-foreground">Qty: </span>
                          <span className={`font-bold ${isCritical ? "text-destructive" : "text-warning"}`}>{item.quantity}</span>
                          <span className="text-muted-foreground"> / Threshold: {item.threshold}</span>
                        </div>
                        <div className="text-muted-foreground">{item.godownName}</div>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          isCritical ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"
                        }`}>
                          {isCritical ? "Critical" : "Low Stock"}
                        </span>
                        <button
                          onClick={() => setTransferItem(item)}
                          className="rounded-xl border border-border px-4 py-2 text-xs font-medium hover:bg-muted/50 transition-colors"
                        >
                          Transfer Stock
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <PackageCheck className="h-12 w-12 text-success" strokeWidth={1.5} />
            <p className="mt-4 text-base font-medium">All stock levels are healthy.</p>
            <p className="text-sm text-muted-foreground mt-1">No items are below their threshold.</p>
          </div>
        )}
      </div>

      {transferItem && (
        <TransferStockModal item={transferItem} onClose={() => setTransferItem(null)} />
      )}
    </AppLayout>
  );
}
