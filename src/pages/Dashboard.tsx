import { useState } from "react";
import { motion } from "framer-motion";
import { formatCurrency, formatNumber } from "@/data/mock-data";
import { StatusBadge } from "@/components/ui/status-badge";
import { AppLayout } from "@/components/layout/AppLayout";
import { Link } from "react-router-dom";
import { useApi } from "@/services/api";
import { usePageLoading } from "@/hooks/use-loading";
import { DashboardSkeleton } from "@/components/ui/page-skeleton";
import { formatIndianDate } from "@/utils/formatDate";

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
                className={`flex items-center justify-center w-9 h-9 rounded-full text-xs font-semibold transition-all active:scale-90 ${
                  i === selectedDay
                    ? "bg-foreground text-background shadow-sm"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
          {kpis.map((kpi, i) => (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, type: "spring", stiffness: 300, damping: 24 }}
              className="glass-card p-5 md:p-6"
            >
              <p className="text-[11px] text-muted-foreground/60 font-semibold tracking-wide uppercase mb-2">{kpi.label}</p>
              <p className="text-2xl md:text-3xl font-bold tracking-tight">{kpi.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Dealers + Products side-by-side on desktop */}
        <div className="md:grid md:grid-cols-2 md:gap-6 space-y-6 md:space-y-0">
          {/* Top Dealers */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold md:text-base">Top Dealers</h2>
              <Link to="/distributors" className="text-xs text-muted-foreground/60 font-medium hover:text-muted-foreground transition-colors">View all</Link>
            </div>
            <div className="glass-card p-4 space-y-3.5">
              {topDistributors.map((d) => (
                <div key={d.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium">{d.name}</span>
                    <span className="text-xs text-muted-foreground">{formatCurrency(d.totalValue)}</span>
                  </div>
                  <div className="h-1 rounded-full bg-muted/60 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(d.totalValue / maxDistVal) * 100}%` }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                      className="h-full rounded-full bg-foreground/20 dark:bg-foreground/30"
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
              <Link to="/stock" className="text-xs text-muted-foreground/60 font-medium hover:text-muted-foreground transition-colors">View all</Link>
            </div>
            <div className="glass-card p-4 space-y-3.5">
              {topProducts.map((p) => (
                <div key={p.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium truncate mr-3">{p.name}</span>
                    <span className="text-xs text-muted-foreground shrink-0">{formatNumber(p.totalSold)} sold</span>
                  </div>
                  <div className="h-1 rounded-full bg-muted/60 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(p.totalSold / maxProdVal) * 100}%` }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                      className="h-full rounded-full bg-muted-foreground/20 dark:bg-muted-foreground/30"
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
            <Link to="/orders" className="text-xs text-muted-foreground/60 font-medium hover:text-muted-foreground transition-colors">View all</Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="glass-card p-10 text-center flex flex-col items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground/60"><path d="M16 6H3"/><path d="M21 12H8"/><path d="M21 18H8"/><path d="M3 12h.01"/><path d="M3 18h.01"/></svg>
              </div>
              <div>
                <p className="text-sm font-medium">No orders on {DAY_LABELS[selectedDay]}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Create an order to see it here</p>
              </div>
              <Link
                to="/orders/new"
                className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                Create Order
              </Link>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block glass-card overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-muted-foreground">
                      <th className="px-6 py-3 font-medium">Order</th>
                      <th className="px-6 py-3 font-medium">Dealer</th>
                      <th className="px-6 py-3 font-medium">Date</th>
                      <th className="px-6 py-3 font-medium text-right">Amount</th>
                      <th className="px-6 py-3 font-medium">Payment</th>
                      <th className="px-6 py-3 font-medium">Delivery</th>
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
              <div className="space-y-2.5 md:hidden">
                {recentOrders.map((o, i) => (
                  <motion.div
                    key={o.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i, 8) * 0.06 }}
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
