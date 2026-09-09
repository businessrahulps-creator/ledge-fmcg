import { useState, useMemo, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { FileText, Download, Lock, Search, Filter, Link2, CalendarDays } from "lucide-react";
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
import { toast } from "sonner";
import { useApi } from "@/services/api";
import type { InvoicePdfData } from "@/components/pdf/GstInvoicePdf";
import type { Invoice } from "@/context/DataContext";
import { formatCurrency } from "@/utils/formatCurrency";
import { useNavigate } from "react-router-dom";
import { usePagination } from "@/hooks/use-pagination";
import { ListPagination } from "@/components/ui/list-pagination";
import { TablePageSkeleton } from "@/components/ui/page-skeleton";
import { usePageLoading } from "@/hooks/use-loading";
import { filterByTimePeriod, periodRangeLabel, type TimePeriod } from "@/components/reports/TimePeriodFilter";

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

export default function Billing() {
  const api = useApi();
  const navigate = useNavigate();
  const invoices = api.invoices.list();
  const orders = api.orders.list();

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
      return raw ? JSON.parse(raw) as { search?: string; type?: string; period?: TimePeriod | "all" } : {};
    } catch { return {}; }
  }, []);

  const [search, setSearch] = useState(restoredFilters.search || "");
  const [filterType, setFilterType] = useState<string>(restoredFilters.type || "all");
  const [timePeriod, setTimePeriod] = useState<TimePeriod | "all">(restoredFilters.period || "all");

  useEffect(() => {
    try {
      sessionStorage.setItem(FILTER_KEY, JSON.stringify({ search, type: filterType, period: timePeriod }));
    } catch { /* quota — ignore */ }
  }, [search, filterType, timePeriod]);

  const handleDownloadPdf = useCallback(async (inv: Invoice) => {
    const pdfData: InvoicePdfData = {
      docType: inv.docType,
      invoiceNumber: inv.invoiceNumber,
      invoiceDate: inv.invoiceDate,
      buyerName: inv.buyerName,
      buyerAddress: inv.buyerAddress,
      buyerGstin: inv.buyerGstin,
      buyerStateCode: inv.buyerStateCode,
      sellerName: inv.sellerName,
      sellerAddress: inv.sellerAddress,
      sellerGstin: inv.sellerGstin,
      sellerPan: inv.sellerPan,
      sellerStateCode: inv.sellerStateCode,
      sellerPhone: inv.sellerPhone,
      sellerEmail: inv.sellerEmail,
      sellerBankName: inv.sellerBankName,
      sellerBankAccountName: inv.sellerBankAccountName,
      sellerBankAccount: inv.sellerBankAccount,
      sellerBankIfsc: inv.sellerBankIfsc,
      supplyType: inv.supplyType,
      gstRate: inv.gstRate,
      lines: inv.lines,
      subtotal: inv.subtotal,
      cgstAmount: inv.cgstAmount,
      sgstAmount: inv.sgstAmount,
      igstAmount: inv.igstAmount,
      totalTax: inv.totalTax,
      grandTotal: inv.grandTotal,
      roundOff: inv.roundOff,
      amountInWords: inv.amountInWords,
      notes: inv.notes,
      vehicle: inv.vehicle || "",
      driverName: inv.driverName || "",
    };

    try {
      const [{ GstInvoicePdf }, { pdf }] = await Promise.all([
        import("@/components/pdf/GstInvoicePdf"),
        import("@react-pdf/renderer"),
      ]);
      const blob = await pdf(<GstInvoicePdf data={pdfData} />).toBlob();
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

  const filtered = useMemo(() => {
    let list = invoices;
    if (filterType !== "all") list = list.filter(i => i.docType === filterType);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(i => i.invoiceNumber.toLowerCase().includes(q) || i.buyerName.toLowerCase().includes(q));
    }
    if (timePeriod !== "all") {
      list = filterByTimePeriod(list.map(i => ({ ...i, date: i.invoiceDate })), timePeriod).map(({ date, ...rest }) => rest as typeof list[number]);
    }
    return list;
  }, [invoices, filterType, search, timePeriod]);

  const { page, totalPages, from, to, setPage } = usePagination(filtered.length, 15);
  const paginatedList = useMemo(() => filtered.slice(from, to), [filtered, from, to]);

  if (isLoading && invoices.length === 0) {
    return (
      <AppLayout>
        <TablePageSkeleton rows={6} />
      </AppLayout>
    );
  }

  const billsCount = filtered.filter(i => i.docType === "gst_invoice").length;
  const notesCount = filtered.filter(i => i.docType === "credit_note").length;
  const billedValue = filtered
    .filter(i => i.docType === "gst_invoice")
    .reduce((s, i) => s + (i.grandTotal || 0), 0);
  const creditedValue = filtered
    .filter(i => i.docType === "credit_note")
    .reduce((s, i) => s + (i.grandTotal || 0), 0);

  return (
    <AppLayout>
      <div className="space-y-4 md:space-y-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="h1-display">Invoices</h1>
            <p className="mt-0.5 text-xs text-muted-foreground md:mt-1 md:text-sm">
              Every bill and credit note you have raised. Bills are made when you dispatch an order.
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
            { label: "Bills", value: billsCount, zero: billsCount === 0 },
            { label: "Billed value", value: formatCurrency(billedValue), zero: billedValue === 0 },
            { label: "Credit notes", value: notesCount, zero: notesCount === 0 },
            { label: "Credited back", value: formatCurrency(creditedValue), zero: creditedValue === 0 },
          ]}
        />

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:flex-1 sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by number or buyer..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:contents">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-[180px] h-10">
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
            <Select value={timePeriod} onValueChange={v => setTimePeriod(v as TimePeriod | "all")}>
              <SelectTrigger className="w-full sm:w-[180px] h-10">
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

        {/* Document list */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", damping: 26, stiffness: 200 }} className={filtered.length === 0 ? "" : "glass-card overflow-hidden"}>
          {filtered.length === 0 ? (
            <EmptyCard
              icon={FileText}
              title="No bills yet."
              description="A bill is created the moment you dispatch an order."
              actionLabel="Go to Orders"
              onAction={() => navigate("/orders")}
            />
          ) : (
            <>
              {/* Desktop table */}
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
                    {paginatedList.map(inv => {
                      const linkedOrder = inv.sourceOrderId ? orders.find(o => o.id === inv.sourceOrderId) : null;
                      return (
                        <TableRow key={inv.id} className="row-hover">
                          <TableCell>
                            <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-medium ${docTypeBadgeColors[inv.docType] || 'bg-muted text-muted-foreground'}`}>
                              {docTypeLabels[inv.docType] || inv.docType}
                            </span>
                          </TableCell>
                          <TableCell className="font-mono text-xs font-medium">{inv.invoiceNumber}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{inv.invoiceDate}</TableCell>
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
                {paginatedList.map(inv => (
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
                    <p className="text-xs text-muted-foreground">{inv.buyerName} · {inv.invoiceDate}</p>
                    <div className="flex items-center gap-1 pt-1 border-t border-border/40">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDownloadPdf(inv)}>
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-success" onClick={() => shareInvoiceOnWhatsApp(inv)}>
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
      </div>
    </AppLayout>
  );
}
