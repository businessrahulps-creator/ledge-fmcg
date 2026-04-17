import { useState, useEffect, useRef, useCallback } from "react";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { formatCurrency, formatNumber } from "@/data/mock-data";
import { StatusBadge } from "@/components/ui/status-badge";
import { AppLayout } from "@/components/layout/AppLayout";
import { Link, useNavigate } from "react-router-dom";
import { useApi } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { usePageLoading } from "@/hooks/use-loading";

import { formatIndianDate } from "@/utils/formatDate";
import { ShoppingCart, Plus, AlertTriangle } from "lucide-react";
import { SetupChecklist } from "@/components/onboarding/SetupChecklist";
import { trackDashboardVisit } from "@/hooks/use-install-prompt";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const toIsoDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function useTimeAgo(date: Date) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ago`;
}

const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const api = useApi();
  const isLoading = usePageLoading(api.loading);

  // Track last updated timestamp
  const [lastUpdated, setLastUpdated] = useState(() => new Date());
  const prevLoading = useRef(api.loading);
  useEffect(() => {
    if (prevLoading.current && !api.loading) {
      setLastUpdated(new Date());
    }
    prevLoading.current = api.loading;
  }, [api.loading]);
  const timeAgo = useTimeAgo(lastUpdated);

  const handleRefresh = useCallback(async () => {
    if (api.refreshAll) {
      await api.refreshAll();
    } else {
      await new Promise((r) => setTimeout(r, 600));
    }
  }, [api]);

  const { containerRef, pullDistance, refreshing } = usePullToRefresh({
    onRefresh: handleRefresh,
  });

  // Track dashboard visits for PWA install prompt milestone
  useEffect(() => { trackDashboardVisit(); }, []);
  const orders = api.orders.list();
  const distributors = api.dealers.list();
  const products = api.products.list();
  const today = new Date();
  const todayIso = toIsoDate(today);
  const last7Dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - 6 + i);
    return d;
  });
  const [selectedDate, setSelectedDate] = useState(todayIso);
  const selectedDateObj = new Date(selectedDate + "T00:00:00");
  const firstName = profile?.full_name?.split(" ")[0];

  // This Month aggregates
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthlyOrders = orders.filter((o) => {
    const d = new Date(o.date + "T00:00:00");
    return d >= monthStart && d <= today;
  });
  const monthRevenue = monthlyOrders.reduce((s, o) => s + o.total - (o.schemeSavings || 0), 0);
  const monthOrderCount = monthlyOrders.length;
  const monthOutstanding = monthlyOrders
    .filter((o) => o.paymentStatus === "pending" || o.paymentStatus === "partial")
    .reduce((s, o) => s + o.total - (o.schemeSavings || 0), 0);
  const monthDeliveredPct = monthOrderCount > 0
    ? Math.round((monthlyOrders.filter((o) => o.deliveryStatus === "delivered").length / monthOrderCount) * 100)
    : 0;
  const monthLabel = today.toLocaleDateString("en-IN", { month: "short", year: "numeric" });

  // 7-day revenue sparkline data
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - 6 + i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const dayRevenue = orders
      .filter(o => o.date === key)
      .reduce((s, o) => s + o.total - (o.schemeSavings || 0), 0);
    return { label: d.toLocaleDateString("en-IN", { weekday: "short" }), value: dayRevenue };
  });
  const sparkMax = Math.max(...last7Days.map(d => d.value), 1);
  const allZero = last7Days.every(d => d.value === 0);

  // Note: blocking page skeleton removed — render layout immediately and let
  // each section render inline skeletons via empty-state UIs while data streams in.

  // Filter orders by the exact selected date (rolling 7-day window picker)
  const filteredOrders = orders.filter((o) => o.date === selectedDate);

  const totalRevenue = filteredOrders.reduce((s, o) => s + o.total - (o.schemeSavings || 0), 0);
  const totalOrders = filteredOrders.length;
  const pendingOrders = filteredOrders.filter((o) => o.deliveryStatus === "pending").length;
  const dispatchedOrders = filteredOrders.filter((o) => o.deliveryStatus === "dispatched").length;

  const kpis = [
    { label: "Revenue", value: formatCurrency(totalRevenue) },
    { label: "Orders", value: totalOrders.toString() },
    { label: "Pending", value: pendingOrders.toString() },
    { label: "Dispatched", value: dispatchedOrders.toString() },
  ];

  // Credit at Risk
  const dealersAtRisk = distributors.filter(d => d.creditLimit > 0 && d.outstandingAmount >= d.creditLimit);

  const topDistributors = [...distributors].sort((a, b) => b.totalValue - a.totalValue).slice(0, 4);
  const maxDistVal = topDistributors[0]?.totalValue || 1;

  const topProducts = [...products].sort((a, b) => b.totalSold - a.totalSold).slice(0, 4);
  const maxProdVal = topProducts[0]?.totalSold || 1;

  const recentOrders = filteredOrders.slice(0, 6);

  return (
    <AppLayout>
      <div ref={containerRef} className="relative">
        {/* Pull-to-refresh indicator */}
        <div
          className="flex items-center justify-center overflow-hidden transition-[height] duration-200 ease-out"
          style={{ height: pullDistance > 0 || refreshing ? `${Math.max(pullDistance, refreshing ? 48 : 0)}px` : "0px" }}
        >
          <div
            className={cn(
              "h-5 w-5 rounded-full border-2 border-primary border-t-transparent",
              refreshing ? "animate-spin" : ""
            )}
            style={{
              opacity: Math.min(pullDistance / 80, 1),
              transform: `rotate(${pullDistance * 3}deg)`,
            }}
          />
        </div>
      <div className="space-y-8 md:space-y-10">
        {/* Onboarding checklist */}
        <SetupChecklist />
        {/* Header */}
        <div>
          <p className="text-[11px] text-muted-foreground/60 font-semibold tracking-widest uppercase md:text-xs">
            {today.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })}
          </p>
          <h1 className="text-xl font-bold tracking-tight mt-1 md:text-2xl">{getGreeting()}{firstName ? `, ${firstName}` : ""}</h1>
          <p className="text-[10px] text-muted-foreground/50 mt-1 flex items-center gap-1.5">
            Updated {timeAgo}
            <span className="text-muted-foreground/30">·</span>
            <button onClick={() => { if (!isLoading) api.refreshAll(); }} className={cn("underline decoration-muted-foreground/30 hover:text-muted-foreground transition-colors", isLoading && "opacity-50 pointer-events-none")}>
              {isLoading ? "Refreshing…" : "Refresh"}
            </button>
          </p>

          {/* This Month summary */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", damping: 26, stiffness: 200 }}
            className="glass-card p-4 mt-5"
          >
            <p className="text-[11px] text-muted-foreground/60 font-semibold tracking-widest uppercase mb-3">
              This Month · {monthLabel}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Revenue</p>
                <p className="text-sm font-bold tracking-tight tabular-nums">{formatCurrency(monthRevenue)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Orders</p>
                <p className="text-sm font-bold tracking-tight tabular-nums">{monthOrderCount}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Outstanding</p>
                <p className="text-sm font-bold tracking-tight tabular-nums">{formatCurrency(monthOutstanding)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Delivered</p>
                <p className="text-sm font-bold tracking-tight tabular-nums">{monthDeliveredPct}%</p>
              </div>
            </div>

            {/* 7-day revenue sparkline */}
            <div className="mt-4">
              <p className="text-[10px] text-muted-foreground/50 font-medium mb-2">Last 7 days</p>
              {allZero ? (
                <p className="text-[10px] text-muted-foreground/40 italic">No revenue this week</p>
              ) : (
                <div>
                  <svg viewBox="0 0 186 48" className="w-full h-12 text-primary/60" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="currentColor" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <polyline
                      fill="url(#sparkFill)"
                      stroke="none"
                      points={
                        last7Days.map((d, i) => `${i * 30},${44 - (d.value / sparkMax) * 40}`).join(" ") +
                        ` 180,44 0,44`
                      }
                    />
                    <polyline
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={last7Days.map((d, i) => `${i * 30},${44 - (d.value / sparkMax) * 40}`).join(" ")}
                    />
                    {last7Days.map((d, i) => (
                      <circle
                        key={i}
                        cx={i * 30}
                        cy={44 - (d.value / sparkMax) * 40}
                        r={i === 6 ? 3 : 2}
                        fill="currentColor"
                        opacity={i === 6 ? 1 : 0.6}
                      />
                    ))}
                  </svg>
                  <div className="flex justify-between mt-1">
                    {last7Days.map((d, i) => (
                      <span key={i} className={cn("text-[9px] tabular-nums", i === 6 ? "text-foreground font-medium" : "text-muted-foreground/50")}>{d.label}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Last 7 days date picker */}
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex gap-2 mt-5">
                  {last7Dates.map((d, i) => {
                    const iso = toIsoDate(d);
                    const isToday = iso === todayIso;
                    const isSelected = iso === selectedDate;
                    const weekdayLabel = isToday ? "Today" : DAY_SHORT[d.getDay()];
                    const fullLabel = d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" });
                    return (
                      <button
                        key={iso}
                        onClick={() => setSelectedDate(iso)}
                        aria-label={fullLabel}
                        aria-pressed={isSelected}
                        className={cn(
                          "relative flex flex-col items-center justify-center w-11 h-12 rounded-xl text-xs font-semibold transition-all active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                          isSelected
                            ? "bg-primary text-primary-foreground shadow-md"
                            : "bg-muted/60 text-muted-foreground hover:bg-muted"
                        )}
                      >
                        <span className={cn("text-[9px] font-medium leading-none mb-0.5", isSelected ? "opacity-90" : "opacity-70")}>
                          {weekdayLabel}
                        </span>
                        <span className="text-sm font-bold tabular-nums leading-none">{d.getDate()}</span>
                        {isToday && !isSelected && (
                          <span className="absolute bottom-1 h-1 w-1 rounded-full bg-primary" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs text-xs">
                Showing the last 7 days. Tap any date to see orders for that day.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <p className="text-[11px] text-muted-foreground/70 mt-2">
            Showing orders for {selectedDateObj.toLocaleDateString("en-IN", { weekday: "short" })}, {formatIndianDate(selectedDate)}
          </p>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {kpis.map((kpi, i) => (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, type: "spring", damping: 26, stiffness: 200 }}
              className="glass-card p-5 md:p-7 min-w-0"
            >
              <p className="text-xs text-muted-foreground font-semibold tracking-wide uppercase mb-2">{kpi.label}</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight tabular-nums whitespace-nowrap overflow-hidden text-ellipsis">{kpi.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Credit at Risk */}
        {dealersAtRisk.length > 0 && (
          <Link to="/distributors" className="block">
            <div className="glass-card p-4 flex items-center gap-3 card-hover">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-500/10">
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-red-600 dark:text-red-400">Credit at Risk</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {dealersAtRisk.length} dealer{dealersAtRisk.length > 1 ? "s" : ""} at or over credit limit
                </p>
              </div>
              <span className="text-lg font-bold text-red-600 dark:text-red-400">{dealersAtRisk.length}</span>
            </div>
          </Link>
        )}

        {/* Dealers + Products side-by-side on desktop */}
        <div className="md:grid md:grid-cols-2 md:gap-6 space-y-6 md:space-y-0">
          {/* Top Dealers */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold md:text-base">Top Dealers</h2>
              <Link to="/distributors" className="text-xs text-muted-foreground font-medium hover:text-foreground transition-colors">View all ›</Link>
            </div>
            <div className="glass-card p-4 space-y-3.5">
              {topDistributors.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No dealer data yet</p>
              ) : topDistributors.map((d, index) => (
                <div key={d.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium">{d.name}</span>
                    <span className="text-xs text-muted-foreground">{formatCurrency(d.totalValue)}</span>
                  </div>
                   <div className="h-1.5 rounded-full bg-muted/60 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(d.totalValue / maxDistVal) * 100}%` }}
                      transition={{ type: "spring", damping: 30, stiffness: 150, delay: 0.2 + index * 0.06 }}
