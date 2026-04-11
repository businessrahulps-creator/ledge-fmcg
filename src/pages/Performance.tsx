import { useState, useMemo, useCallback } from "react";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import React from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useApi } from "@/services/api";
import { usePageLoading } from "@/hooks/use-loading";
import { DashboardSkeleton } from "@/components/ui/page-skeleton";
import { formatCurrency } from "@/data/mock-data";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  IndianRupee,
  ShoppingCart,
  Percent,
  Users,
  CalendarIcon,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  ReferenceLine,
} from "recharts";
import { ExportPdfModal, type PdfSection } from "@/components/pdf/ExportPdfModal";
import { PerformanceReportPdf } from "@/components/pdf/PerformanceReportPdf";
import { downloadPdf, pdfFilename, formatCurrencyPdf } from "@/utils/exportPdf";

type TimePeriod = "today" | "7d" | "30d" | "90d" | "6m" | "ytd" | "custom";

const PERIOD_OPTIONS: { value: TimePeriod; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "7d", label: "7D" },
  { value: "30d", label: "30D" },
  { value: "90d", label: "90D" },
  { value: "6m", label: "6M" },
  { value: "ytd", label: "YTD" },
];

function getCutoffDate(period: TimePeriod): Date {
  const now = new Date();
  const cutoff = new Date();
  switch (period) {
    case "today":
      cutoff.setHours(0, 0, 0, 0);
      break;
    case "7d":
      cutoff.setDate(now.getDate() - 7);
      break;
    case "30d":
      cutoff.setDate(now.getDate() - 30);
      break;
    case "90d":
      cutoff.setDate(now.getDate() - 90);
      break;
    case "6m":
      cutoff.setMonth(now.getMonth() - 6);
      break;
    case "ytd":
      cutoff.setMonth(0, 1);
      cutoff.setHours(0, 0, 0, 0);
      break;
  }
  return cutoff;
}

/** Get the previous period cutoff for comparison */
function getPreviousCutoff(period: TimePeriod, currentCutoff: Date): Date {
  const prev = new Date(currentCutoff);
  const now = new Date();
  const diffMs = now.getTime() - currentCutoff.getTime();
  prev.setTime(currentCutoff.getTime() - diffMs);
  return prev;
}

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return ((current - previous) / previous) * 100;
}

const PAYMENT_COLORS: Record<string, string> = {
  paid: "hsl(var(--success))",
  partial: "hsl(var(--warning))",
  pending: "hsl(var(--destructive))",
};

