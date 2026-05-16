import { useState } from "react";
import { Download, FileText, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency, type Order } from "@/data/mock-data";
import { useApi } from "@/services/api";
import { netTotal } from "@/lib/revenue";
import { StatusBadge } from "@/components/ui/status-badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TimePeriodFilter, filterByTimePeriod, periodLabel, periodRangeLabel, type TimePeriod } from "./TimePeriodFilter";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatIndianDate } from "@/utils/formatDate";
import { exportCsv, csvFilename } from "@/utils/exportCsv";
import { downloadPdf, pdfFilename, formatCurrencyPdf } from "@/utils/exportPdf";
import { ExportPdfModal, type PdfSection } from "@/components/pdf/ExportPdfModal";
// ReportPdf is dynamically imported on click to keep @react-pdf/renderer out of this route chunk
import { computeDealerAging, sortByRisk } from "@/lib/aging";

export function PaymentReport() {
  const api = useApi();
  const { companyInfo } = api;
  const orders = api.orders.list();
  const distributors = api.dealers.list();
  const [period, setPeriod] = useState<TimePeriod>("monthly");
  const [filter, setFilter] = useState("all");
  const [scope, setScope] = useState<"delivered" | "all">("delivered");
  const [selected, setSelected] = useState<Order | null>(null);

  // netTotal imported from @/lib/revenue (single source of truth)

  const periodFiltered = filterByTimePeriod(orders, period);
  const scoped = scope === "delivered" ? periodFiltered.filter(o => o.deliveryStatus === "delivered") : periodFiltered;
  const filtered = filter === "all" ? scoped : scoped.filter((o) => o.paymentStatus === filter);
  const [pdfOpen, setPdfOpen] = useState(false);
  const rptSections: PdfSection[] = [
    { id: "company", label: "Company header" },
    { id: "summary", label: "Summary statistics" },
    { id: "table", label: "Payment table" },
  ];

  return (
    <div className="space-y-4 overflow-x-hidden">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
        <TimePeriodFilter value={period} onChange={setPeriod} />
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="h-10 w-full rounded-lg sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
        <Select value={scope} onValueChange={(v) => setScope(v as "delivered" | "all")}>
          <SelectTrigger className="h-10 w-full rounded-lg sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="delivered">Delivered Only</SelectItem>
            <SelectItem value="all">All Orders</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs md:gap-6 md:text-sm">
          <span className="whitespace-nowrap text-muted-foreground">
            {periodLabel(period)}: <span className="font-semibold text-foreground">{formatCurrency(filtered.reduce((s, o) => s + netTotal(o), 0))}</span>
          </span>
          <span className="whitespace-nowrap text-muted-foreground">{filtered.length} orders</span>
          <span className="whitespace-nowrap text-[11px] text-muted-foreground/70">Showing {periodRangeLabel(period)} · {scope === "delivered" ? "Delivered only" : "All orders"}</span>
        </div>
        <div className="sm:ml-auto">
          <Button
            variant="outline"
            size="sm"
            className="h-10 w-10 sm:h-10 sm:w-auto sm:px-4"
            onClick={() => {
              exportCsv(
                csvFilename("payment-report"),
                ["Order", "Dealer", "Date", "Amount", "Payment Status", "Payment Mode"],
                filtered.map((o) => [
                  o.orderNumber,
                  o.distributorName,
                  formatIndianDate(o.date),
                  formatCurrency(netTotal(o)),
                  o.paymentStatus,
                  o.paymentMode.replace("_", " "),
                ])
              );
            }}
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-10 w-10 sm:h-10 sm:w-auto sm:px-4"
            title="Export aging summary (XLSX)"
            onClick={() => {
              const aging = sortByRisk(computeDealerAging(orders, distributors));
              exportCsv(
                csvFilename("payment-aging-summary"),
                ["Dealer", "0-30 (₹)", "31-60 (₹)", "61-90 (₹)", "90+ (₹)", "Total Outstanding (₹)", "Credit Limit (₹)", "Utilization %"],
                aging.map((r) => [
                  r.distributorName,
                  r.bucket_0_30.toFixed(0),
                  r.bucket_31_60.toFixed(0),
                  r.bucket_61_90.toFixed(0),
                  r.bucket_90_plus.toFixed(0),
                  r.totalOutstanding.toFixed(0),
                  r.creditLimit > 0 ? r.creditLimit.toFixed(0) : "—",
                  r.creditLimit > 0 ? ((r.totalOutstanding / r.creditLimit) * 100).toFixed(0) : "—",
                ]),
              );
            }}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Aging Summary</span>
          </Button>
          <Button variant="outline" size="sm" className="h-10 w-10 sm:h-10 sm:w-auto sm:px-4" onClick={() => setPdfOpen(true)}>
            <FileText className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Export PDF</span>
          </Button>
        </div>
      </div>
      <div className="glass-card overflow-hidden">
        <div className="hidden md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-6 py-3 font-medium">Order</th>
                <th className="px-6 py-3 font-medium">Dealer</th>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium text-right">Amount</th>
                <th className="px-6 py-3 font-medium">Payment</th>
                <th className="px-6 py-3 font-medium">Mode</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">No data for {periodLabel(period).toLowerCase()}</td></tr>
              ) : filtered.map((o) => (
                <tr key={o.id} className="border-b border-border/50 row-hover cursor-pointer" onClick={() => setSelected(o)}>
                  <td className="px-6 py-4 font-medium text-primary">{o.orderNumber}</td>
                  <td className="px-6 py-4">{o.distributorName}</td>
                  <td className="px-6 py-4 text-muted-foreground">{formatIndianDate(o.date)}</td>
                  <td className="px-6 py-4 text-right font-medium">{formatCurrency(netTotal(o))}</td>
                  <td className="px-6 py-4"><StatusBadge status={o.paymentStatus} /></td>
                  <td className="px-6 py-4 capitalize text-muted-foreground">{o.paymentMode.replace("_", " ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="md:hidden">
          {filtered.length === 0 ? (
            <div className="px-4 py-12 text-center text-xs text-muted-foreground">No data for {periodLabel(period).toLowerCase()}</div>
          ) : filtered.map((o) => (
            <div key={o.id} className="border-b border-border/50 px-4 py-3 card-hover cursor-pointer" onClick={() => setSelected(o)}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{o.orderNumber}</span>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{o.distributorName} · {formatIndianDate(o.date)}</p>
                </div>
                <span className="shrink-0 text-sm font-medium">{formatCurrency(netTotal(o))}</span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <StatusBadge status={o.paymentStatus} />
                <span className="text-xs capitalize text-muted-foreground">{o.paymentMode.replace("_", " ")}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-[calc(100vw-2rem)] max-h-[85vh] overflow-y-auto rounded-xl p-4 md:p-6 sm:max-w-2xl">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="text-base md:text-xl">{selected.orderNumber}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 md:space-y-5">
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div className="rounded-lg border border-border bg-muted/20 p-3">
                    <span className="text-[10px] text-muted-foreground md:text-xs">Date</span>
                    <p className="mt-0.5 text-xs font-medium md:text-sm">{formatIndianDate(selected.date)}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/20 p-3">
                    <span className="text-[10px] text-muted-foreground md:text-xs">Dealer</span>
                    <p className="mt-0.5 text-xs font-medium md:text-sm">{selected.distributorName}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/20 p-3">
                    <span className="text-[10px] text-muted-foreground md:text-xs">Payment</span>
                    <div className="mt-1"><StatusBadge status={selected.paymentStatus} /></div>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/20 p-3">
                    <span className="text-[10px] text-muted-foreground md:text-xs">Total</span>
                    <p className="mt-0.5 text-xs font-semibold md:text-sm">{formatCurrency(netTotal(selected))}</p>
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-muted/20 p-3">
                  <span className="text-[10px] text-muted-foreground md:text-xs">Payment Mode</span>
                  <p className="mt-0.5 text-xs font-medium capitalize md:text-sm">{selected.paymentMode.replace("_", " ")}</p>
                </div>

                <div>
                  <h3 className="mb-2 text-xs font-semibold md:text-sm">Line Items</h3>
                  <div className="rounded-lg border border-border overflow-x-auto">
                    <table className="w-full text-xs md:text-sm">
                      <thead>
                        <tr className="border-b border-border text-left text-[10px] text-muted-foreground md:text-xs">
                          <th className="px-2 py-2 font-medium md:px-4">Product</th>
                          <th className="px-2 py-2 font-medium text-right md:px-4">Qty</th>
                          <th className="px-2 py-2 font-medium text-right md:px-4">Price</th>
                          <th className="px-2 py-2 font-medium text-right md:px-4">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selected.lines.map((l, i) => (
                          <tr key={i} className="border-b border-border/50">
                            <td className="px-2 py-2.5 max-w-[100px] truncate font-medium md:px-4">{l.productName}</td>
                            <td className="px-2 py-2.5 text-right text-muted-foreground md:px-4">{l.quantity}</td>
                            <td className="px-2 py-2.5 text-right text-muted-foreground md:px-4">{formatCurrency(l.unitPrice)}</td>
                            <td className="px-2 py-2.5 text-right font-medium md:px-4">{formatCurrency(l.lineTotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <ExportPdfModal
        open={pdfOpen}
        onOpenChange={setPdfOpen}
        sections={rptSections}
        title="Export Payment Report PDF"
        onGenerate={async (sel) => {
          const totalAmount = filtered.reduce((s, o) => s + netTotal(o), 0);
          const { ReportPdf } = await import("@/components/pdf/ReportPdf");
          downloadPdf(
            pdfFilename("payment-report"),
            <ReportPdf
              companyName={companyInfo.name}
              companyAddress={companyInfo.address}
              gstin={companyInfo.gstin}
              logoUrl={companyInfo.logoUrl}
              title="Payment Report"
              subtitle={periodLabel(period)}
              showCompany={sel.company}
              showSummary={sel.summary}
              showTable={sel.table}
              summary={[
                { label: "Total", value: formatCurrencyPdf(totalAmount) },
                { label: "Orders", value: String(filtered.length) },
              ]}
              columns={[
                { header: "Order", width: "14%" },
                { header: "Dealer", width: "20%" },
                { header: "Date", width: "14%" },
                { header: "Amount", width: "16%", align: "right" },
                { header: "Status", width: "14%" },
                { header: "Mode", width: "16%" },
              ]}
              rows={filtered.map((o) => [
                o.orderNumber,
                o.distributorName,
                formatIndianDate(o.date),
                formatCurrencyPdf(netTotal(o)),
                o.paymentStatus,
                o.paymentMode.replace("_", " "),
              ])}
            />
          );
        }}
      />
    </div>
  );
}
