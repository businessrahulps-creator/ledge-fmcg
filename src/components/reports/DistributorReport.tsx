import { useState } from "react";
import { Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency, type Distributor } from "@/data/mock-data";
import { useApi } from "@/services/api";
import { TimePeriodFilter, filterByTimePeriod, periodLabel, periodRangeLabel, type TimePeriod } from "./TimePeriodFilter";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatIndianDate } from "@/utils/formatDate";
import { exportCsv, csvFilename } from "@/utils/exportCsv";
import { downloadPdf, pdfFilename, formatCurrencyPdf } from "@/utils/exportPdf";
import { ExportPdfModal, type PdfSection } from "@/components/pdf/ExportPdfModal";
import { ReportPdf } from "@/components/pdf/ReportPdf";

export function DistributorReport() {
  const api = useApi();
  const { companyInfo } = api;
  const orders = api.orders.list();
  const distributors = api.dealers.list();
  const [period, setPeriod] = useState<TimePeriod>("monthly");
  const [selected, setSelected] = useState<(Distributor & { orderCount: number; revenue: number }) | null>(null);
  const filteredOrders = filterByTimePeriod(orders, period);

  const data = distributors
    .map((d) => {
      const dOrders = filteredOrders.filter((o) => o.distributorId === d.id);
      const total = dOrders.reduce((s, o) => s + o.total, 0);
      return { ...d, orderCount: dOrders.length, revenue: total };
    })
    .filter((d) => d.orderCount > 0)
    .sort((a, b) => b.revenue - a.revenue);

  const totalRevenue = data.reduce((s, d) => s + d.revenue, 0);
  const totalOrders = data.reduce((s, d) => s + d.orderCount, 0);

  const selectedOrders = selected ? filteredOrders.filter((o) => o.distributorId === selected.id) : [];
  const [pdfOpen, setPdfOpen] = useState(false);
  const rptSections: PdfSection[] = [
    { id: "company", label: "Company header" },
    { id: "summary", label: "Summary statistics" },
    { id: "table", label: "Dealer table" },
  ];

  return (
    <div className="space-y-4 overflow-x-hidden">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
        <TimePeriodFilter value={period} onChange={setPeriod} />
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs md:gap-6 md:text-sm">
          <span className="whitespace-nowrap text-muted-foreground">
            {periodLabel(period)}: <span className="font-semibold text-foreground">{formatCurrency(totalRevenue)}</span>
          </span>
          <span className="whitespace-nowrap text-muted-foreground">{totalOrders} orders</span>
          <span className="whitespace-nowrap text-muted-foreground">{data.length} dealers</span>
          <span className="whitespace-nowrap text-[11px] text-muted-foreground/70">Showing {periodRangeLabel(period)}</span>
        </div>
        <div className="sm:ml-auto">
          <Button
            variant="outline"
            size="sm"
            className="h-10 w-10 sm:h-10 sm:w-auto sm:px-4"
            onClick={() => {
              exportCsv(
                csvFilename("dealer-report"),
                ["Dealer", "Location", "Contact", "Orders", "Revenue"],
                data.map((d) => [d.name, d.location, d.contact, String(d.orderCount), formatCurrency(d.revenue)])
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
                <th className="px-6 py-3 font-medium">Dealer</th>
                <th className="px-6 py-3 font-medium">Location</th>
                <th className="px-6 py-3 font-medium text-right">Orders</th>
                <th className="px-6 py-3 font-medium text-right">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">No data for {periodLabel(period).toLowerCase()}</td></tr>
              ) : data.map((d) => (
                <tr key={d.id} className="border-b border-border/50 row-hover cursor-pointer" onClick={() => setSelected(d)}>
                  <td className="px-6 py-4 font-medium">{d.name}</td>
                  <td className="px-6 py-4 text-muted-foreground">{d.location}</td>
                  <td className="px-6 py-4 text-right">{d.orderCount}</td>
                  <td className="px-6 py-4 text-right font-medium">{formatCurrency(d.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="md:hidden">
          {data.length === 0 ? (
            <div className="px-4 py-12 text-center text-xs text-muted-foreground">No data for {periodLabel(period).toLowerCase()}</div>
          ) : data.map((d) => (
            <div key={d.id} className="border-b border-border/50 px-4 py-3 card-hover cursor-pointer" onClick={() => setSelected(d)}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{d.name}</span>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{d.location} · {d.orderCount} orders</p>
                </div>
                <span className="shrink-0 text-sm font-medium">{formatCurrency(d.revenue)}</span>
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
                <DialogTitle className="text-base md:text-xl">{selected.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 md:space-y-5">
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div className="rounded-lg border border-border bg-muted/20 p-3">
                    <span className="text-[10px] text-muted-foreground md:text-xs">Location</span>
                    <p className="mt-0.5 text-xs font-medium md:text-sm">{selected.location}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/20 p-3">
                    <span className="text-[10px] text-muted-foreground md:text-xs">Contact</span>
                    <p className="mt-0.5 text-xs font-medium md:text-sm">{selected.contact}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/20 p-3">
                    <span className="text-[10px] text-muted-foreground md:text-xs">Orders</span>
                    <p className="mt-0.5 text-xs font-semibold md:text-sm">{selected.orderCount}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/20 p-3">
                    <span className="text-[10px] text-muted-foreground md:text-xs">Revenue</span>
                    <p className="mt-0.5 text-xs font-semibold md:text-sm">{formatCurrency(selected.revenue)}</p>
                  </div>
                </div>

                <div>
                  <h3 className="mb-2 text-xs font-semibold md:text-sm">Orders ({periodLabel(period).toLowerCase()})</h3>
                  <div className="rounded-lg border border-border overflow-x-auto">
                    <table className="w-full text-xs md:text-sm">
                      <thead>
                        <tr className="border-b border-border text-left text-[10px] text-muted-foreground md:text-xs">
                          <th className="px-2 py-2 font-medium md:px-4">Order</th>
                          <th className="px-2 py-2 font-medium md:px-4">Date</th>
                          <th className="px-2 py-2 font-medium md:px-4">Status</th>
                          <th className="px-2 py-2 font-medium text-right md:px-4">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedOrders.map((o) => (
                          <tr key={o.id} className="border-b border-border/50">
                            <td className="px-2 py-2.5 max-w-[90px] truncate font-medium md:px-4">{o.orderNumber}</td>
                            <td className="px-2 py-2.5 text-muted-foreground md:px-4">{formatIndianDate(o.date)}</td>
                            <td className="px-2 py-2.5 md:px-4"><StatusBadge status={o.paymentStatus} /></td>
                            <td className="px-2 py-2.5 text-right font-medium md:px-4">{formatCurrency(o.total)}</td>
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
        title="Export Dealer Report PDF"
        onGenerate={(sel) => {
          downloadPdf(
            pdfFilename("dealer-report"),
            <ReportPdf
              companyName={companyInfo.name}
              companyAddress={companyInfo.address}
              gstin={companyInfo.gstin}
              logoUrl={companyInfo.logoUrl}
              title="Dealer Report"
              subtitle={periodLabel(period)}
              showCompany={sel.company}
              showSummary={sel.summary}
              showTable={sel.table}
              summary={[
                { label: "Revenue", value: formatCurrencyPdf(totalRevenue) },
                { label: "Orders", value: String(totalOrders) },
                { label: "Dealers", value: String(data.length) },
              ]}
              columns={[
                { header: "Dealer", width: "30%" },
                { header: "Location", width: "30%" },
                { header: "Orders", width: "15%", align: "right" },
                { header: "Revenue", width: "25%", align: "right" },
              ]}
              rows={data.map((d) => [d.name, d.location, String(d.orderCount), formatCurrencyPdf(d.revenue)])}
            />
          );
        }}
      />
    </div>
  );
}
