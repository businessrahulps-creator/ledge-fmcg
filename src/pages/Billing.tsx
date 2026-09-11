import { useState, useMemo, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FileText, Download, Lock, Search, Filter, Link2, CalendarDays,
  Eye, IndianRupee, Ban,
} from "lucide-react";
import { KpiStrip } from "@/components/ui/kpi-strip";
import { ReconcileStamp } from "@/components/ui/reconcile-stamp";
import { EmptyCard } from "@/components/ui/empty-card";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { shareInvoiceOnWhatsApp } from "@/utils/shareWhatsApp";
// @react-pdf/renderer is dynamically imported below, never statically.
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";
import { useApi } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { useCan } from "@/hooks/useCan";
import { PaymentsPanel } from "@/components/orders/PaymentsPanel";
import { InvoicePreviewDialog, buildInvoiceBlob } from "@/components/billing/InvoicePreviewDialog";
import { useCollections, daysOld } from "@/hooks/useCollections";
import type { Invoice } from "@/context/DataContext";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatIndianDate } from "@/utils/formatDate";
import { useNavigate } from "react-router-dom";
import { usePagination } from "@/hooks/use-pagination";
import { ListPagination } from "@/components/ui/list-pagination";
import { TablePageSkeleton } from "@/components/ui/page-skeleton";
import { usePageLoading } from "@/hooks/use-loading";
import { ReportExportFooter } from "@/components/reports/ReportExportFooter";
import { exportXlsx, xlsxFilename } from "@/utils/exportXlsx";
import { filterByTimePeriod, periodRangeLabel, type TimePeriod } from "@/components/reports/TimePeriodFilter";
import { cn } from "@/lib/utils";

type DocType = Invoice["docType"];

const docTypeLabels: Record<DocType, string> = {
  gst_invoice: "GST Invoice",
  estimate: "Estimate",
  proforma: "Proforma",
  credit_note: "Credit Note",
};

const docTypeBadgeColors: Record<DocType, string> = {
  gst_invoice: "bg-primary/10 text-primary",
  estimate: "bg-warning/10 text-warning",
  proforma: "bg-accent/10 text-accent",
  credit_note: "bg-destructive/10 text-destructive",
};

const modeLabels: Record<string, string> = {
  cash: "Cash",
  upi: "UPI",
  bank_transfer: "Bank transfer",
  cheque: "Cheque",
};

