import { useState, useMemo, useCallback, useEffect } from "react";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";
import { usePagination } from "@/hooks/use-pagination";
import { ListPagination } from "@/components/ui/list-pagination";
import { usePageLoading } from "@/hooks/use-loading";

import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Plus, Search, Filter, Download, FileText, ShoppingCart } from "lucide-react";
import { exportCsv, csvFilename } from "@/utils/exportCsv";
import { downloadPdf, pdfFilename, formatCurrencyPdf } from "@/utils/exportPdf";
import { ExportPdfModal, type PdfSection } from "@/components/pdf/ExportPdfModal";
import { TablePageSkeleton } from "@/components/ui/page-skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { AppLayout } from "@/components/layout/AppLayout";
import { formatCurrency } from "@/data/mock-data";
import { useApi } from "@/services/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatIndianDate } from "@/utils/formatDate";
import { KpiStrip } from "@/components/ui/kpi-strip";
import { InsightLine } from "@/components/ui/insight-line";
import { SignalCard } from "@/components/ui/signal-card";
import { AlertTriangle } from "lucide-react";

export default function Orders() {
  const api = useApi();
  const { companyInfo } = api;
  const navigate = useNavigate();
  const orders = api.orders.list();
  const invoices = api.invoices.list();
  const godowns = api.stock.locations.list().filter(g => g.isActive);
  const [searchParams] = useSearchParams();
  const dealerParam = searchParams.get("dealer") || "";
  // Persist filters across navigation (e.g. opening an order detail and coming back)
  const FILTER_KEY = "orders:filters";
  const restoredFilters = useMemo(() => {
    try {
      const raw = sessionStorage.getItem(FILTER_KEY);
      return raw ? JSON.parse(raw) as { search?: string; payment?: string; delivery?: string } : {};
    } catch { return {}; }
  }, []);
  const [search, setSearch] = useState(dealerParam || restoredFilters.search || "");
  const [paymentFilter, setPaymentFilter] = useState(restoredFilters.payment || "all");
  const [deliveryFilter, setDeliveryFilter] = useState(restoredFilters.delivery || "all");
  const [pdfModalOpen, setPdfModalOpen] = useState(false);

  // Save filters whenever they change so a back-nav restores them
  useEffect(() => {
    try {
      sessionStorage.setItem(FILTER_KEY, JSON.stringify({ search, payment: paymentFilter, delivery: deliveryFilter }));
    } catch { /* quota or disabled — ignore */ }
  }, [search, paymentFilter, deliveryFilter]);

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

  const ordersPdfSections: PdfSection[] = [
    { id: "company", label: "Company header" },
    { id: "summary", label: "Summary statistics" },
    { id: "table", label: "Orders table" },
  ];

  const isLoading = usePageLoading(api.loading);
  const debouncedSearch = useDebounce(search);

  // Index invoices by sourceOrderId once per render — converts the per-row O(invoices)
  // scan into O(1) lookup. Big win when an account accrues many invoices.
  const invoicesByOrderId = useMemo(() => {
    const map = new Map<string, typeof invoices>();
    for (const inv of invoices) {
      if (!inv.sourceOrderId) continue;
      const arr = map.get(inv.sourceOrderId);
      if (arr) arr.push(inv);
      else map.set(inv.sourceOrderId, [inv]);
    }
    return map;
  }, [invoices]);

  const getOrderBillingStatus = useCallback((orderId: string) => {
    const docs = invoicesByOrderId.get(orderId);
    if (!docs || docs.length === 0) return null;
    const gstFinal = docs.find(d => d.docType === "gst_invoice" && d.status === "final");
    if (gstFinal) return { label: "GST Invoice (Final)", color: "bg-success/10 text-success" };
    const gstDraft = docs.find(d => d.docType === "gst_invoice" && d.status === "draft");
    if (gstDraft) return { label: "GST Invoice (Draft)", color: "bg-warning/10 text-warning" };
    const proforma = docs.find(d => d.docType === "proforma");
    if (proforma) return { label: "Proforma", color: "bg-accent/10 text-accent" };
    const estimate = docs.find(d => d.docType === "estimate");
    if (estimate) return { label: "Estimate", color: "bg-warning/10 text-warning" };
    return { label: docs[0].docType, color: "bg-muted text-muted-foreground" };
  }, [invoicesByOrderId]);

  const filtered = useMemo(() => orders.filter((o) => {
    const q = debouncedSearch.toLowerCase();
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(q) ||
      o.distributorName.toLowerCase().includes(q);
    const matchesPayment = paymentFilter === "all" || o.paymentStatus === paymentFilter;
    const matchesDelivery = deliveryFilter === "all" || o.deliveryStatus === deliveryFilter;
    return matchesSearch && matchesPayment && matchesDelivery;
  }), [orders, debouncedSearch, paymentFilter, deliveryFilter]);

  const { page, totalPages, from, to, setPage } = usePagination(filtered.length);
  const paginatedOrders = useMemo(() => filtered.slice(from, to), [filtered, from, to]);

  // ── Period insights (no new business logic — derived from existing orders)
  const insights = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
    const todayIso = new Date().toISOString().slice(0, 10);
    const net = (o: typeof orders[number]) => (o.total ?? 0) - (o.schemeSavings || 0);

    let mtdCount = 0, mtdRevenue = 0, prevCount = 0, prevRevenue = 0;
    let pendingPayment = 0, pendingPaymentValue = 0;
    let overdueDispatch = 0, overdueDispatchValue = 0;
    let todaysCount = 0;

    for (const o of orders) {
      const t = new Date(o.date).getTime();
      if (t >= startOfMonth) { mtdCount++; mtdRevenue += net(o); }
      else if (t >= startOfPrevMonth) { prevCount++; prevRevenue += net(o); }
      if (o.date?.slice(0, 10) === todayIso) todaysCount++;
      if (o.paymentStatus === "pending" || o.paymentStatus === "partial") {
        pendingPayment++; pendingPaymentValue += net(o);
      }
      if (o.deliveryStatus === "pending" && o.dispatchDate && new Date(o.dispatchDate) < now) {
        overdueDispatch++; overdueDispatchValue += net(o);
      }
    }
    const pct = (cur: number, prev: number) =>
      prev === 0 ? null : Math.round(((cur - prev) / prev) * 100);
    return {
      mtdCount, mtdRevenue, todaysCount, pendingPayment, pendingPaymentValue,
      overdueDispatch, overdueDispatchValue,
      revenueDelta: pct(mtdRevenue, prevRevenue),
      countDelta: pct(mtdCount, prevCount),
    };
  }, [orders]);

  const prevMonthLabel = useMemo(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 1);
    return d.toLocaleString("en-IN", { month: "short" });
  }, []);


  // Show skeleton on first paint when we're loading and no orders are cached yet.
  if (isLoading && orders.length === 0) {
    return (
      <AppLayout>
        <TablePageSkeleton rows={6} />
      </AppLayout>
    );
  }

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
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="h1-display">Orders</h1>
            <p className="mt-0.5 text-xs text-muted-foreground md:mt-1 md:text-sm">
              Manage and track all sales orders
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 sm:h-10 sm:w-auto sm:px-4"
              aria-label="Export CSV"
              onClick={() => {
                const godownMap = Object.fromEntries(godowns.map(g => [g.id, g.name]));
                exportCsv(
                  csvFilename("orders"),
                  ["Order #", "Date", "Dealer", "Sales Person", "Amount", "Payment Mode", "Payment Status", "Delivery Status", "Dispatch Date", "Vehicle", "Driver", "Warehouse"],
                  filtered.map((o) => [
                    o.orderNumber,
                    formatIndianDate(o.date),
                    o.distributorName,
                    o.salesperson,
                    formatCurrency(o.total - (o.schemeSavings || 0)),
                    o.paymentMode.replace("_", " "),
                    o.paymentStatus,
                    o.deliveryStatus,
                    formatIndianDate(o.dispatchDate),
                    o.vehicle || "",
                    o.driverName || "",
                    o.godownId ? (godownMap[o.godownId] || "") : "",
                  ])
                );
              }}
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export CSV</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 sm:h-10 sm:w-auto sm:px-4"
              aria-label="Export PDF"
              onClick={() => setPdfModalOpen(true)}
            >
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Export PDF</span>
            </Button>
            <Link to="/orders/new" className="flex-1 sm:flex-none">
              <Button className="w-full">
                <Plus className="h-4 w-4" />
                New Order
              </Button>
            </Link>
          </div>
        </div>

        {/* This month — hairline KPI strip */}
        <KpiStrip
          cells={[
            {
              label: "Today",
              value: insights.todaysCount,
              zero: insights.todaysCount === 0,
              insight: <InsightLine tone="flat" fallback={insights.todaysCount === 0 ? "No orders yet today" : `${insights.todaysCount} placed today`} />,
            },
            {
              label: "This month",
              value: insights.mtdCount,
              zero: insights.mtdCount === 0,
              insight: <InsightLine delta={insights.countDelta} comparator={prevMonthLabel} />,
            },
            {
              label: "Revenue (MTD)",
              value: formatCurrency(insights.mtdRevenue),
              zero: insights.mtdRevenue === 0,
              insight: <InsightLine delta={insights.revenueDelta} comparator={prevMonthLabel} />,
            },
            {
              label: "Awaiting payment",
              value: insights.pendingPayment,
              zero: insights.pendingPayment === 0,
              insight: insights.pendingPaymentValue > 0
                ? <InsightLine tone="down" fallback={`${formatCurrency(insights.pendingPaymentValue)} outstanding`} />
                : <InsightLine tone="up" fallback="All settled" />,
            },
          ]}
        />

        {/* Overdue dispatch — promoted destructive surface */}
        {insights.overdueDispatch > 0 && (
          <SignalCard
            tier="destructive"
            icon={AlertTriangle}
            label="Overdue dispatch"
            caption={`${insights.overdueDispatch} order${insights.overdueDispatch > 1 ? "s" : ""} past their dispatch date`}
            subCaption={`${formatCurrency(insights.overdueDispatchValue)} pending delivery`}
            value={insights.overdueDispatch}
            valueSuffix="Orders"
            interactive
            onClick={() => setDeliveryFilter("pending")}
            role="button"
            tabIndex={0}
            className="cursor-pointer"
          />
        )}

        {/* Filters */}
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search orders..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 rounded-lg pl-10"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-3">
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="h-10 w-full rounded-lg sm:w-44">
                <SelectValue placeholder="Payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            <Select value={deliveryFilter} onValueChange={setDeliveryFilter}>
              <SelectTrigger className="h-10 w-full rounded-lg sm:w-44">
                <SelectValue placeholder="Delivery" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Delivery</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="dispatched">Dispatched</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div className="glass-card flex flex-col items-center justify-center py-16 text-center">
            {orders.length === 0 ? (
              <>
                <ShoppingCart className="h-10 w-10 text-muted-foreground/50" strokeWidth={1.5} />
                <p className="mt-3 text-sm font-medium">No orders yet</p>
                <p className="text-xs text-muted-foreground">Create your first sales order to get started</p>
                <Link to="/orders/new">
                  <Button size="sm" className="mt-3">
                    <Plus className="h-4 w-4" />
                    New Order
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Filter className="h-10 w-10 text-muted-foreground/50" strokeWidth={1.5} />
                <p className="mt-3 text-sm font-medium">No orders match your filters</p>
                <p className="text-xs text-muted-foreground">Try adjusting your search or filters</p>
              </>
            )}
          </div>
        ) : (
          <div className="glass-card overflow-hidden">
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-left text-xs text-muted-foreground">
                    <th className="px-6 py-3 font-semibold">Order #</th>
                    <th className="px-6 py-3 font-semibold">Date</th>
                    <th className="px-6 py-3 font-semibold">Dealer</th>
                    <th className="px-6 py-3 font-semibold">Sales Person</th>
                    <th className="px-6 py-3 font-semibold text-right">Amount</th>
                    <th className="px-6 py-3 font-semibold">Payment</th>
                    <th className="px-6 py-3 font-semibold">Delivery</th>
                    <th className="px-6 py-3 font-semibold">Billing</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedOrders.map((order) => {
                    const billingStatus = getOrderBillingStatus(order.id);
                    return (
                      <tr
                        key={order.id}
                        onClick={() => navigate(`/orders/${order.id}`)}
                        className="group border-b border-border/50 row-hover cursor-pointer"
                      >
                        <td className="px-6 py-4 font-medium text-foreground">{order.orderNumber}</td>
                        <td className="px-6 py-4 text-muted-foreground">{formatIndianDate(order.date)}</td>
                        <td className="px-6 py-4">{order.distributorName}</td>
                        <td className="px-6 py-4 text-muted-foreground">{order.salesperson}</td>
                        <td className="px-6 py-4 text-right font-medium">{formatCurrency(order.total - (order.schemeSavings || 0))}</td>
                        <td className="px-6 py-4"><StatusBadge status={order.paymentStatus} /></td>
                        <td className="px-6 py-4"><StatusBadge status={order.deliveryStatus} /></td>
                        <td className="px-6 py-4">
                          {billingStatus ? (
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${billingStatus.color}`}>
                              {billingStatus.label}
                            </span>
                          ) : (
                            <span className="text-[10px] text-muted-foreground/50">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-border/50 md:hidden">
              {paginatedOrders.map((order) => {
                const billingStatus = getOrderBillingStatus(order.id);
                return (
                  <div
                    key={order.id}
                    onClick={() => navigate(`/orders/${order.id}`)}
                    className="border-b border-border/50 px-4 py-3.5 card-hover cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">{order.orderNumber}</span>
                      <span className="text-sm font-medium">{formatCurrency(order.total - (order.schemeSavings || 0))}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {order.distributorName} · {formatIndianDate(order.date)}
                    </p>
                    <div className="mt-2 flex items-center gap-1.5">
                      <StatusBadge status={order.paymentStatus} />
                      <StatusBadge status={order.deliveryStatus} />
                      {billingStatus && (
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${billingStatus.color}`}>
                          {billingStatus.label}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <ListPagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}

        <ExportPdfModal
          open={pdfModalOpen}
          onOpenChange={setPdfModalOpen}
          sections={ordersPdfSections}
          onGenerate={async (sel) => {
            // Lazy-load the heavy @react-pdf/renderer-based ReportPdf only on click,
            // so it doesn't bloat the initial Orders bundle.
            const { ReportPdf } = await import("@/components/pdf/ReportPdf");
            const godownMap = Object.fromEntries(godowns.map(g => [g.id, g.name]));
            const totalAmount = filtered.reduce((s, o) => s + o.total - (o.schemeSavings || 0), 0);
            downloadPdf(
              pdfFilename("orders"),
              <ReportPdf
                companyName={companyInfo.name}
                companyAddress={companyInfo.address}
                gstin={companyInfo.gstin}
                logoUrl={companyInfo.logoUrl}
                title="Orders Report"
                subtitle={`${filtered.length} orders`}
                showCompany={sel.company}
                showSummary={sel.summary}
                showTable={sel.table}
                summary={[
                  { label: "Total Orders", value: String(filtered.length) },
                  { label: "Total Amount", value: formatCurrencyPdf(totalAmount) },
                ]}
                columns={[
                  { header: "Order #", width: "12%" },
                  { header: "Date", width: "12%" },
                  { header: "Dealer", width: "20%" },
                  { header: "Sales Person", width: "16%" },
                  { header: "Amount", width: "14%", align: "right" },
                  { header: "Payment", width: "12%" },
                  { header: "Delivery", width: "14%" },
                ]}
                rows={filtered.map((o) => [
                  o.orderNumber,
                  formatIndianDate(o.date),
                  o.distributorName,
                  o.salesperson,
                  formatCurrencyPdf(o.total - (o.schemeSavings || 0)),
                  o.paymentStatus,
                  o.deliveryStatus,
                ])}
              />
            );
          }}
        />
      </div>
      </div>
    </AppLayout>
  );
}
