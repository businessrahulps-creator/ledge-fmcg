import { motion } from "framer-motion";
import {
  IndianRupee,
  Package,
  Truck,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { orders, distributors, products, formatCurrency, formatNumber } from "@/data/mock-data";
import { StatusBadge } from "@/components/ui/status-badge";
import { AppLayout } from "@/components/layout/AppLayout";
import { Link } from "react-router-dom";

const DAYS = ["S", "M", "T", "W", "T", "F", "S"];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

export default function Dashboard() {
  const today = new Date();
  const dayOfWeek = today.getDay();

  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
  const totalOrders = orders.length;
  const pendingOrders = orders.filter((o) => o.deliveryStatus === "pending").length;
  const dispatchedOrders = orders.filter((o) => o.deliveryStatus === "dispatched").length;

  const kpis = [
    { label: "Revenue", value: formatCurrency(totalRevenue), icon: IndianRupee, change: "+12%", up: true },
    { label: "Orders", value: totalOrders.toString(), icon: Package, change: "+8%", up: true },
    { label: "Pending", value: pendingOrders.toString(), icon: Truck, change: "-3%", up: false },
    { label: "Dispatched", value: dispatchedOrders.toString(), icon: Truck, change: "+5%", up: true },
  ];

  const topDistributors = [...distributors].sort((a, b) => b.totalValue - a.totalValue).slice(0, 4);
  const maxDistVal = topDistributors[0]?.totalValue || 1;

  const topProducts = [...products].sort((a, b) => b.totalSold - a.totalSold).slice(0, 4);
  const maxProdVal = topProducts[0]?.totalSold || 1;

  const recentOrders = orders.slice(0, 6);


  return (
    <AppLayout>
      <div className="space-y-6 md:space-y-8">
        {/* Header */}
        <div>
          <p className="text-[13px] text-muted-foreground font-medium tracking-wide uppercase">
            {today.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })}
          </p>
          <h1 className="text-[28px] font-bold tracking-tight mt-0.5">{getGreeting()} 👋</h1>

          {/* Day-of-week row */}
          <div className="flex gap-2.5 mt-4">
            {DAYS.map((d, i) => (
              <div
                key={i}
                className={`flex items-center justify-center w-9 h-9 rounded-full text-[13px] font-semibold transition-all ${
                  i === dayOfWeek
                    ? "bg-foreground text-background shadow-md"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {d}
              </div>
            ))}
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {kpis.map((kpi, i) => (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="glass-card card-hover p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-muted">
                  <kpi.icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <span className={`text-[11px] font-semibold flex items-center gap-0.5 ${kpi.up ? "text-emerald-500" : "text-red-400"}`}>
                  {kpi.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {kpi.change}
                </span>
              </div>
              <p className="text-[22px] font-bold tracking-tight">{kpi.value}</p>
              <p className="text-[11px] text-muted-foreground font-medium mt-0.5">{kpi.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Dealers + Products side-by-side on desktop */}
        <div className="md:grid md:grid-cols-2 md:gap-6 space-y-6 md:space-y-0">
          {/* Top Dealers */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[15px] font-semibold">Top Dealers</h2>
              <Link to="/distributors" className="text-[12px] text-muted-foreground font-medium">View all</Link>
            </div>
            <div className="glass-card p-4 space-y-3.5">
              {topDistributors.map((d) => (
                <div key={d.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[13px] font-medium">{d.name}</span>
                    <span className="text-[12px] text-muted-foreground">{formatCurrency(d.totalValue)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(d.totalValue / maxDistVal) * 100}%` }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                      className="h-full rounded-full bg-gradient-to-r from-foreground/80 to-foreground/40"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Top Products */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[15px] font-semibold">Top Products</h2>
              <Link to="/stock" className="text-[12px] text-muted-foreground font-medium">View all</Link>
            </div>
            <div className="glass-card p-4 space-y-3.5">
              {topProducts.map((p) => (
                <div key={p.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[13px] font-medium truncate mr-3">{p.name}</span>
                    <span className="text-[12px] text-muted-foreground shrink-0">{formatNumber(p.totalSold)} sold</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(p.totalSold / maxProdVal) * 100}%` }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                      className="h-full rounded-full bg-gradient-to-r from-muted-foreground/60 to-muted-foreground/30"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Recent Orders */}
        <section className="pb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[15px] font-semibold">Recent Orders</h2>
            <Link to="/orders" className="text-[12px] text-muted-foreground font-medium">View all</Link>
          </div>

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
                    <td className="px-6 py-4 text-muted-foreground">{order.date}</td>
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
                transition={{ delay: 0.1 + i * 0.06 }}
                className="glass-card card-hover p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[14px] font-semibold">{o.distributorName}</span>
                  <span className="text-[14px] font-bold">{formatCurrency(o.total)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">{o.orderNumber} · {o.date}</span>
                  <div className="flex gap-1.5">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${paymentColor[o.paymentStatus]}`}>
                      {o.paymentStatus}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${deliveryColor[o.deliveryStatus]}`}>
                      {o.deliveryStatus}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