function formatCompact(n: number): string {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n}`;
}

export default function Performance() {
  const api = useApi();
  const navigate = useNavigate();
  const isLoading = usePageLoading(api.loading);
  const [period, setPeriod] = useState<TimePeriod>("30d");
  const [dailyTarget, setDailyTarget] = useState<number>(30000);
  const [pdfOpen, setPdfOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState<Date | undefined>(undefined);
  const [customTo, setCustomTo] = useState<Date | undefined>(undefined);
  const orders = api.orders.list();
  const dealers = api.dealers.list();
  const salespersons = api.salespersons.list();
  const products = api.products.list();
  const stockItems = api.stock.items.list();

  const handleRefresh = useCallback(async () => {
    await new Promise((r) => setTimeout(r, 600));
  }, []);

  const { containerRef, pullDistance, refreshing } = usePullToRefresh({
    onRefresh: handleRefresh,
  });

  const cutoff = useMemo(() => getCutoffDate(period), [period]);

  const filteredOrders = useMemo(
    () =>
      orders.filter((o) => {
        const d = new Date(o.date + "T00:00:00");
        if (period === "custom") {
          if (customFrom && d < customFrom) return false;
          if (customTo) {
            const end = new Date(customTo);
            end.setHours(23, 59, 59, 999);
            if (d > end) return false;
          }
          return !!(customFrom || customTo);
        }
        return d >= cutoff;
      }),
    [orders, cutoff, period, customFrom, customTo]
  );

  // Previous period for comparison
  const prevCutoff = useMemo(() => getPreviousCutoff(period, cutoff), [period, cutoff]);

  const prevOrders = useMemo(
    () =>
      period === "custom"
        ? []
        : orders.filter((o) => {
            const d = new Date(o.date + "T00:00:00");
            return d >= prevCutoff && d < cutoff;
          }),
    [orders, prevCutoff, cutoff, period]
  );

  // KPIs
  const totalRevenue = filteredOrders.reduce((s, o) => s + o.total, 0);
  const totalOrderCount = filteredOrders.length;
  const avgOrderValue = totalOrderCount > 0 ? totalRevenue / totalOrderCount : 0;
  const paidOrders = filteredOrders.filter((o) => o.paymentStatus === "paid");
  const collectionRate =
    totalOrderCount > 0 ? (paidOrders.length / totalOrderCount) * 100 : 0;

  // Previous KPIs
  const prevRevenue = prevOrders.reduce((s, o) => s + o.total, 0);
  const prevOrderCount = prevOrders.length;
  const prevAvg = prevOrderCount > 0 ? prevRevenue / prevOrderCount : 0;
  const prevPaid = prevOrders.filter((o) => o.paymentStatus === "paid");
  const prevCollection = prevOrderCount > 0 ? (prevPaid.length / prevOrderCount) * 100 : 0;

  // Revenue trend — group by date
  const revenueTrend = useMemo(() => {
    const map = new Map<string, number>();
    filteredOrders.forEach((o) => {
      const key = o.date;
      map.set(key, (map.get(key) || 0) + o.total);
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, revenue]) => ({
        date: new Date(date + "T00:00:00").toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
        }),
        revenue,
      }));
  }, [filteredOrders]);

  // Payment split
  const paymentSplit = useMemo(() => {
    const counts = { paid: 0, partial: 0, pending: 0 };
    filteredOrders.forEach((o) => {
      counts[o.paymentStatus]++;
    });
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([status, value]) => ({
        name: status.charAt(0).toUpperCase() + status.slice(1),
        value,
        color: PAYMENT_COLORS[status],
      }));
  }, [filteredOrders]);

  // Top dealers
  const topDealers = useMemo(() => {
    const map = new Map<string, { name: string; revenue: number }>();
    filteredOrders.forEach((o) => {
      const existing = map.get(o.distributorId) || {
        name: o.distributorName,
        revenue: 0,
      };
      existing.revenue += o.total;
      map.set(o.distributorId, existing);
    });
    return Array.from(map.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [filteredOrders]);

  // Product velocity (by quantity sold)
  const productVelocity = useMemo(() => {
    const map = new Map<string, { name: string; qty: number }>();
    filteredOrders.forEach((o) => {
      o.lines?.forEach((line) => {
        const existing = map.get(line.productId) || {
          name: line.productName,
          qty: 0,
        };
        existing.qty += line.quantity;
        map.set(line.productId, existing);
      });
    });
    return Array.from(map.values())
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [filteredOrders]);

  // Sales team ranking
  const salesRanking = useMemo(() => {
    const map = new Map<string, { name: string; revenue: number }>();
    filteredOrders.forEach((o) => {
      const existing = map.get(o.salespersonId) || {
        name: o.salesperson,
        revenue: 0,
      };
      existing.revenue += o.total;
      map.set(o.salespersonId, existing);
    });
    return Array.from(map.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [filteredOrders]);

  // Actionable insights
  const insights = useMemo(() => {
    const alerts: { type: "warning" | "danger"; message: string }[] = [];

    // Low stock alerts
    stockItems.forEach((si) => {
      if (si.quantity <= si.threshold) {
        const product = products.find((p) => p.id === si.productId);
        alerts.push({
          type: "danger",
          message: `Stock critically low: ${product?.name || "Unknown"} — ${si.quantity} ${product?.unit || "units"} remaining (threshold: ${si.threshold})`,
        });
      }
    });

    // Dealer churn risk — dealers with 0 orders in filtered period
    const activeDealerIds = new Set(filteredOrders.map((o) => o.distributorId));
    dealers.forEach((d) => {
      if (!activeDealerIds.has(d.id) && d.totalOrders > 0) {
        alerts.push({
          type: "warning",
          message: `${d.name} — no orders in this period (${d.totalOrders} total historically). Possible churn risk.`,
        });
      }
    });

    return alerts.slice(0, 6);
  }, [filteredOrders, stockItems, products, dealers]);

  if (isLoading) {
    return (
      <AppLayout>
        <DashboardSkeleton />
      </AppLayout>
    );
  }

  const kpis = [
    {
      label: "Revenue",
      value: formatCurrency(totalRevenue),
      icon: IndianRupee,
      accent: "border-l-emerald-500",
      change: period !== "custom" ? pctChange(totalRevenue, prevRevenue) : null,
    },
    {
      label: "Orders",
      value: totalOrderCount.toString(),
      icon: ShoppingCart,
      accent: "border-l-blue-500",
      change: period !== "custom" ? pctChange(totalOrderCount, prevOrderCount) : null,
    },
    {
      label: "Avg Order",
      value: formatCurrency(avgOrderValue),
      icon: TrendingUp,
      accent: "border-l-amber-500",
      change: period !== "custom" ? pctChange(avgOrderValue, prevAvg) : null,
    },
    {
      label: "Collection",
      value: `${collectionRate.toFixed(0)}%`,
      icon: Percent,
      accent: "border-l-indigo-500",
      change: period !== "custom" ? pctChange(collectionRate, prevCollection) : null,
    },
  ];

  return (
    <AppLayout>
      <div ref={containerRef} className="relative overflow-y-auto">
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
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Performance
            </h1>
            <p className="text-sm text-muted-foreground">
              Real-time business intelligence
            </p>
          </div>

          {/* Time period pills + Export */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
              <div className="flex gap-1 rounded-full bg-muted/50 p-1 whitespace-nowrap shrink-0">
                {PERIOD_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setPeriod(opt.value)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                      period === opt.value && period !== "custom"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
                <button
                  onClick={() => setPeriod("custom")}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                    period === "custom"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Custom
                </button>
              </div>
              <Button variant="outline" size="sm" className="h-9 gap-1.5 rounded-full shrink-0" onClick={() => setPdfOpen(true)}>
                <Download className="h-3.5 w-3.5" />
                <span>Export</span>
              </Button>
            </div>

            {period === "custom" && (
              <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        "h-9 w-[140px] justify-start text-left text-sm font-normal rounded-full",
                        !customFrom && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                      {customFrom ? format(customFrom, "dd/MM/yyyy") : "From"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={customFrom}
                      onSelect={setCustomFrom}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
                <span className="text-sm text-muted-foreground">to</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        "h-9 w-[140px] justify-start text-left text-sm font-normal rounded-full",
                        !customTo && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                      {customTo ? format(customTo, "dd/MM/yyyy") : "To"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={customTo}
                      onSelect={setCustomTo}
                      disabled={(date) => customFrom ? date < customFrom : false}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {kpis.map((kpi) => (
            <div
              key={kpi.label}
              className={`glass-card rounded-xl border-l-[3px] p-4 ${kpi.accent}`}
            >
              <div className="flex items-center gap-2 text-muted-foreground">
                <kpi.icon className="h-4 w-4" />
                <span className="text-xs font-medium">{kpi.label}</span>
              </div>
              <p className="mt-1.5 text-xl font-semibold tracking-tight text-foreground">
                {kpi.value}
              </p>
              {kpi.change !== null && (
                <div className={`mt-1 flex items-center gap-1 text-[11px] font-medium ${
                  kpi.change > 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : kpi.change < 0
                    ? "text-red-500 dark:text-red-400"
                    : "text-muted-foreground"
                }`}>
                  {kpi.change > 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : kpi.change < 0 ? (
                    <TrendingDown className="h-3 w-3" />
                  ) : null}
                  <span>
                    {kpi.change > 0 ? "+" : ""}
                    {kpi.change.toFixed(0)}% vs prev
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Charts Row 1: Revenue Trend + Payment Split */}
        <div className="grid gap-4 md:grid-cols-5">
          <div className="glass-card rounded-xl p-4 md:col-span-3">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">
                Revenue Trend
              </h3>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span>Target</span>
                <div className="flex items-center rounded-md border border-border bg-background px-2 py-1">
                  <span className="mr-0.5 text-muted-foreground">₹</span>
                  <input
                    type="number"
                    value={dailyTarget}
                    onChange={(e) => setDailyTarget(Number(e.target.value) || 0)}
                    className="w-16 bg-transparent text-xs text-foreground outline-none"
                    min={0}
                    step={5000}
                  />
                </div>
              </div>
            </div>
            {revenueTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={revenueTrend}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(v) => formatCompact(v)}
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                    width={55}
                  />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), "Revenue"]}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#revGrad)"
                  />
                  {dailyTarget > 0 && (
                    <ReferenceLine
                      y={dailyTarget}
                      stroke="hsl(var(--destructive))"
                      strokeDasharray="6 4"
                      strokeWidth={1.5}
                      label={{
                        value: `Target: ${formatCompact(dailyTarget)}`,
                        position: "right",
                        fontSize: 11,
                        fill: "hsl(var(--muted-foreground))",
                      }}
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
                No orders in this period
              </div>
            )}
          </div>

          <div className="glass-card rounded-xl p-4 md:col-span-2">
            <h3 className="mb-3 text-sm font-semibold text-foreground">
              Payment Split
            </h3>
            {paymentSplit.length > 0 ? (
              <div className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={paymentSplit}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {paymentSplit.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, name: string) => [
                        `${value} orders`,
                        name,
                      ]}
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-3 mt-1">
                  {paymentSplit.map((entry) => (
                    <div key={entry.name} className="flex items-center gap-1.5 text-xs">
                      <div
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="text-muted-foreground">
                        {entry.name} ({entry.value})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex h-[180px] items-center justify-center text-sm text-muted-foreground">
                No data
              </div>
            )}
          </div>
        </div>

        {/* Top Dealers */}
        <div className="glass-card rounded-xl p-4">
          <h3 className="mb-3 text-sm font-semibold text-foreground">
            Top Dealers by Revenue
          </h3>
          {topDealers.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={topDealers} layout="vertical" margin={{ left: 0, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} horizontal={false} />
                <XAxis
                  type="number"
                  tickFormatter={(v) => formatCompact(v)}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={100}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), "Revenue"]}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Bar
                  dataKey="revenue"
                  fill="hsl(var(--primary))"
                  radius={[0, 4, 4, 0]}
                  barSize={24}
                  cursor="pointer"
                  onClick={(data: any) => {
                    if (data?.name) {
                      navigate(`/orders?dealer=${encodeURIComponent(data.name)}`);
                    }
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
              No dealer data
            </div>
          )}
        </div>

        {/* Product Velocity + Sales Team */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="glass-card rounded-xl p-4">
            <h3 className="mb-3 text-sm font-semibold text-foreground">
              Product Velocity (Units Sold)
            </h3>
            {productVelocity.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={productVelocity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${value} units`, "Sold"]}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="qty" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
                No product data
              </div>
            )}
          </div>

          <div className="glass-card rounded-xl p-4">
            <h3 className="mb-3 text-sm font-semibold text-foreground">
              Sales Team Ranking
            </h3>
            {salesRanking.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={salesRanking} layout="vertical" margin={{ left: 0, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} horizontal={false} />
                  <XAxis
                    type="number"
                    tickFormatter={(v) => formatCompact(v)}
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={80}
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), "Revenue"]}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar
                    dataKey="revenue"
                    fill="hsl(var(--primary))"
                    radius={[0, 4, 4, 0]}
                    barSize={24}
                    cursor="pointer"
                    onClick={(data: any) => {
                      if (data?.name) {
                        navigate(`/orders?dealer=${encodeURIComponent(data.name)}`);
                      }
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
                No salesperson data
              </div>
            )}
          </div>
        </div>

        {/* Actionable Insights */}
        {insights.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Actionable Insights
            </h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {insights.map((insight, i) => (
                <div
                  key={i}
                  className={`rounded-lg border px-3 py-2.5 text-xs leading-relaxed ${
                    insight.type === "danger"
                      ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300"
                      : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300"
                  }`}
                >
                  {insight.message}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <ExportPdfModal
        open={pdfOpen}
        onOpenChange={setPdfOpen}
        title="Export Performance Report"
        sections={[
          { id: "company", label: "Company Header" },
          { id: "summary", label: "KPI Summary" },
          { id: "revenueTrend", label: "Revenue Trend (chart)" },
          { id: "paymentSplit", label: "Payment Split (chart)" },
          { id: "dealers", label: "Top Dealers (bar chart)" },
          { id: "products", label: "Top Products (bar chart)" },
          { id: "salesTeam", label: "Sales Team Ranking (bar chart)" },
        ] satisfies PdfSection[]}
        onGenerate={async (sel) => {
          const periodTag = PERIOD_OPTIONS.find((o) => o.value === period)?.label ?? period;
          let periodLabel: string;
          if (period === "custom") {
            periodLabel = customFrom && customTo
              ? `${format(customFrom, "dd MMM yyyy")} – ${format(customTo, "dd MMM yyyy")}`
              : "Custom Range";
          } else if (period === "today") {
            periodLabel = `${periodTag} · ${format(new Date(), "dd MMM yyyy")}`;
          } else {
            const start = getCutoffDate(period);
            periodLabel = `${periodTag} · ${format(start, "dd MMM yyyy")} – ${format(new Date(), "dd MMM yyyy")}`;
          }

          const { companyInfo } = api;

          const doc = React.createElement(PerformanceReportPdf, {
            title: "Performance Report",
            subtitle: periodLabel,
            companyName: companyInfo.name,
            companyAddress: companyInfo.address,
            gstin: companyInfo.gstin,
            logoUrl: companyInfo.logoUrl,
            show: sel,
            data: {
              summary: [
                { label: "Revenue", value: formatCurrencyPdf(totalRevenue) },
                { label: "Orders", value: totalOrderCount.toString() },
                { label: "Avg Order", value: formatCurrencyPdf(avgOrderValue) },
                { label: "Collection Rate", value: `${collectionRate.toFixed(0)}%` },
              ],
              revenueTrend,
              paymentSplit: paymentSplit.map((p) => ({
                name: p.name,
                value: p.value,
                status: p.name.toLowerCase(),
              })),
              topDealers,
              productVelocity,
              salesRanking,
            },
          });

          await downloadPdf(pdfFilename("performance", periodLabel.replace(/\s+/g, "_")), doc);
        }}
      />
      </div>{/* end space-y-5 */}
      </div>{/* end containerRef */}
    </AppLayout>
  );
}
