import { useState, useMemo, useCallback, useEffect } from "react";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";
import { usePagination } from "@/hooks/use-pagination";
import { ListPagination } from "@/components/ui/list-pagination";
import { usePageLoading } from "@/hooks/use-loading";

import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Plus, Search, Filter, Download, FileText, ShoppingCart, ChevronRight } from "lucide-react";
import { exportXlsx, xlsxFilename } from "@/utils/exportXlsx";
import { formatCurrencyPdf } from "@/utils/exportPdf";
import { exportReportPdf } from "@/components/pdf/useReportExport";
import { ExportPdfModal, type PdfSection } from "@/components/pdf/ExportPdfModal";
import { TablePageSkeleton } from "@/components/ui/page-skeleton";
import { EmptyCard } from "@/components/ui/empty-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { AppLayout } from "@/components/layout/AppLayout";
import { formatCurrency } from "@/data/mock-data";
import { useApi } from "@/services/api";
import { prefetchRoute } from "@/lib/route-prefetch";
import { Can } from "@/components/auth/Can";
import { useCan } from "@/hooks/useCan";
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
import { useReceivables } from "@/hooks/useReceivables";
import { todayKey } from "@/utils/dateKey";

/** Presentation only: "part paid" -> "Part paid" for PDF exports. */
const titleCase = (v: string) => (v ? v.charAt(0).toUpperCase() + v.slice(1) : v);


