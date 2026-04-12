import { useState, useMemo, useCallback } from "react";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";
import { usePagination } from "@/hooks/use-pagination";
import { ListPagination } from "@/components/ui/list-pagination";
import { usePageLoading } from "@/hooks/use-loading";
import { TablePageSkeleton } from "@/components/ui/page-skeleton";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Plus, Search, Filter, Download, FileText, ShoppingCart } from "lucide-react";
import { exportCsv, csvFilename } from "@/utils/exportCsv";
import { downloadPdf, pdfFilename, formatCurrencyPdf } from "@/utils/exportPdf";
import { ExportPdfModal, type PdfSection } from "@/components/pdf/ExportPdfModal";
import { ReportPdf } from "@/components/pdf/ReportPdf";
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

export default function Orders() {
  const api = useApi();
  const { companyInfo } = api;
  const navigate = useNavigate();
  const orders = api.orders.list();
  const invoices = api.invoices.list();
  const godowns = api.stock.locations.list().filter(g => g.isActive);
  const [searchParams] = useSearchParams();
  const dealerParam = searchParams.get("dealer") || "";
  const [search, setSearch] = useState(dealerParam);
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [deliveryFilter, setDeliveryFilter] = useState("all");
  const [pdfModalOpen, setPdfModalOpen] = useState(false);

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

  const getOrderBillingStatus = useCallback((orderId: string) => {
    const docs = invoices.filter(inv => inv.sourceOrderId === orderId);
    if (docs.length === 0) return null;
    const gstFinal = docs.find(d => d.docType === "gst_invoice" && d.status === "final");
    if (gstFinal) return { label: "GST Invoice (Final)", color: "bg-emerald-50/80 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300" };
    const gstDraft = docs.find(d => d.docType === "gst_invoice" && d.status === "draft");
    if (gstDraft) return { label: "GST Invoice (Draft)", color: "bg-amber-50/80 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300" };
    const proforma = docs.find(d => d.docType === "proforma");
    if (proforma) return { label: "Proforma", color: "bg-purple-50/80 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300" };
    const estimate = docs.find(d => d.docType === "estimate");
    if (estimate) return { label: "Estimate", color: "bg-amber-50/80 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300" };
    return { label: docs[0].docType, color: "bg-muted text-muted-foreground" };
  }, [invoices]);

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

  if (isLoading) {
    return <AppLayout><TablePageSkeleton /></AppLayout>;
  }

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
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight md:text-2xl">Orders</h1>
            <p className="mt-0.5 text-xs text-muted-foreground md:mt-1 md:text-sm">
              Manage and track all sales orders
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 sm:h-10 sm:w-auto sm:px-4"
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
          onGenerate={(sel) => {
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
