import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { formatCurrency, formatNumber } from "@/data/mock-data";
import { StatusBadge } from "@/components/ui/status-badge";
import { AppLayout } from "@/components/layout/AppLayout";
import { Link } from "react-router-dom";
import { useApi } from "@/services/api";
import { usePageLoading } from "@/hooks/use-loading";
import { DashboardSkeleton } from "@/components/ui/page-skeleton";
import { formatIndianDate } from "@/utils/formatDate";
import { ListChecks, Plus } from "lucide-react";
import { trackDashboardVisit } from "@/hooks/use-install-prompt";

const DAYS = ["S", "M", "T", "W", "T", "F", "S"];
const DAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

export default function Dashboard() {
  const api = useApi();
  const isLoading = usePageLoading(api.loading);

  // Track dashboard visits for PWA install prompt milestone
  useEffect(() => { trackDashboardVisit(); }, []);
  const orders = api.orders.list();
  const distributors = api.dealers.list();
  const products = api.products.list();
  const today = new Date();
  const [selectedDay, setSelectedDay] = useState(today.getDay());

  if (isLoading) {
    return <AppLayout><DashboardSkeleton /></AppLayout>;
  }

  // Parse date as local timezone to avoid UTC offset shifting the day
  const filteredOrders = orders.filter((o) => {
    const orderDay = new Date(o.date + "T00:00:00").getDay();
    return orderDay === selectedDay;
  });

  const totalRevenue = filteredOrders.reduce((s, o) => s + o.total, 0);
  const totalOrders = filteredOrders.length;
  const pendingOrders = filteredOrders.filter((o) => o.deliveryStatus === "pending").length;
  const dispatchedOrders = filteredOrders.filter((o) => o.deliveryStatus === "dispatched").length;

  const kpiAccents = [
    "border-l-4 border-l-emerald-500",
    "border-l-4 border-l-blue-500",
    "border-l-4 border-l-amber-500",
    "border-l-4 border-l-indigo-500",
  ];

  const kpis = [
    { label: "Revenue", value: formatCurrency(totalRevenue) },
    { label: "Orders", value: totalOrders.toString() },
    { label: "Pending", value: pendingOrders.toString() },
    { label: "Dispatched", value: dispatchedOrders.toString() },
  ];

  const topDistributors = [...distributors].sort((a, b) => b.totalValue - a.totalValue).slice(0, 4);
  const maxDistVal = topDistributors[0]?.totalValue || 1;

  const topProducts = [...products].sort((a, b) => b.totalSold - a.totalSold).slice(0, 4);
  const maxProdVal = topProducts[0]?.totalSold || 1;

  const recentOrders = filteredOrders.slice(0, 6);

  return (
    <AppLayout>
      <div className="space-y-8 md:space-y-10">
        {/* Header */}
        <div>
          <p className="text-[11px] text-muted-foreground/60 font-semibold tracking-widest uppercase md:text-xs">
            {today.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })}
          </p>
          <h1 className="text-xl font-bold tracking-tight mt-1 md:text-2xl">{getGreeting()} 👋</h1>

          {/* Day-of-week row */}
          <div className="flex gap-2.5 mt-5">
            {DAYS.map((d, i) => (
              <button
                key={i}
                onClick={() => setSelectedDay(i)}
                aria-label={DAY_LABELS[i]}
                className={`flex items-center justify-center w-9 h-9 rounded-full text-xs font-semibold transition-all active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                  i === selectedDay
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {kpis.map((kpi, i) => (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, type: "spring", stiffness: 280 + i * 15, damping: 22 + i * 2 }}
              className={`glass-card p-5 md:p-7 min-w-0 ${kpiAccents[i]}`}
            >
              <p className="text-xs text-muted-foreground font-semibold tracking-wide uppercase mb-2">{kpi.label}</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight tabular-nums whitespace-nowrap overflow-hidden text-ellipsis">{kpi.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Dealers + Products side-by-side on desktop */}
        <div className="md:grid md:grid-cols-2 md:gap-6 space-y-6 md:space-y-0">
          {/* Top Dealers */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold md:text-base">Top Dealers</h2>
              <Link to="/distributors" className="text-xs text-muted-foreground font-medium hover:text-foreground transition-colors">View all →</Link>
            </div>
            <div className="glass-card p-4 space-y-3.5">
              {topDistributors.map((d, index) => (
                <div key={d.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium">{d.name}</span>
                    <span className="text-xs text-muted-foreground">{formatCurrency(d.totalValue)}</span>
                  </div>
                   <div className="h-1.5 rounded-full bg-muted/60 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(d.totalValue / maxDistVal) * 100}%` }}
                      transition={{ duration: 0.8, delay: 0.3 + index * 0.15 }}
                      className="h-full rounded-full bg-primary/30 dark:bg-primary/40"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Top Products */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold md:text-base">Top Products</h2>
              <Link to="/stock" className="text-xs text-muted-foreground font-medium hover:text-foreground transition-colors">View all →</Link>
            </div>
            <div className="glass-card p-4 space-y-3.5">
              {topProducts.map((p, index) => (
                <div key={p.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium truncate mr-3">{p.name}</span>
                    <span className="text-xs text-muted-foreground shrink-0">{formatNumber(p.totalSold)} sold</span>
                  </div>
                   <div className="h-1.5 rounded-full bg-muted/60 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(p.totalSold / maxProdVal) * 100}%` }}
                      transition={{ duration: 0.8, delay: 0.3 + index * 0.15 }}
                      className="h-full rounded-full bg-primary/30 dark:bg-primary/40"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Recent Orders */}
        <section className="pb-8">
           <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold md:text-base">Recent Orders</h2>
            <Link to="/orders" className="text-xs text-muted-foreground font-medium hover:text-foreground transition-colors">View all →</Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="glass-card p-10 text-center flex flex-col items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <ListChecks className="h-5 w-5 text-muted-foreground/60" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-sm font-medium">No orders on {DAY_LABELS[selectedDay]}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Create an order to see it here</p>
              </div>
              <Link
                to="/orders/new"
                className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <Plus className="h-3.5 w-3.5" />
                Create Order
              </Link>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block glass-card overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                     <tr className="border-b border-border bg-muted/30 text-left text-xs text-muted-foreground">
                       <th className="px-6 py-3 font-semibold">Order</th>
                       <th className="px-6 py-3 font-semibold">Dealer</th>
                       <th className="px-6 py-3 font-semibold">Date</th>
                       <th className="px-6 py-3 font-semibold text-right">Amount</th>
                       <th className="px-6 py-3 font-semibold">Payment</th>
                       <th className="px-6 py-3 font-semibold">Delivery</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => (
                      <tr key={order.id} className="border-b border-border/50 row-hover">
                        <td className="px-6 py-4 font-medium">{order.orderNumber}</td>
                        <td className="px-6 py-4">{order.distributorName}</td>
                        <td className="px-6 py-4 text-muted-foreground">{formatIndianDate(order.date)}</td>
                        <td className="px-6 py-4 text-right font-medium">{formatCurrency(order.total)}</td>
                        <td className="px-6 py-4"><StatusBadge status={order.paymentStatus} /></td>
                        <td className="px-6 py-4"><StatusBadge status={order.deliveryStatus} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="space-y-3 md:hidden">
                {recentOrders.map((o, i) => (
                  <motion.div
                    key={o.id}
                    initial={{ opacity: 0, y: i % 2 === 0 ? 16 : 0, x: i % 2 === 0 ? 0 : -8 }}
                    animate={{ opacity: 1, y: 0, x: 0 }}
                    transition={{ delay: Math.min(i, 8) * 0.06, type: "spring", stiffness: 300, damping: 24 }}
                    className="glass-card card-hover p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold">{o.distributorName}</span>
                      <span className="text-sm font-bold">{formatCurrency(o.total)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground">{o.orderNumber} · {formatIndianDate(o.date)}</span>
                      <div className="flex gap-1.5">
                        <StatusBadge status={o.paymentStatus} />
                        <StatusBadge status={o.deliveryStatus} />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </AppLayout>
  );
}