className="h-full rounded-full bg-primary/40 dark:bg-primary/40"
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
              <Link to="/stock" className="text-xs text-muted-foreground font-medium hover:text-foreground transition-colors">View all ›</Link>
            </div>
            <div className="glass-card p-4 space-y-3.5">
              {topProducts.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No product data yet</p>
              ) : topProducts.map((p, index) => (
                <div key={p.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium truncate mr-3">{p.name}</span>
                    <span className="text-xs text-muted-foreground shrink-0">{formatNumber(p.totalSold)} sold</span>
                  </div>
                   <div className="h-1.5 rounded-full bg-muted/60 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(p.totalSold / maxProdVal) * 100}%` }}
                      transition={{ type: "spring", damping: 30, stiffness: 150, delay: 0.2 + index * 0.06 }}
className="h-full rounded-full bg-primary/60 dark:bg-primary/50"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Recent Orders */}
        <section>
           <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold md:text-base">Recent Orders</h2>
            <Link to="/orders" className="text-xs text-muted-foreground font-medium hover:text-foreground transition-colors">View all ›</Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="glass-card p-10 text-center flex flex-col items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <ShoppingCart className="h-5 w-5 text-muted-foreground/60" strokeWidth={1.5} />
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
                       <th className="px-6 py-3 font-semibold">Sales Person</th>
                       <th className="px-6 py-3 font-semibold">Date</th>
                       <th className="px-6 py-3 font-semibold text-right">Amount</th>
                       <th className="px-6 py-3 font-semibold">Payment</th>
                       <th className="px-6 py-3 font-semibold">Delivery</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => (
                      <tr key={order.id} className="border-b border-border/50 row-hover cursor-pointer" onClick={() => navigate(`/orders/${order.id}`)}>
                        <td className="px-6 py-4 font-medium">{order.orderNumber}</td>
                        <td className="px-6 py-4">{order.distributorName}</td>
                        <td className="px-6 py-4 text-muted-foreground">{order.salesperson}</td>
                        <td className="px-6 py-4 text-muted-foreground">{formatIndianDate(order.date)}</td>
                        <td className="px-6 py-4 text-right font-medium">{formatCurrency(order.total - (order.schemeSavings || 0))}</td>
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
                  <Link key={o.id} to={`/orders/${o.id}`}>
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i, 3) * 0.04, type: "spring", damping: 26, stiffness: 200 }}
                      className="glass-card card-hover p-4"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold">{o.distributorName}</span>
                        <span className="text-sm font-bold">{formatCurrency(o.total - (o.schemeSavings || 0))}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mb-2">{o.salesperson}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground">{o.orderNumber} · {formatIndianDate(o.date)}</span>
                        <div className="flex gap-1.5">
                          <StatusBadge status={o.paymentStatus} />
                          <StatusBadge status={o.deliveryStatus} />
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </section>
      </div>

      </div>
    </AppLayout>
  );
}