export default function Orders() {
  const api = useApi();
  const { companyInfo } = api;
  const navigate = useNavigate();
  const canPlaceOrders = useCan("place_orders");
  const orders = api.orders.list();
  const invoices = api.invoices.list();
  // Payment chips come from the receipts ledger, never from orders.payment_status.
  const { paymentStatus: paymentStatusByOrderId } = useReceivables();
  const payStatus = useCallback(
    (id: string) => paymentStatusByOrderId.get(id) ?? "pending",
    [paymentStatusByOrderId],
  );
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
    // Any GST bill that is no longer a draft is a real, issued bill — whatever its
    // payment state (posted / partial / paid).
    const gstIssued = docs.find(d => d.docType === "gst_invoice" && d.status !== "draft");
    if (gstIssued) return { label: "GST Bill", color: "bg-success/10 text-success" };
    const gstDraft = docs.find(d => d.docType === "gst_invoice" && d.status === "draft");
    if (gstDraft) return { label: "GST Bill (Draft)", color: "bg-warning/10 text-warning" };
    const proforma = docs.find(d => d.docType === "proforma");
    if (proforma) return { label: "Proforma", color: "bg-accent/10 text-accent" };
    const estimate = docs.find(d => d.docType === "estimate");
    if (estimate) return { label: "Estimate", color: "bg-warning/10 text-warning" };
    return { label: "Document", color: "bg-muted text-muted-foreground" };
  }, [invoicesByOrderId]);

  const billedOrderIds = useMemo(() => {
    const set = new Set<string>();
    for (const inv of invoices) {
      if (inv.docType === "gst_invoice" && inv.status !== "draft" && inv.sourceOrderId) set.add(inv.sourceOrderId);
    }
    return set;
  }, [invoices]);
  const [needsBillOnly, setNeedsBillOnly] = useState(false);

  const filtered = useMemo(() => orders.filter((o) => {
    const q = debouncedSearch.toLowerCase();
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(q) ||
      o.distributorName.toLowerCase().includes(q);
    const matchesPayment = paymentFilter === "all" || payStatus(o.id) === paymentFilter;
    const matchesDelivery = deliveryFilter === "all" || o.deliveryStatus === deliveryFilter;
    const matchesNeedsBill = !needsBillOnly || (!o.cancelledAt && o.deliveryStatus !== "pending" && !billedOrderIds.has(o.id));
    return matchesSearch && matchesPayment && matchesDelivery && matchesNeedsBill;
  }), [orders, debouncedSearch, paymentFilter, deliveryFilter, needsBillOnly, billedOrderIds, payStatus]);

  const needsBillCount = useMemo(
    () => orders.filter(o => !o.cancelledAt && o.deliveryStatus !== "pending" && !billedOrderIds.has(o.id)).length,
    [orders, billedOrderIds],
  );

  const { page, totalPages, from, to, setPage } = usePagination(
    filtered.length,
    undefined,
    `${debouncedSearch}|${paymentFilter}|${deliveryFilter}|${needsBillOnly}`,
  );
  const paginatedOrders = useMemo(() => filtered.slice(from, to), [filtered, from, to]);

  // ── Period insights (no new business logic — derived from existing orders)
  const insights = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
    const todayIso = todayKey();
    const net = (o: typeof orders[number]) => (o.total ?? 0) - (o.schemeSavings || 0);

    let mtdCount = 0, mtdRevenue = 0, prevCount = 0, prevRevenue = 0;
    let pendingPayment = 0, pendingPaymentValue = 0;
    let overdueDispatch = 0, overdueDispatchValue = 0;
    let todaysCount = 0;

    for (const o of orders) {
      if (o.cancelledAt) continue;
      const t = new Date(o.date).getTime();
      if (t >= startOfMonth) { mtdCount++; mtdRevenue += net(o); }
      else if (t >= startOfPrevMonth) { prevCount++; prevRevenue += net(o); }
      if (o.date?.slice(0, 10) === todayIso) todaysCount++;
      if (payStatus(o.id) !== "paid") {
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
  }, [orders, payStatus]);

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
              className="h-10 px-3 sm:px-4"
              aria-label="Download Excel file"
              onClick={() => {
                const godownMap = Object.fromEntries(godowns.map(g => [g.id, g.name]));
                exportXlsx(
                  xlsxFilename("orders"),
                  ["Order #", "Date", "Dealer", "Sales Person", "Amount", "Payment Mode", "Payment Status", "Delivery Status", "Dispatch Date", "Vehicle", "Driver", "Warehouse"],
                  filtered.map((o) => [
                    o.orderNumber,
                    formatIndianDate(o.date),
                    o.distributorName,
                    o.salesperson,
                    formatCurrency(o.total - (o.schemeSavings || 0)),
                    o.paymentMode.replace("_", " "),
                    payStatus(o.id),
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
              <span className="sm:hidden">Excel</span>
              <span className="hidden sm:inline">Export Excel</span>
            </Button>
            <Button
              variant="outline"
              className="h-10 px-3 sm:px-4"
              aria-label="Export PDF"
              onClick={() => setPdfModalOpen(true)}
            >
              <FileText className="h-4 w-4" />
              <span className="sm:hidden">PDF</span>
              <span className="hidden sm:inline">Export PDF</span>
            </Button>
            <Can do="place_orders">
              <Link to="/orders/new" className="flex-1 sm:flex-none">
                <Button className="w-full">
                  <Plus className="h-4 w-4" />
                  New Order
                </Button>
              </Link>
            </Can>
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
            {needsBillCount > 0 && (
              <Button
                type="button"
                variant={needsBillOnly ? "default" : "outline"}
                className="h-10 rounded-lg"
                onClick={() => setNeedsBillOnly(v => !v)}
              >
                Needs a bill · {needsBillCount}
              </Button>
            )}
          </div>
        </div>


        {/* Table */}
        {filtered.length === 0 ? (
          orders.length === 0 ? (
            <EmptyCard
              icon={ShoppingCart}
              title="No orders yet today."
              description="When you take an order it'll show up here."
              actionLabel={canPlaceOrders ? "Take a new order" : undefined}
              onAction={canPlaceOrders ? () => navigate("/orders/new") : undefined}
            />
          ) : (
            <EmptyCard
              icon={Filter}
              title="No orders match your filters."
              description="Try clearing the search or switching a filter."
            />
          )
        ) : (
          <div className="glass-card overflow-hidden">
            {/* Desktop table — six columns so a 1280px laptop needs no sideways scrolling.
                On genuinely narrow windows it still scrolls, with a fade hinting at more. */}
            <div className="relative hidden md:block">
              <div className="overflow-x-auto">
                <table className="w-full text-sm [font-variant-numeric:tabular-nums]">
                  <thead>
                    <tr className="border-b border-border bg-muted/30 text-left text-xs text-muted-foreground">
                      <th className="px-4 py-3 font-semibold">Order #</th>
                      <th className="px-4 py-3 font-semibold">Date</th>
                      <th className="px-4 py-3 font-semibold">Dealer</th>
                      <th className="px-4 py-3 font-semibold text-right">Order value</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Billing</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedOrders.map((order) => {
                      const billingStatus = getOrderBillingStatus(order.id);
                      return (
                        <tr
                          key={order.id}
                          onClick={() => navigate(`/orders/${order.id}`)}
                          onMouseEnter={() => prefetchRoute(`/orders/${order.id}`)}
                          onFocus={() => prefetchRoute(`/orders/${order.id}`)}
                          className="group border-b border-border/50 row-hover cursor-pointer transition-transform duration-[120ms] ease-fluent hover:translate-x-px active:translate-x-px motion-reduce:transform-none"
                        >
                          <td className="px-4 py-3.5 font-medium text-foreground whitespace-nowrap">{order.orderNumber}</td>
                          <td className="px-4 py-3.5 text-muted-foreground whitespace-nowrap">{formatIndianDate(order.date)}</td>
                          <td className="px-4 py-3.5">
                            <span className="block max-w-[220px] truncate text-foreground">{order.distributorName}</span>
                            <span className="block max-w-[220px] truncate text-xs text-muted-foreground">{order.salesperson}</span>
                          </td>
                          <td className="px-4 py-3.5 text-right font-medium whitespace-nowrap">{formatCurrency(order.total - (order.schemeSavings || 0))}</td>
                          <td className="px-4 py-3.5">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <StatusBadge status={payStatus(order.id)} />
                              {order.cancelledAt ? (
                                <span className="inline-flex items-center whitespace-nowrap rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-medium text-destructive">Cancelled</span>
                              ) : (
                                <StatusBadge status={order.deliveryStatus} kind="delivery" />
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            {billingStatus ? (
                              <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-medium ${billingStatus.color}`}>
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
            </div>


            <div className="divide-y divide-border/50 md:hidden">
              {paginatedOrders.map((order) => {
                const billingStatus = getOrderBillingStatus(order.id);
                return (
                  <div
                    key={order.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate(`/orders/${order.id}`)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); navigate(`/orders/${order.id}`); } }}
                    onTouchStart={() => prefetchRoute(`/orders/${order.id}`)}
                    className="flex min-h-[64px] cursor-pointer items-center gap-3 border-b border-border/50 px-4 py-3.5 card-hover"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="truncate text-sm font-medium text-foreground">{order.orderNumber}</span>
                        <span className="money shrink-0 text-sm font-semibold">{formatCurrency(order.total - (order.schemeSavings || 0))}</span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {order.distributorName} · {formatIndianDate(order.date)}
                      </p>
                      <div className="mt-2 -mx-1 flex items-center gap-1.5 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        <StatusBadge status={payStatus(order.id)} />
                        {order.cancelledAt ? (
                          <span className="inline-flex shrink-0 items-center whitespace-nowrap rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-medium text-destructive">Cancelled</span>
                        ) : (
                          <StatusBadge status={order.deliveryStatus} kind="delivery" />
                        )}
                        {billingStatus && (
                          <span className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-medium ${billingStatus.color}`}>
                            {billingStatus.label}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/40" aria-hidden />
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
            const totalAmount = filtered.reduce((s, o) => s + o.total - (o.schemeSavings || 0), 0);
            await exportReportPdf({
              fileType: "orders",
              company: companyInfo,
              selection: sel,
              title: "Orders Report",
              subtitle: `${filtered.length} orders`,
              summary: [
                { label: "Total Orders", value: String(filtered.length) },
                { label: "Total Amount", value: formatCurrencyPdf(totalAmount) },
              ],
              columns: [
                { header: "Order #", width: "12%" },
                { header: "Date", width: "12%" },
                { header: "Dealer", width: "20%" },
                { header: "Sales Person", width: "16%" },
                { header: "Amount", width: "14%", align: "right" },
                { header: "Payment", width: "12%" },
                { header: "Delivery", width: "14%" },
              ],
              rows: filtered.map((o) => [
                o.orderNumber,
                formatIndianDate(o.date),
                o.distributorName,
                o.salesperson,
                formatCurrencyPdf(o.total - (o.schemeSavings || 0)),
                titleCase(payStatus(o.id)),
                titleCase(o.deliveryStatus),
              ]),
            });
          }}
        />
      </div>
      </div>
    </AppLayout>
  );
}
