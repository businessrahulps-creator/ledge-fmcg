import { useState } from "react";
import { Download, FileText } from "lucide-react";
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
import { downloadPdf, pdfFilename } from "@/utils/exportPdf";
import { ExportPdfModal, type PdfSection } from "@/components/pdf/ExportPdfModal";
import { ReportPdf } from "@/components/pdf/ReportPdf";

export function DispatchReport() {
  const api = useApi();
  const { companyInfo } = api;
  const orders = api.orders.list();
  const [period, setPeriod] = useState<TimePeriod>("monthly");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<Order | null>(null);

  const periodFiltered = filterByTimePeriod(orders, period);
  const filtered = filter === "all" ? periodFiltered : periodFiltered.filter((o) => o.deliveryStatus === filter);
  const [pdfOpen, setPdfOpen] = useState(false);
  const rptSections: PdfSection[] = [
    { id: "company", label: "Company header" },
    { id: "summary", label: "Summary statistics" },
    { id: "table", label: "Dispatch table" },
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
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="dispatched">Dispatched</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs md:gap-6 md:text-sm">
          <span className="whitespace-nowrap text-muted-foreground">{filtered.length} orders</span>
          <span className="whitespace-nowrap text-[11px] text-muted-foreground/70">Showing {periodRangeLabel(period)}</span>
        </div>
        <div className="sm:ml-auto">
          <Button
            variant="outline"
            size="sm"
            className="h-10 w-10 sm:h-10 sm:w-auto sm:px-4"
            onClick={() => {
              exportCsv(
                csvFilename("dispatch-report"),
                ["Order", "Dealer", "Date", "Dispatch Date", "Vehicle", "Driver", "Delivery Status", "Amount"],
                filtered.map((o) => [
                  o.orderNumber,
                  o.distributorName,
                  formatIndianDate(o.date),
                  formatIndianDate(o.dispatchDate),
                  o.vehicle || "",
                  o.driverName || "",
                  o.deliveryStatus,
                  formatCurrency(o.total - (o.schemeSavings || 0)),
                ])
              );
            }}
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
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
                <th className="px-6 py-3 font-medium">Dispatch Date</th>
                <th className="px-6 py-3 font-medium">Vehicle</th>
                <th className="px-6 py-3 font-medium">Driver</th>
                <th className="px-6 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">No data for {periodLabel(period).toLowerCase()}</td></tr>
              ) : filtered.map((o) => (
                <tr key={o.id} className="border-b border-border/50 row-hover cursor-pointer" onClick={() => setSelected(o)}>
                  <td className="px-6 py-4 font-medium text-primary">{o.orderNumber}</td>
                  <td className="px-6 py-4">{o.distributorName}</td>
                  <td className="px-6 py-4 text-muted-foreground">{formatIndianDate(o.dispatchDate)}</td>
                  <td className="px-6 py-4 text-muted-foreground">{o.vehicle || "—"}</td>
                  <td className="px-6 py-4 text-muted-foreground">{o.driverName || "—"}</td>
                  <td className="px-6 py-4"><StatusBadge status={o.deliveryStatus} /></td>
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
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{o.orderNumber}</span>
                <div className="shrink-0"><StatusBadge status={o.deliveryStatus} /></div>
              </div>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{o.distributorName} · {formatIndianDate(o.dispatchDate)}</p>
              <p className="truncate text-xs text-muted-foreground">{o.vehicle || "No vehicle"}</p>
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
                    <span className="text-[10px] text-muted-foreground md:text-xs">Dealer</span>
                    <p className="mt-0.5 text-xs font-medium md:text-sm">{selected.distributorName}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/20 p-3">
                    <span className="text-[10px] text-muted-foreground md:text-xs">Date</span>
                    <p className="mt-0.5 text-xs font-medium md:text-sm">{formatIndianDate(selected.date)}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/20 p-3">
                    <span className="text-[10px] text-muted-foreground md:text-xs">Delivery Status</span>
                    <div className="mt-1"><StatusBadge status={selected.deliveryStatus} /></div>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/20 p-3">
                    <span className="text-[10px] text-muted-foreground md:text-xs">Total</span>
                    <p className="mt-0.5 text-xs font-semibold md:text-sm">{formatCurrency(selected.total)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 md:gap-4">
                  <div className="rounded-lg border border-border bg-muted/20 p-3">
                    <span className="text-[10px] text-muted-foreground md:text-xs">Dispatch Date</span>
                    <p className="mt-0.5 text-xs font-medium md:text-sm">{formatIndianDate(selected.dispatchDate)}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/20 p-3">
                    <span className="text-[10px] text-muted-foreground md:text-xs">Vehicle</span>
                    <p className="mt-0.5 text-xs font-medium md:text-sm">{selected.vehicle || "—"}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/20 p-3">
                    <span className="text-[10px] text-muted-foreground md:text-xs">Driver</span>
                    <p className="mt-0.5 text-xs font-medium md:text-sm">{selected.driverName || "—"}</p>
                  </div>
                </div>

                {selected.dispatchRemarks && (
                  <div className="rounded-lg border border-border bg-muted/20 p-3">
                    <span className="text-[10px] text-muted-foreground md:text-xs">Remarks</span>
                    <p className="mt-0.5 text-xs font-medium md:text-sm">{selected.dispatchRemarks}</p>
                  </div>
                )}

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
        title="Export Dispatch Report PDF"
        onGenerate={(sel) => {
          downloadPdf(
            pdfFilename("dispatch-report"),
            <ReportPdf
              companyName={companyInfo.name}
              companyAddress={companyInfo.address}
              gstin={companyInfo.gstin}
              logoUrl={companyInfo.logoUrl}
              title="Dispatch Report"
              subtitle={periodLabel(period)}
              showCompany={sel.company}
              showSummary={sel.summary}
              showTable={sel.table}
              summary={[
                { label: "Orders", value: String(filtered.length) },
              ]}
              columns={[
                { header: "Order", width: "14%" },
                { header: "Dealer", width: "18%" },
                { header: "Date", width: "14%" },
                { header: "Dispatch", width: "14%" },
                { header: "Vehicle", width: "14%" },
                { header: "Driver", width: "14%" },
                { header: "Status", width: "12%" },
              ]}
              rows={filtered.map((o) => [
                o.orderNumber,
                o.distributorName,
                formatIndianDate(o.date),
                formatIndianDate(o.dispatchDate),
                o.vehicle || "—",
                o.driverName || "—",
                o.deliveryStatus,
              ])}
            />
          );
        }}
      />
    </div>
  );
}
