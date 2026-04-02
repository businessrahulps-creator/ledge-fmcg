import { orders, distributors, products, formatCurrency, formatNumber } from "@/data/mock-data";
import { Link, useLocation } from "react-router-dom";
import {
  House, Receipt, UserRound, Box, ChartNoAxesCombined,
  TrendingUp, TrendingDown, Package, IndianRupee, Truck
} from "lucide-react";
import { motion } from "framer-motion";

const mobileNav = [
  { title: "Home", url: "/preview", icon: House },
  { title: "Orders", url: "/orders", icon: Receipt },
  { title: "Godown", url: "/godown", icon: Box },
  { title: "Dealers", url: "/distributors", icon: UserRound },
  { title: "Reports", url: "/reports", icon: ChartNoAxesCombined },
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
    paid: "bg-emerald-50 text-emerald-600",
    partial: "bg-amber-50 text-amber-600",
    pending: "bg-red-50 text-red-500",
  };
  const deliveryColor: Record<string, string> = {
    delivered: "bg-emerald-50 text-emerald-600",
    dispatched: "bg-blue-50 text-blue-600",
    pending: "bg-orange-50 text-orange-500",
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#111] relative">
      <div className="max-w-lg mx-auto md:max-w-5xl px-5 md:px-8">
        {/* Header */}
        <header className="pt-14 pb-2">
          <p className="text-[13px] text-[#999] font-medium tracking-wide uppercase">
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
                    ? "bg-[#111] text-white shadow-md"
                    : "bg-[#F0F0F0] text-[#BBB]"
                }`}
              >
                {d}
              </div>
            ))}
          </div>
        </header>

        {/* KPI Grid */}
        <section className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          {kpis.map((kpi, i) => (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="rounded-2xl bg-white border border-[#EBEBEB] shadow-sm p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-[#F5F5F5]">
                  <kpi.icon className="w-4 h-4 text-[#666]" />
                </div>
                <span className={`text-[11px] font-semibold flex items-center gap-0.5 ${kpi.up ? "text-emerald-500" : "text-red-400"}`}>
                  {kpi.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {kpi.change}
                </span>
              </div>
              <p className="text-[22px] font-bold tracking-tight text-[#111]">{kpi.value}</p>
              <p className="text-[11px] text-[#888] font-medium mt-0.5">{kpi.label}</p>
            </motion.div>
          ))}
        </section>

        {/* Distributors + Products side-by-side on desktop */}
        <div className="mt-8 md:grid md:grid-cols-2 md:gap-6 space-y-6 md:space-y-0">
          {/* Top Distributors */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[15px] font-semibold text-[#111]">Top Distributors</h2>
              <Link to="/distributors" className="text-[12px] text-[#888] font-medium">View all</Link>
            </div>
            <div className="rounded-2xl bg-white border border-[#EBEBEB] shadow-sm p-4 space-y-3.5">
              {topDistributors.map((d) => (
                <div key={d.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[13px] font-medium text-[#333]">{d.name}</span>
                    <span className="text-[12px] text-[#999]">{formatCurrency(d.totalValue)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#F0F0F0] overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(d.totalValue / maxDistVal) * 100}%` }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                      className="h-full rounded-full bg-gradient-to-r from-[#111] to-[#444]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Top Products */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[15px] font-semibold text-[#111]">Top Products</h2>
              <Link to="/products" className="text-[12px] text-[#888] font-medium">View all</Link>
            </div>
            <div className="rounded-2xl bg-white border border-[#EBEBEB] shadow-sm p-4 space-y-3.5">
              {topProducts.map((p) => (
                <div key={p.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[13px] font-medium text-[#333] truncate mr-3">{p.name}</span>
                    <span className="text-[12px] text-[#999] shrink-0">{formatNumber(p.totalSold)} sold</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#F0F0F0] overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(p.totalSold / maxProdVal) * 100}%` }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                      className="h-full rounded-full bg-gradient-to-r from-[#666] to-[#AAA]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Recent Orders */}
        <section className="mt-6 pb-32 md:pb-12">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[15px] font-semibold text-[#111]">Recent Orders</h2>
            <Link to="/orders" className="text-[12px] text-[#888] font-medium">View all</Link>
          </div>
          <div className="space-y-2.5 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
            {recentOrders.map((o, i) => (
              <motion.div
                key={o.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.06 }}
                className="rounded-2xl bg-white border border-[#EBEBEB] shadow-sm p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[14px] font-semibold text-[#111]">{o.distributorName}</span>
                  <span className="text-[14px] font-bold text-[#111]">{formatCurrency(o.total)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[#AAA]">{o.orderNumber} · {o.date}</span>
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

      {/* Floating Pill Bottom Nav — mobile only */}
      <nav
        className="fixed bottom-4 left-4 right-4 z-50 flex items-center justify-around rounded-2xl bg-white border border-[#E8E8E8] shadow-lg shadow-black/5 md:hidden"
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
                  className="absolute inset-1 rounded-xl bg-[#F0F0F0]"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <item.icon
                className={`w-[18px] h-[18px] relative z-10 transition-colors ${isActive ? "text-[#111]" : "text-[#BBB]"}`}
                strokeWidth={isActive ? 1.8 : 1.5}
              />
              <span className={`text-[10px] font-semibold relative z-10 transition-colors ${isActive ? "text-[#111]" : "text-[#BBB]"}`}>
                {item.title}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