export default function Billing() {
  const api = useApi();
  const navigate = useNavigate();
  const { companyId } = useAuth();
  const canSeeMoney = useCan("see_money");
  const invoices = api.invoices.list();
  const orders = api.orders.list();
  const { receipts, receivedByInvoice, loading: moneyLoading, reload } = useCollections(companyId);

  const isLoading = usePageLoading(api.loading);

  // Trust stamp: refresh whenever a non-loading invoice snapshot lands.
  const [lastReconciled, setLastReconciled] = useState(() => new Date());
  useEffect(() => {
    if (!api.loading) setLastReconciled(new Date());
  }, [api.loading, invoices.length]);

  // Persist filters across navigation
  const FILTER_KEY = "billing:filters";
  const restoredFilters = useMemo(() => {
    try {
      const raw = sessionStorage.getItem(FILTER_KEY);
      return raw ? JSON.parse(raw) as { search?: string; type?: string; period?: TimePeriod | "all"; tab?: string } : {};
    } catch { return {}; }
  }, []);

  const [tab, setTab] = useState(restoredFilters.tab || "collections");
  const [search, setSearch] = useState(restoredFilters.search || "");
  const [filterType, setFilterType] = useState<string>(restoredFilters.type || "all");
  const [timePeriod, setTimePeriod] = useState<TimePeriod | "all">(restoredFilters.period || "all");
  const [payFilter, setPayFilter] = useState<"all" | "unpaid" | "partial" | "paid" | "overdue">("all");
  const [modeFilter, setModeFilter] = useState<string>("all");
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [collectTarget, setCollectTarget] = useState<Invoice | null>(null);

  useEffect(() => {
    try {
      sessionStorage.setItem(FILTER_KEY, JSON.stringify({ search, type: filterType, period: timePeriod, tab }));
    } catch { /* quota — ignore */ }
  }, [search, filterType, timePeriod, tab]);

  const handleDownloadPdf = useCallback(async (inv: Invoice) => {
    try {
      const blob = await buildInvoiceBlob(inv);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${inv.invoiceNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Could not make the PDF. Try again.");
    }
  }, []);

  /** Search + period filter, shared by every tab. */
  const inPeriod = useCallback((list: Invoice[]) => {
    if (timePeriod === "all") return list;
    return filterByTimePeriod(list.map(i => ({ ...i, date: i.invoiceDate })), timePeriod)
      .map(({ date, ...rest }) => rest as Invoice);
  }, [timePeriod]);

  const matchesSearch = useCallback((inv: Invoice) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return inv.invoiceNumber.toLowerCase().includes(q) || inv.buyerName.toLowerCase().includes(q);
  }, [search]);

  /** Every GST bill with the money that has landed against it. */
  const collections = useMemo(() => {
    const bills = inPeriod(invoices.filter(i => i.docType === "gst_invoice" && matchesSearch(i)));
    return bills
      .map(inv => {
        const received = receivedByInvoice.get(inv.id) || 0;
        const due = Math.max(0, Math.round((inv.grandTotal - received) * 100) / 100);
        const age = daysOld(inv.invoiceDate);
        return { inv, received, due, age, overdue: due > 0 && age > 30 };
      })
      .filter(r => {
        if (payFilter === "unpaid") return r.received === 0 && r.due > 0;
        if (payFilter === "partial") return r.received > 0 && r.due > 0;
        if (payFilter === "paid") return r.due === 0;
        if (payFilter === "overdue") return r.overdue;
        return true;
      })
      .sort((a, b) => (b.due > 0 ? b.age : -1) - (a.due > 0 ? a.age : -1));
  }, [invoices, inPeriod, matchesSearch, receivedByInvoice, payFilter]);

  const dealerName = useCallback((distributorId: string) =>
    api.distributors.list().find(d => d.id === distributorId)?.name || "", [api.distributors]);

  const invoiceNumberById = useMemo(() => {
    const m = new Map<string, string>();
    invoices.forEach(i => m.set(i.id, i.invoiceNumber));
    return m;
  }, [invoices]);

  const orderNumberById = useMemo(() => {
    const m = new Map<string, string>();
    orders.forEach(o => m.set(o.id, o.orderNumber));
    return m;
  }, [orders]);

  /** Every receipt taken, newest first. */
  const paymentRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return receipts
      .filter(r => modeFilter === "all" || r.mode === modeFilter)
      .filter(r => {
        if (!q) return true;
        const against = r.invoiceId ? invoiceNumberById.get(r.invoiceId) : r.orderId ? orderNumberById.get(r.orderId) : "";
        return (against || "").toLowerCase().includes(q) || dealerName(r.distributorId).toLowerCase().includes(q);
      });
  }, [receipts, modeFilter, search, invoiceNumberById, orderNumberById, dealerName]);

  const documents = useMemo(() => {
    let list = inPeriod(invoices.filter(matchesSearch));
    if (filterType !== "all") list = list.filter(i => i.docType === filterType);
    return list;
  }, [invoices, inPeriod, matchesSearch, filterType]);

  const { page, totalPages, from, to, setPage } = usePagination(documents.length, 15);
  const paginatedDocs = useMemo(() => documents.slice(from, to), [documents, from, to]);

  const collectionTotals = useMemo(() => {
    const billed = collections.reduce((s, r) => s + r.inv.grandTotal, 0);
    const collected = collections.reduce((s, r) => s + r.received, 0);
    const outstanding = collections.reduce((s, r) => s + r.due, 0);
    const overdue = collections.filter(r => r.overdue).reduce((s, r) => s + r.due, 0);
    return { billed, collected, outstanding, overdue };
  }, [collections]);

  const remind = (inv: Invoice, due: number) => {
    const msg = [
      `Hello ${inv.buyerName},`,
      "",
      `Bill ${inv.invoiceNumber} dated ${formatIndianDate(inv.invoiceDate)}`,
      `Bill amount: ${formatCurrency(inv.grandTotal)}`,
      `Still due: ${formatCurrency(due)}`,
      "",
      "Kindly arrange the payment. Thank you.",
    ].join("\n");
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank", "noopener,noreferrer");
  };

  if (isLoading && invoices.length === 0) {
    return (
      <AppLayout>
        <TablePageSkeleton rows={6} />
      </AppLayout>
    );
  }

  const notesCount = documents.filter(i => i.docType === "credit_note").length;
  const creditedValue = documents
    .filter(i => i.docType === "credit_note")
    .reduce((s, i) => s + (i.grandTotal || 0), 0);

  return (
    <AppLayout>
      <div className="space-y-4 md:space-y-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="h1-display">Money</h1>
            <p className="mt-0.5 text-xs text-muted-foreground md:mt-1 md:text-sm">
              What has been billed, what has come in, and what is still to collect.
            </p>
            <div className="mt-1.5">
              <ReconcileStamp updatedAt={lastReconciled} />
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate("/orders")} className="gap-1.5">
            Go to Orders
          </Button>
        </div>

        <KpiStrip
          cells={[
            { label: "Billed", value: formatCurrency(collectionTotals.billed), zero: collectionTotals.billed === 0 },
            { label: "Collected", value: formatCurrency(collectionTotals.collected), zero: collectionTotals.collected === 0 },
            { label: "Still to collect", value: formatCurrency(collectionTotals.outstanding), zero: collectionTotals.outstanding === 0 },
            { label: "Over 30 days", value: formatCurrency(collectionTotals.overdue), zero: collectionTotals.overdue === 0 },
          ]}
        />

        {/* Shared filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:flex-1 sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by number or dealer..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:contents">
            {tab === "collections" && (
              <Select value={payFilter} onValueChange={v => setPayFilter(v as typeof payFilter)}>
                <SelectTrigger className="w-full sm:w-[170px] h-10">
                  <Filter className="h-3.5 w-3.5 mr-1.5" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All bills</SelectItem>
                  <SelectItem value="unpaid">Nothing paid</SelectItem>
                  <SelectItem value="partial">Part paid</SelectItem>
                  <SelectItem value="paid">Fully paid</SelectItem>
                  <SelectItem value="overdue">Over 30 days</SelectItem>
                </SelectContent>
              </Select>
            )}
            {tab === "payments" && (
              <Select value={modeFilter} onValueChange={setModeFilter}>
                <SelectTrigger className="w-full sm:w-[170px] h-10">
                  <Filter className="h-3.5 w-3.5 mr-1.5" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All ways paid</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="bank_transfer">Bank transfer</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            )}
            {tab === "documents" && (
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full sm:w-[170px] h-10">
                  <Filter className="h-3.5 w-3.5 mr-1.5" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="gst_invoice">GST Invoice</SelectItem>
                  <SelectItem value="estimate">Estimate</SelectItem>
                  <SelectItem value="proforma">Proforma</SelectItem>
                  <SelectItem value="credit_note">Credit Note</SelectItem>
                </SelectContent>
              </Select>
            )}
            <Select value={timePeriod} onValueChange={v => setTimePeriod(v as TimePeriod | "all")}>
              <SelectTrigger className="w-full sm:w-[170px] h-10">
                <CalendarDays className="h-3.5 w-3.5 mr-1.5" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="daily">Today</SelectItem>
                <SelectItem value="weekly">Last 7 days</SelectItem>
                <SelectItem value="monthly">Last 30 days</SelectItem>
                <SelectItem value="yearly">Last 365 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {timePeriod !== "all" && (
            <span className="whitespace-nowrap text-[11px] text-muted-foreground/70 sm:ml-1">
              Showing {periodRangeLabel(timePeriod)}
            </span>
          )}
        </div>

        <Tabs value={tab} onValueChange={setTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="collections">To collect</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          {/* ---------------- Collections ---------------- */}
          <TabsContent value="collections" className="space-y-4">
            {collections.length === 0 ? (
              <EmptyCard
                icon={FileText}
                title="No bills yet."
                description="A bill is created the moment you dispatch an order."
                actionLabel="Go to Orders"
                onAction={() => navigate("/orders")}
              />
            ) : (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-card overflow-hidden">
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Bill</TableHead>
                        <TableHead className="text-xs">Dealer</TableHead>
                        <TableHead className="text-xs">Date</TableHead>
                        <TableHead className="text-xs text-right">Total</TableHead>
                        <TableHead className="text-xs text-right">Received</TableHead>
                        <TableHead className="text-xs text-right">Still due</TableHead>
                        <TableHead className="text-xs">Age</TableHead>
                        <TableHead className="text-xs text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {collections.map(({ inv, received, due, age, overdue }) => {
                        const linkedOrder = inv.sourceOrderId ? orders.find(o => o.id === inv.sourceOrderId) : null;
                        return (
                          <TableRow key={inv.id} className="row-hover">
                            <TableCell className="font-mono text-xs font-medium">{inv.invoiceNumber}</TableCell>
                            <TableCell className="text-sm">{inv.buyerName}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{formatIndianDate(inv.invoiceDate)}</TableCell>
                            <TableCell className="text-right font-mono text-sm tabular-nums">{formatCurrency(inv.grandTotal)}</TableCell>
                            <TableCell className="text-right font-mono text-sm tabular-nums text-success">{formatCurrency(received)}</TableCell>
                            <TableCell className={cn("text-right font-mono text-sm font-semibold tabular-nums", due > 0 ? "text-destructive" : "text-muted-foreground")}>
                              {formatCurrency(due)}
                            </TableCell>
                            <TableCell className="text-xs">
                              {due === 0 ? (
                                <span className="text-muted-foreground">Settled</span>
                              ) : (
                                <span className={overdue ? "font-medium text-destructive" : "text-muted-foreground"}>
                                  {age} day{age === 1 ? "" : "s"}
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                {canSeeMoney && due > 0 && (
                                  <Button variant="ghost" size="icon" className="h-8 w-8" title="Record payment" onClick={() => setCollectTarget(inv)}>
                                    <IndianRupee className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                                <Button variant="ghost" size="icon" className="h-8 w-8" title="Preview bill" onClick={() => setPreviewInvoice(inv)}>
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>
                                {linkedOrder && (
                                  <Button variant="ghost" size="icon" className="h-8 w-8" title="Open order" onClick={() => navigate(`/orders/${linkedOrder.id}`)}>
                                    <Link2 className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-success" title="Remind on WhatsApp" onClick={() => remind(inv, due)}>
                                  <WhatsAppIcon className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile cards */}
                <div className="space-y-3 p-3 md:hidden">
                  {collections.map(({ inv, received, due, age, overdue }) => (
                    <div key={inv.id} className="space-y-2 rounded-md border border-border/60 bg-card p-4">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-medium">{inv.invoiceNumber}</span>
                        <span className={cn("text-sm font-bold tabular-nums", due > 0 ? "text-destructive" : "text-success")}>
                          {due > 0 ? formatCurrency(due) : "Settled"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {inv.buyerName} · {formatIndianDate(inv.invoiceDate)}
                        {due > 0 && <span className={overdue ? " text-destructive" : ""}> · {age} day{age === 1 ? "" : "s"}</span>}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Total {formatCurrency(inv.grandTotal)} · Received {formatCurrency(received)}
                      </p>
                      <div className="flex items-center gap-1 border-t border-border/40 pt-1">
                        {canSeeMoney && due > 0 && (
                          <Button variant="ghost" size="sm" className="h-9 px-2 text-xs" onClick={() => setCollectTarget(inv)}>
                            <IndianRupee className="h-3.5 w-3.5" /> Payment
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" className="h-9 px-2 text-xs" onClick={() => setPreviewInvoice(inv)}>
                          <Eye className="h-3.5 w-3.5" /> Preview
                        </Button>
                        <Button variant="ghost" size="sm" className="h-9 px-2 text-xs text-success" onClick={() => remind(inv, due)}>
                          <WhatsAppIcon className="h-3.5 w-3.5" /> Remind
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {collections.length > 0 && (
              <ReportExportFooter
                excelLabel="Download Excel"
                onExcel={() => exportXlsx(
                  xlsxFilename("to-collect"),
                  ["Bill", "Dealer", "Date", "Total", "Received", "Still due", "Days"],
                  collections.map(r => [
                    r.inv.invoiceNumber, r.inv.buyerName, r.inv.invoiceDate,
                    String(r.inv.grandTotal), String(r.received), String(r.due), String(r.age),
                  ]),
                )}
                onPdf={async () => {
                  const [{ ReportPdf }, { pdf }] = await Promise.all([
                    import("@/components/pdf/ReportPdf"),
                    import("@react-pdf/renderer"),
                  ]);
                  const blob = await pdf(
                    <ReportPdf
                      title="Money still to collect"
                      headers={["Bill", "Dealer", "Date", "Total", "Received", "Still due"]}
                      rows={collections.map(r => [
                        r.inv.invoiceNumber, r.inv.buyerName, formatIndianDate(r.inv.invoiceDate),
                        formatCurrency(r.inv.grandTotal), formatCurrency(r.received), formatCurrency(r.due),
                      ])}
                    />,
                  ).toBlob();
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "to-collect.pdf";
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              />
            )}
          </TabsContent>

          {/* ---------------- Payments ---------------- */}
          <TabsContent value="payments" className="space-y-4">
            {moneyLoading ? (
              <TablePageSkeleton rows={4} />
            ) : paymentRows.length === 0 ? (
              <EmptyCard
                icon={IndianRupee}
                title="No payments recorded yet."
                description="Record money on an order or a bill and it shows up here."
                actionLabel="Go to Orders"
                onAction={() => navigate("/orders")}
              />
            ) : (
              <div className="glass-card overflow-hidden">
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Date</TableHead>
                        <TableHead className="text-xs">Dealer</TableHead>
                        <TableHead className="text-xs">Against</TableHead>
                        <TableHead className="text-xs">Paid by</TableHead>
                        <TableHead className="text-xs">Reference</TableHead>
                        <TableHead className="text-xs text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paymentRows.map(r => {
                        const against = r.invoiceId
                          ? invoiceNumberById.get(r.invoiceId)
                          : r.orderId ? `${orderNumberById.get(r.orderId) || "Order"} (advance)` : "—";
                        return (
                          <TableRow key={r.id} className="row-hover">
                            <TableCell className="text-xs text-muted-foreground">{formatIndianDate(r.paidOn)}</TableCell>
                            <TableCell className="text-sm">{dealerName(r.distributorId)}</TableCell>
                            <TableCell className="font-mono text-xs">{against}</TableCell>
                            <TableCell className="text-xs">{modeLabels[r.mode] || r.mode}</TableCell>
                            <TableCell className="font-mono text-xs text-muted-foreground">{r.reference || "—"}</TableCell>
                            <TableCell className="text-right">
                              <span className={cn("font-mono text-sm tabular-nums", r.status === "voided" ? "text-muted-foreground line-through" : "text-success")}>
                                {formatCurrency(r.amount)}
                              </span>
                              {r.status === "voided" && (
                                <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                                  <Ban className="h-2.5 w-2.5" /> Cancelled
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                <div className="space-y-3 p-3 md:hidden">
                  {paymentRows.map(r => (
                    <div key={r.id} className="space-y-1.5 rounded-md border border-border/60 bg-card p-4">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium">{dealerName(r.distributorId)}</span>
                        <span className={cn("text-sm font-bold tabular-nums", r.status === "voided" ? "text-muted-foreground line-through" : "text-success")}>
                          {formatCurrency(r.amount)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatIndianDate(r.paidOn)} · {modeLabels[r.mode] || r.mode}
                        {r.reference ? ` · ${r.reference}` : ""}
                      </p>
                      <p className="font-mono text-[11px] text-muted-foreground">
                        {r.invoiceId ? invoiceNumberById.get(r.invoiceId) : r.orderId ? `${orderNumberById.get(r.orderId) || "Order"} (advance)` : ""}
                      </p>
                      {r.status === "voided" && (
                        <p className="text-[11px] text-muted-foreground">Cancelled{r.voidReason ? ` — ${r.voidReason}` : ""}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {paymentRows.length > 0 && (
              <ReportExportFooter
                excelLabel="Download Excel"
                onExcel={() => exportXlsx(
                  xlsxFilename("payments"),
                  ["Date", "Dealer", "Against", "Paid by", "Reference", "Amount", "Status"],
                  paymentRows.map(r => [
                    r.paidOn,
                    dealerName(r.distributorId),
                    (r.invoiceId ? invoiceNumberById.get(r.invoiceId) : orderNumberById.get(r.orderId || "")) || "",
                    modeLabels[r.mode] || r.mode,
                    r.reference,
                    String(r.amount),
                    r.status === "voided" ? "Cancelled" : "Posted",
                  ]),
                )}
                onPdf={async () => {
                  const [{ ReportPdf }, { pdf }] = await Promise.all([
                    import("@/components/pdf/ReportPdf"),
                    import("@react-pdf/renderer"),
                  ]);
                  const blob = await pdf(
                    <ReportPdf
                      title="Payments received"
                      headers={["Date", "Dealer", "Against", "Paid by", "Amount"]}
                      rows={paymentRows.map(r => [
                        formatIndianDate(r.paidOn),
                        dealerName(r.distributorId),
                        (r.invoiceId ? invoiceNumberById.get(r.invoiceId) : orderNumberById.get(r.orderId || "")) || "",
                        modeLabels[r.mode] || r.mode,
                        formatCurrency(r.amount),
                      ])}
                    />,
                  ).toBlob();
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "payments.pdf";
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              />
            )}
          </TabsContent>

          {/* ---------------- Documents ---------------- */}
          <TabsContent value="documents" className="space-y-4">
            <KpiStrip
              cells={[
                { label: "Documents", value: documents.length, zero: documents.length === 0 },
                { label: "Credit notes", value: notesCount, zero: notesCount === 0 },
                { label: "Credited back", value: formatCurrency(creditedValue), zero: creditedValue === 0 },
              ]}
            />
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={documents.length === 0 ? "" : "glass-card overflow-hidden"}>
              {documents.length === 0 ? (
                <EmptyCard
                  icon={FileText}
                  title="No documents yet."
                  description="A bill is created the moment you dispatch an order."
                  actionLabel="Go to Orders"
                  onAction={() => navigate("/orders")}
                />
              ) : (
                <>
                  <div className="hidden md:block overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs w-[110px]">Type</TableHead>
                          <TableHead className="text-xs">Number</TableHead>
                          <TableHead className="text-xs">Date</TableHead>
                          <TableHead className="text-xs">Buyer</TableHead>
                          <TableHead className="text-xs">Order</TableHead>
                          <TableHead className="text-xs text-right">Amount</TableHead>
                          <TableHead className="text-xs">Status</TableHead>
                          <TableHead className="text-xs text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedDocs.map(inv => {
                          const linkedOrder = inv.sourceOrderId ? orders.find(o => o.id === inv.sourceOrderId) : null;
                          return (
                            <TableRow key={inv.id} className="row-hover">
                              <TableCell>
                                <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-medium ${docTypeBadgeColors[inv.docType] || 'bg-muted text-muted-foreground'}`}>
                                  {docTypeLabels[inv.docType] || inv.docType}
                                </span>
                              </TableCell>
                              <TableCell className="font-mono text-xs font-medium">{inv.invoiceNumber}</TableCell>
                              <TableCell className="text-xs text-muted-foreground">{formatIndianDate(inv.invoiceDate)}</TableCell>
                              <TableCell className="text-sm">{inv.buyerName}</TableCell>
                              <TableCell className="text-xs">
                                {linkedOrder ? (
                                  <button
                                    onClick={() => navigate(`/orders/${linkedOrder.id}`)}
                                    className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                                  >
                                    <Link2 className="h-3 w-3" />
                                    {linkedOrder.orderNumber}
                                  </button>
                                ) : (
                                  <span className="text-muted-foreground/50 text-[10px]">Legacy</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right font-mono text-sm tabular-nums">{formatCurrency(inv.grandTotal)}</TableCell>
                              <TableCell>
                                {inv.status === "draft" ? (
                                  <span className="inline-flex items-center rounded-full bg-warning/10 px-2 py-0.5 text-[10px] font-medium text-warning">
                                    Draft
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">
                                    <Lock className="h-2.5 w-2.5" /> Final
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPreviewInvoice(inv)} title="Preview">
                                    <Eye className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDownloadPdf(inv)} title="Download PDF">
                                    <Download className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-success" onClick={() => shareInvoiceOnWhatsApp(inv)} title="Share on WhatsApp">
                                    <WhatsAppIcon className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile cards */}
                  <div className="space-y-3 p-3 md:hidden">
                    {paginatedDocs.map(inv => (
                      <div key={inv.id} className="rounded-md border border-border/60 bg-card p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-medium ${docTypeBadgeColors[inv.docType] || 'bg-muted text-muted-foreground'}`}>
                            {docTypeLabels[inv.docType] || inv.docType}
                          </span>
                          {inv.status === "draft" ? (
                            <span className="inline-flex items-center rounded-full bg-warning/10 px-2 py-0.5 text-[10px] font-medium text-warning">
                              Draft
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">
                              <Lock className="h-2.5 w-2.5" /> Final
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-medium">{inv.invoiceNumber}</span>
                          <span className="text-sm font-bold tabular-nums">{formatCurrency(inv.grandTotal)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{inv.buyerName} · {formatIndianDate(inv.invoiceDate)}</p>
                        <div className="flex items-center gap-1 pt-1 border-t border-border/40">
                          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setPreviewInvoice(inv)}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => handleDownloadPdf(inv)}>
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-9 w-9 text-success" onClick={() => shareInvoiceOnWhatsApp(inv)}>
                            <WhatsAppIcon className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </motion.div>
            <ListPagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </TabsContent>
        </Tabs>
      </div>

      <InvoicePreviewDialog invoice={previewInvoice} onClose={() => setPreviewInvoice(null)} />

      <Sheet open={!!collectTarget} onOpenChange={o => !o && setCollectTarget(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-md">
          <SheetHeader className="border-b border-border px-4 py-3">
            <SheetTitle className="text-base">{collectTarget?.buyerName}</SheetTitle>
          </SheetHeader>
          {collectTarget && (
            <PaymentsPanel
              bare
              invoiceId={collectTarget.id}
              docLabel={collectTarget.invoiceNumber}
              docTotal={collectTarget.grandTotal}
              canRecord={canSeeMoney}
              onChanged={async () => { await reload(); api.refreshAll(); }}
            />
          )}
        </SheetContent>
      </Sheet>
    </AppLayout>
  );
}
