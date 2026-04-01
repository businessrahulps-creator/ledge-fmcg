import { X, ArrowLeftRight, ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { stockItems, stockDeductions, getStockHealth, getTimeAgo, generateSparklineData, type StockItem } from "@/data/godown-data";
import { formatCurrency } from "@/data/mock-data";
import { motion, AnimatePresence } from "framer-motion";

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

function Sparkline({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 400;
  const h = 80;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 8)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-20" preserveAspectRatio="none">
      <polyline fill="none" stroke="hsl(var(--primary))" strokeWidth="2" points={points} />
    </svg>
  );
}

interface Props {
  item: StockItem;
  onClose: () => void;
  onTransfer: (item: StockItem) => void;
}

export function StockDetailPanel({ item, onClose, onTransfer }: Props) {
  const relatedStock = stockItems.filter(si => si.productId === item.productId);
  const totalQty = relatedStock.reduce((s, si) => s + si.quantity, 0);
  const deductions = stockDeductions.filter(sd => sd.productId === item.productId).slice(0, 10);
  const sparkData = generateSparklineData(item.quantity);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end">
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="relative w-full max-w-[640px] bg-background border-l border-border overflow-y-auto"
        >
          <div className="p-6 space-y-8">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold">{item.productName}</h2>
                <p className="text-sm text-muted-foreground mt-0.5">{item.sku}</p>
              </div>
              <button onClick={onClose} className="rounded-lg p-2 hover:bg-muted/50 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Stock by Godown */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Stock by Godown</h3>
              <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="px-4 py-2.5 text-left font-medium">Godown</th>
                      <th className="px-4 py-2.5 text-right font-medium">Qty</th>
                      <th className="px-4 py-2.5 text-left font-medium">Unit</th>
                      <th className="px-4 py-2.5 text-left font-medium">Health</th>
                    </tr>
                  </thead>
                  <tbody>
                    {relatedStock.map(si => (
                      <tr key={si.id} className="border-b border-border/50">
                        <td className="px-4 py-3">{si.godownName}</td>
                        <td className={`px-4 py-3 text-right font-bold ${
                          getStockHealth(si.quantity, si.threshold) === "healthy" ? "text-success" :
                          getStockHealth(si.quantity, si.threshold) === "low" ? "text-warning" : "text-destructive"
                        }`}>{si.quantity}</td>
                        <td className="px-4 py-3 text-muted-foreground">{si.unit}</td>
                        <td className="px-4 py-3"><HealthBadge health={getStockHealth(si.quantity, si.threshold)} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Total: {totalQty} units across {relatedStock.length} godown{relatedStock.length > 1 ? "s" : ""}
              </p>
            </div>

            {/* Recent Deductions */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Recent Deductions</h3>
              {deductions.length > 0 ? (
                <div className="space-y-2">
                  {deductions.map(d => (
                    <div key={d.id} className="rounded-lg border border-border/50 bg-muted/10 px-4 py-3 text-sm">
                      <span className="text-muted-foreground">{d.date}</span>
                      <span className="mx-2">·</span>
                      <span className="text-primary font-medium">{d.orderNumber}</span>
                      <span className="mx-2">→</span>
                      <span>{d.distributorName}</span>
                      <span className="mx-2">→</span>
                      <span className="text-destructive font-medium">{d.quantityDeducted} units deducted</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No deductions recorded yet.</p>
              )}
            </div>

            {/* Sparkline */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Stock Trend — Last 30 Days</h3>
              <div className="rounded-xl border border-border p-4">
                <Sparkline data={sparkData} />
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-3 pt-4 border-t border-border">
              <Button variant="outline" className="flex-1 h-12 rounded-xl" onClick={() => onTransfer(item)}>
                <ArrowLeftRight className="h-4 w-4 mr-2" /> Transfer Stock
              </Button>
              <Button asChild className="flex-1 h-12 rounded-xl">
                <Link to={`/orders/new?productId=${item.productId}`}>
                  <ShoppingCart className="h-4 w-4 mr-2" /> Add to Sales Order
                </Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
