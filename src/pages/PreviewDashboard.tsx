import { useState } from "react";
import { orders, distributors, products, formatCurrency, formatNumber } from "@/data/mock-data";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, ShoppingCart, Users, Warehouse, BarChart3,
  TrendingUp, TrendingDown, Package, IndianRupee, Truck, CalendarDays
} from "lucide-react";
import { motion } from "framer-motion";

const mobileNav = [
  { title: "Home", url: "/preview", icon: LayoutDashboard },
  { title: "Orders", url: "/orders", icon: ShoppingCart },
  { title: "Godown", url: "/godown", icon: Warehouse },
  { title: "Dealers", url: "/distributors", icon: Users },
  { title: "Reports", url: "/reports", icon: BarChart3 },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

const DAYS = ["S", "M", "T", "W", "T", "F", "S"];

export default function PreviewDashboard() {
  const location = useLocation();
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

  const recentOrders = orders.slice(0, 5);

  const paymentColor: Record<string, string> = {
    paid: "bg-emerald-500/20 text-emerald-400",
    partial: "bg-amber-500/20 text-amber-400",
    pending: "bg-red-500/20 text-red-400",
  };
  const deliveryColor: Record<string, string> = {
    delivered: "bg-emerald-500/20 text-emerald-400",
    dispatched: "bg-blue-500/20 text-blue-400",
    pending: "bg-orange-500/20 text-orange-400",
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white relative">
      {/* Header */}
      <header className="px-5 pt-12 pb-2">
        <p className="text-[13px] text-white/40 font-medium tracking-wide uppercase">
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
                  ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
                  : "bg-white/[0.06] text-white/30"
              }`}
            >
              {d}
            </div>
          ))}
        </div>
      </header>

      {/* KPI Grid */}
      <section className="px-5 mt-6 grid grid-cols-2 gap-3">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="rounded-2xl bg-white/[0.06] backdrop-blur-xl border border-white/[0.08] p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-white/[0.08]">
                <kpi.icon className="w-4 h-4 text-white/50" />
              </div>
              <span className={`text-[11px] font-semibold flex items-center gap-0.5 ${kpi.up ? "text-emerald-400" : "text-red-400"}`}>
                {kpi.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {kpi.change}
              </span>
            </div>
            <p className="text-[22px] font-bold tracking-tight">{kpi.value}</p>
            <p className="text-[11px] text-white/35 font-medium mt-0.5">{kpi.label}</p>
          </motion.div>
        ))}
      </section>

      {/* Top Distributors */}
      <section className="px-5 mt-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[15px] font-semibold text-white/80">Top Distributors</h2>
          <Link to="/distributors" className="text-[12px] text-blue-400 font-medium">View all</Link>
        </div>
        <div className="rounded-2xl bg-white/[0.06] backdrop-blur-xl border border-white/[0.08] p-4 space-y-3.5">
          {topDistributors.map((d) => (
            <div key={d.id}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[13px] font-medium text-white/80">{d.name}</span>
                <span className="text-[12px] text-white/40">{formatCurrency(d.totalValue)}</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(d.totalValue / maxDistVal) * 100}%` }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400"
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Top Products */}
      <section className="px-5 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[15px] font-semibold text-white/80">Top Products</h2>
          <Link to="/products" className="text-[12px] text-blue-400 font-medium">View all</Link>
        </div>
        <div className="rounded-2xl bg-white/[0.06] backdrop-blur-xl border border-white/[0.08] p-4 space-y-3.5">
          {topProducts.map((p) => (
            <div key={p.id}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[13px] font-medium text-white/80 truncate mr-3">{p.name}</span>
                <span className="text-[12px] text-white/40 shrink-0">{formatNumber(p.totalSold)} sold</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(p.totalSold / maxProdVal) * 100}%` }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-400"
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Orders */}
      <section className="px-5 mt-6 pb-32">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[15px] font-semibold text-white/80">Recent Orders</h2>
          <Link to="/orders" className="text-[12px] text-blue-400 font-medium">View all</Link>
        </div>
        <div className="space-y-2.5">
          {recentOrders.map((o, i) => (
            <motion.div
              key={o.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.06 }}
              className="rounded-2xl bg-white/[0.06] backdrop-blur-xl border border-white/[0.08] p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[14px] font-semibold">{o.distributorName}</span>
                <span className="text-[14px] font-bold">{formatCurrency(o.total)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-white/35">{o.orderNumber} · {o.date}</span>
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

      {/* Floating Pill Bottom Nav */}
      <nav
        className="fixed bottom-4 left-4 right-4 z-50 flex items-center justify-around rounded-2xl bg-white/[0.08] backdrop-blur-2xl border border-white/[0.1] shadow-2xl shadow-black/40"
        style={{ paddingBottom: "max(8px, env(safe-area-inset-bottom))" }}
      >
        {mobileNav.map((item) => {
          const isActive = location.pathname === item.url;
          return (
            <Link
              key={item.title}
              to={item.url}
              className="flex flex-col items-center gap-0.5 py-3 px-2 relative"
            >
              {isActive && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute inset-1 rounded-xl bg-white/[0.12]"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <item.icon
                className={`w-5 h-5 relative z-10 transition-colors ${isActive ? "text-blue-400" : "text-white/30"}`}
                strokeWidth={isActive ? 2 : 1.5}
              />
              <span className={`text-[10px] font-semibold relative z-10 transition-colors ${isActive ? "text-blue-400" : "text-white/30"}`}>
                {item.title}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
