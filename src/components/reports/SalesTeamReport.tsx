import { useState } from "react";
import { Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/data/mock-data";
import { useApi } from "@/services/api";
import { TimePeriodFilter, filterByTimePeriod, periodLabel, type TimePeriod } from "./TimePeriodFilter";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { exportCsv, csvFilename } from "@/utils/exportCsv";
import { downloadPdf, pdfFilename, formatCurrencyPdf } from "@/utils/exportPdf";
import { ExportPdfModal, type PdfSection } from "@/components/pdf/ExportPdfModal";
import { ReportPdf } from "@/components/pdf/ReportPdf";

export function SalesTeamReport() {
  const api = useApi();
  const { companyInfo } = api;
  const orders = api.orders.list();
  const salespersons = api.salespersons.list();
  const [period, setPeriod] = useState<TimePeriod>("monthly");
  const filteredOrders = filterByTimePeriod(orders, period);

  const data = salespersons
    .map((s) => {
      const sOrders = filteredOrders.filter((o) => o.salespersonId === s.id);
      const revenue = sOrders.reduce((sum, o) => sum + o.total, 0);
      return { ...s, orderCount: sOrders.length, revenue };
    })
    .filter((s) => s.orderCount > 0)
    .sort((a, b) => b.revenue - a.revenue);

  const totalRevenue = data.reduce((s, d) => s + d.revenue, 0);
  const totalOrders = data.reduce((s, d) => s + d.orderCount, 0);

  type MemberRow = typeof data[number];
  const [selected, setSelected] = useState<MemberRow | null>(null);

  const selectedOrders = selected ? filteredOrders.filter((o) => o.salespersonId === selected.id) : [];
  const [pdfOpen, setPdfOpen] = useState(false);
  const rptSections: PdfSection[] = [
    { id: "company", label: "Company header" },
    { id: "summary", label: "Summary statistics" },
    { id: "table", label: "Sales team table" },
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
          <span className="whitespace-nowrap text-muted-foreground">{data.length} members</span>
        </div>
        <div className="sm:ml-auto flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              exportCsv(
                csvFilename("sales-team-report"),
                ["Name", "Region", "Phone", "Orders", "Revenue"],
                data.map((s) => [s.name, s.region, s.phone, String(s.orderCount), formatCurrency(s.revenue)])
              );
            }}
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPdfOpen(true)}>
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
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Region</th>
                <th className="px-6 py-3 font-medium text-right">Orders</th>
                <th className="px-6 py-3 font-medium text-right">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">No data for {periodLabel(period).toLowerCase()}</td></tr>
              ) : data.map((s) => (
                <tr key={s.id} className="border-b border-border/50 row-hover cursor-pointer" onClick={() => setSelected(s)}>
                  <td className="px-6 py-4 font-medium">{s.name}</td>
                  <td className="px-6 py-4 text-muted-foreground">{s.region}</td>
                  <td className="px-6 py-4 text-right">{s.orderCount}</td>
                  <td className="px-6 py-4 text-right font-medium">{formatCurrency(s.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="md:hidden">
          {data.length === 0 ? (
            <div className="px-4 py-12 text-center text-xs text-muted-foreground">No data for {periodLabel(period).toLowerCase()}</div>
          ) : data.map((s) => (
            <div key={s.id} className="border-b border-border/50 px-4 py-3 card-hover cursor-pointer" onClick={() => setSelected(s)}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{s.name}</span>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{s.region} · {s.orderCount} orders</p>
                </div>
                <span className="shrink-0 text-sm font-medium">{formatCurrency(s.revenue)}</span>
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
                    <span className="text-[10px] text-muted-foreground md:text-xs">Region</span>
                    <p className="mt-0.5 text-xs font-medium md:text-sm">{selected.region}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/20 p-3">
                    <span className="text-[10px] text-muted-foreground md:text-xs">Phone</span>
                    <p className="mt-0.5 text-xs font-medium md:text-sm">{selected.phone}</p>
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
                          <th className="px-2 py-2 font-medium md:px-4">Dealer</th>
                          <th className="px-2 py-2 font-medium md:px-4">Status</th>
                          <th className="px-2 py-2 font-medium text-right md:px-4">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedOrders.map((o) => (
                          <tr key={o.id} className="border-b border-border/50">
                            <td className="px-2 py-2.5 max-w-[90px] truncate font-medium md:px-4">{o.orderNumber}</td>
                            <td className="px-2 py-2.5 max-w-[90px] truncate text-muted-foreground md:px-4">{o.distributorName}</td>
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
        title="Export Sales Team Report PDF"
        onGenerate={(sel) => {
          downloadPdf(
            pdfFilename("sales-team-report"),
            <ReportPdf
              companyName={companyInfo.name}
              companyAddress={companyInfo.address}
              gstin={companyInfo.gstin}
              logoUrl={companyInfo.logoUrl}
              title="Sales Team Report"
              subtitle={periodLabel(period)}
              showCompany={sel.company}
              showSummary={sel.summary}
              showTable={sel.table}
              summary={[
                { label: "Revenue", value: formatCurrencyPdf(totalRevenue) },
                { label: "Orders", value: String(totalOrders) },
                { label: "Members", value: String(data.length) },
              ]}
              columns={[
                { header: "Name", width: "30%" },
                { header: "Region", width: "25%" },
                { header: "Orders", width: "15%", align: "right" },
                { header: "Revenue", width: "30%", align: "right" },
              ]}
              rows={data.map((s) => [s.name, s.region, String(s.orderCount), formatCurrencyPdf(s.revenue)])}
            />
          );
        }}
      />
    </div>
  );
}
