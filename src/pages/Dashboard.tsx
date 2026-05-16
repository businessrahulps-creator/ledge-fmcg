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
import { ShoppingCart, Plus, AlertTriangle, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { SetupChecklist } from "@/components/onboarding/SetupChecklist";
import { TodayDigest } from "@/components/dashboard/TodayDigest";
import { ExplainButton } from "@/components/ui/explain-button";
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

  // Previous month aggregates for insight deltas
  const prevMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const prevMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
  const prevMonthLabel = prevMonthStart.toLocaleDateString("en-IN", { month: "short" });
  const prevMonthlyOrders = orders.filter((o) => {
    const d = new Date(o.date + "T00:00:00");
    return d >= prevMonthStart && d <= prevMonthEnd;
  });
  const prevMonthRevenue = prevMonthlyOrders.reduce((s, o) => s + o.total - (o.schemeSavings || 0), 0);
  const prevMonthOrderCount = prevMonthlyOrders.length;
  const prevMonthDeliveredPct = prevMonthOrderCount > 0
    ? Math.round((prevMonthlyOrders.filter((o) => o.deliveryStatus === "delivered").length / prevMonthOrderCount) * 100)
    : 0;
  const pctDelta = (curr: number, prev: number): number | null => {
    if (prev === 0) return null;
    return Math.round(((curr - prev) / prev) * 100);
  };
  const revenueDelta = pctDelta(monthRevenue, prevMonthRevenue);
  const ordersDelta = pctDelta(monthOrderCount, prevMonthOrderCount);
  const deliveredDelta = monthDeliveredPct - prevMonthDeliveredPct;
  // DSO proxy: avg days since order for outstanding orders
  const outstandingOrders = monthlyOrders.filter((o) => o.paymentStatus === "pending" || o.paymentStatus === "partial");
  const avgOutstandingDays = outstandingOrders.length > 0
    ? Math.round(outstandingOrders.reduce((s, o) => {
        const days = Math.max(0, Math.floor((today.getTime() - new Date(o.date + "T00:00:00").getTime()) / 86400000));
        return s + days;
      }, 0) / outstandingOrders.length)
    : 0;

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
  const dealersApproaching = distributors.filter(d => {
    if (d.creditLimit <= 0 || d.outstandingAmount >= d.creditLimit) return false;
    const pct = d.outstandingAmount / d.creditLimit;
    return pct >= 0.8;
  });
  const atRiskAmount = dealersAtRisk.reduce((s, d) => s + d.outstandingAmount, 0);

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
      <div className="space-y-7 md:space-y-8">
        {/* Onboarding checklist */}
        <SetupChecklist />

        {/* AI "Today" briefing — 2-sentence Gemini digest, cached per-day */}
        {(monthOrderCount > 0 || monthOutstanding > 0 || dealersAtRisk.length > 0) && (
          <TodayDigest
            cacheKey={todayIso}
            context={{
              todayOrders: totalOrders,
              todayRevenue: totalRevenue,
              monthOrders: monthOrderCount,
              monthRevenue: monthRevenue,
              outstanding: monthOutstanding,
              overdueDealers: dealersAtRisk.length,
              lowStockSkus: 0,
              topDealer: topDistributors[0]?.name,
            }}
          />
        )}

        {/* Hero: greeting + This Month + sparkline as ONE composed block */}
        <motion.section
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", damping: 26, stiffness: 200 }}
        >
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 md:gap-8">
            <div>
              <p className="text-[10px] text-muted-foreground/60 font-semibold tracking-[0.22em] uppercase">
                {today.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })}
              </p>
              <div className="relative inline-block mt-1.5">
                <h1 className="h1-display">{getGreeting()}{firstName ? `, ${firstName}` : ""}</h1>
                <motion.span
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  style={{ transformOrigin: "left" }}
                  className="absolute -bottom-1 left-0 h-px w-full bg-foreground/25"
                  aria-hidden
                />
              </div>
              <p className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1.5">
                Updated {timeAgo}
                <span className="text-muted-foreground/30">·</span>
                <button onClick={() => { if (!isLoading) api.refreshAll(); }} className={cn("text-link", isLoading && "opacity-50 pointer-events-none")}>
                  {isLoading ? "Refreshing…" : "Refresh"}
                </button>
              </p>
            </div>
            <span className="timeframe-pill md:self-end">
              This Month · {monthLabel}
            </span>
          </div>

          {/* This Month strip — hairline-separated stat cells, no card border */}
          <div className="mt-5 grid grid-cols-2 md:grid-cols-4 border-y border-border/60 divide-x divide-border/60">
            {(() => {
              const renderDelta = (delta: number | null, suffix = "%") => {
                if (delta === null) {
                  return <span className="insight-line insight-flat">— no {prevMonthLabel} data</span>;
                }
                if (delta === 0) {
                  return <span className="insight-line insight-flat"><Minus className="icon-inline" />Flat vs {prevMonthLabel}</span>;
                }
                const up = delta > 0;
                return (
                  <span className={cn("insight-line", up ? "insight-up" : "insight-down")}>
                    {up ? <TrendingUp className="icon-inline" /> : <TrendingDown className="icon-inline" />}
                    {up ? "+" : ""}{delta}{suffix} vs {prevMonthLabel}
                  </span>
                );
              };
              const cells = [
                { label: "Revenue", value: formatCurrency(monthRevenue), zero: monthRevenue === 0, insight: renderDelta(revenueDelta) },
                { label: "Orders", value: monthOrderCount.toString(), zero: monthOrderCount === 0, insight: renderDelta(ordersDelta) },
                {
                  label: "Outstanding",
                  value: formatCurrency(monthOutstanding),
                  zero: monthOutstanding === 0,
                  insight: outstandingOrders.length > 0
                    ? <span className="insight-line insight-flat">Avg {avgOutstandingDays}d outstanding</span>
                    : <span className="insight-line insight-up"><TrendingUp className="icon-inline" />All settled</span>,
                },
                {
                  label: "Delivered",
                  value: `${monthDeliveredPct}%`,
                  zero: monthOrderCount === 0,
                  insight: monthOrderCount === 0
                    ? <span className="insight-line insight-flat">— no orders yet</span>
                    : renderDelta(deliveredDelta === 0 ? 0 : deliveredDelta, "pp"),
                },
              ];
              return cells.map((s, i) => (
                <div key={s.label} className={cn("py-4 px-4", i === 0 && "pl-0", i === 3 && "pr-0")}>
                  <p className="text-[10px] text-muted-foreground/70 font-semibold tracking-[0.18em] uppercase">{s.label}</p>
                  <p className={cn(
                    "font-heading text-[26px] md:text-[28px] font-medium tracking-[-0.015em] num leading-[1.05] mt-1.5 whitespace-nowrap overflow-hidden text-ellipsis",
                    s.zero && "text-muted-foreground/35"
                  )}>{s.value}</p>
                  {s.insight}
                </div>
              ));
            })()}
          </div>

          {/* 7-day revenue sparkline — full width band directly under strip */}
          <div className="mt-4">
            {allZero ? (
              <p className="text-[10px] text-muted-foreground/40 italic">No revenue this week</p>
            ) : (
              <div>
                <svg viewBox="0 0 186 48" className="w-full h-14 text-primary" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="currentColor" stopOpacity="0.14" />
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
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={last7Days.map((d, i) => `${i * 30},${44 - (d.value / sparkMax) * 40}`).join(" ")}
                  />
                  {last7Days.map((d, i) => (
                    <circle
                      key={i}
                      cx={i * 30}
                      cy={44 - (d.value / sparkMax) * 40}
                      r={i === 6 ? 2.5 : 1.5}
                      fill="currentColor"
                      opacity={i === 6 ? 1 : 0.45}
                    />
                  ))}
                </svg>
                <div className="flex justify-between mt-1.5">
                  {last7Days.map((d, i) => (
                    <span key={i} className={cn("text-[9px] uppercase tracking-wider num", i === 6 ? "text-foreground font-semibold" : "text-muted-foreground/50")}>{d.label}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.section>

        {/* Daily breakdown — anchored label + day rail + compact KPI row (NOT 4 separate cards) */}
        <section>
          <div className="flex items-end justify-between mb-3 gap-3 flex-wrap">
            <div>
              <p className="text-[10px] text-muted-foreground/60 font-semibold tracking-[0.22em] uppercase">Daily breakdown</p>
              <p className="text-[13px] text-foreground/80 mt-1">
                {selectedDateObj.toLocaleDateString("en-IN", { weekday: "long" })}, {formatIndianDate(selectedDate)}
              </p>
            </div>
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex gap-1.5">
                    {last7Dates.map((d) => {
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
                            "relative flex flex-col items-center justify-center w-10 h-10 rounded-md text-xs font-semibold transition-all active:translate-y-[0.5px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                            isSelected
                              ? "bg-primary text-primary-foreground shadow-depth-4"
                              : "bg-muted/40 text-muted-foreground hover:bg-muted/70"
                          )}
                        >
                          <span className={cn("text-[8px] font-semibold tracking-wider uppercase leading-none mb-0.5", isSelected ? "opacity-90" : "opacity-65")}>
                            {weekdayLabel}
                          </span>
                          <span className="text-[13px] font-semibold num leading-none">{d.getDate()}</span>
                          {isToday && !isSelected && (
                            <span className="absolute -bottom-1.5 h-1 w-1 rounded-full bg-primary" />
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
          </div>

          {/* Compact KPI row */}
          <div className="glass-card grid grid-cols-2 md:grid-cols-4 divide-x divide-border/60">
            {kpis.map((kpi) => {
              const isZero = kpi.value === "0" || kpi.value === "₹0";
              return (
                <div key={kpi.label} className="px-4 py-4 min-w-0">
                  <p className="text-[10px] text-muted-foreground/70 font-semibold tracking-[0.18em] uppercase">{kpi.label}</p>
                  <p className={cn(
                    "font-heading text-[22px] md:text-[24px] font-medium tracking-[-0.015em] leading-[1.05] num mt-1.5 whitespace-nowrap overflow-hidden text-ellipsis",
                    isZero && "text-muted-foreground/35"
                  )}>{kpi.value}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Credit attention tier — amber, only shown when approaching but not over */}
        {dealersApproaching.length > 0 && dealersAtRisk.length === 0 && (
          <Link to="/distributors" className="block group">
            <div className="flex items-stretch gap-3 border-l-[3px] border-warning bg-warning/[0.04] hover:bg-warning/[0.08] transition-colors rounded-r-md px-4 py-3">
              <div className="flex items-center">
                <AlertTriangle className="icon-signal text-warning" fill="hsl(var(--warning) / 0.15)" />
              </div>
              <div className="flex-1 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-warning/90">Approaching limit</p>
                  <p className="text-sm text-foreground mt-0.5">
                    {dealersApproaching.length} dealer{dealersApproaching.length > 1 ? "s" : ""} above 80% of credit limit
                  </p>
                </div>
                <span className="font-heading text-[28px] num text-warning leading-none">{dealersApproaching.length}</span>
              </div>
            </div>
          </Link>
        )}

        {/* Credit at Risk — promoted to a real risk surface */}
        {dealersAtRisk.length > 0 && (
          <Link to="/distributors" className="block group">
            <div className="flex items-stretch gap-3 border-l-[3px] border-destructive bg-destructive/[0.03] hover:bg-destructive/[0.07] transition-colors rounded-r-md px-4 py-4">
              <div className="flex items-center">
                <AlertTriangle className="icon-signal text-destructive" fill="hsl(var(--destructive) / 0.15)" />
              </div>
              <div className="flex-1 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-destructive/90">At Risk</p>
                  <p className="text-sm text-foreground mt-0.5">
                    {dealersAtRisk.length} dealer{dealersAtRisk.length > 1 ? "s" : ""} over their credit limit
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 num">
                    {formatCurrency(atRiskAmount)} outstanding
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-heading text-[32px] num text-destructive leading-none">{dealersAtRisk.length}</p>
                  <p className="text-[10px] uppercase tracking-[0.16em] text-destructive/70 mt-1.5">Dealers</p>
                </div>
              </div>
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
                <p className="text-sm font-medium">No orders on {formatIndianDate(selectedDate)}</p>
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
