import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package, IndianRupee, AlertTriangle, MapPin, ArrowRight } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { godownLocations, getGodownStats, getOverallStats, getStockHealth, stockItems } from "@/data/godown-data";
import { formatCurrency } from "@/data/mock-data";
import { motion } from "framer-motion";

function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setValue(target);
        clearInterval(timer);
      } else {
        setValue(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return value;
}

function KPICard({ icon: Icon, label, value, sub, accentWarning, delay }: {
  icon: React.ElementType; label: string; value: string; sub: string; accentWarning?: boolean; delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className={`relative rounded-xl border p-6 md:p-8 backdrop-blur-xl ${
        accentWarning ? "border-warning/40" : "border-border"
      }`}
      style={{ background: "rgba(22, 22, 31, 0.8)" }}
    >
      <div className={`absolute top-4 right-4 h-2 w-2 rounded-full ${accentWarning ? "bg-warning animate-pulse" : "bg-success"}`} />
      <Icon className="h-5 w-5 text-muted-foreground mb-3" strokeWidth={1.5} />
      <p className="text-[40px] font-bold leading-tight tracking-tight">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{sub}</p>
    </motion.div>
  );
}

export default function GodownOverview() {
  const stats = getOverallStats();
  const skuCount = useCountUp(stats.uniqueProducts);
  const valueCount = useCountUp(stats.totalValue);
  const alertCount = useCountUp(stats.lowStockAlerts);

  return (
    <AppLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Godown Overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">Real-time visibility into finished goods stock</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KPICard icon={Package} label="Total SKUs" value={String(skuCount)} sub="Across all godowns" delay={0} />
          <KPICard icon={IndianRupee} label="Stock Value" value={formatCurrency(valueCount)} sub="At current price" delay={0.1} />
          <KPICard icon={AlertTriangle} label="Low Stock" value={String(alertCount)} sub="Below threshold" accentWarning={stats.lowStockAlerts > 0} delay={0.2} />
          <KPICard icon={MapPin} label="Locations" value={String(stats.activeGodowns)} sub="All operational" delay={0.3} />
        </div>

        {/* Godown Location Cards */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Godown Locations</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {godownLocations.filter(g => g.isActive).map((godown, i) => {
              const gs = getGodownStats(godown.id);
              return (
                <motion.div
                  key={godown.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.1, duration: 0.4 }}
                  className="group rounded-xl border border-border bg-card p-6 transition-all duration-200 hover:border-primary/40 hover:-translate-y-0.5"
                >
                  <h3 className="text-base font-semibold">{godown.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{godown.address}</p>
                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total SKUs</span>
                      <span className="font-medium">{gs.totalSKUs}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Stock Value</span>
                      <span className="font-medium">{formatCurrency(gs.totalValue)}</span>
                    </div>
                    {gs.lowStockCount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-warning">Low Stock Items</span>
                        <span className="font-medium text-warning">{gs.lowStockCount}</span>
                      </div>
                    )}
                  </div>
                  <Link
                    to={`/godown/inventory?location=${godown.id}`}
                    className="mt-4 inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors"
                  >
                    View Inventory <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Stock Health Bar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.4 }}
          className="rounded-xl border border-border bg-card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Overall Stock Health</h3>
          </div>
          <div className="flex h-3 w-full overflow-hidden rounded-full">
            {stats.healthyCount > 0 && (
              <div
                className="bg-success transition-all"
                style={{ width: `${(stats.healthyCount / stats.total) * 100}%` }}
              />
            )}
            {stats.lowCount > 0 && (
              <div
                className="bg-warning transition-all"
                style={{ width: `${(stats.lowCount / stats.total) * 100}%` }}
              />
            )}
            {stats.criticalCount > 0 && (
              <div
                className="bg-destructive transition-all"
                style={{ width: `${(stats.criticalCount / stats.total) * 100}%` }}
              />
            )}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            {stats.healthyCount} healthy · {stats.lowCount} low · {stats.criticalCount} critical
          </p>
        </motion.div>
      </div>
    </AppLayout>
  );
}
