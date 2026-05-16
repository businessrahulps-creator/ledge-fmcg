import { useState } from "react";
import { Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatNumber } from "@/data/mock-data";
import { useApi } from "@/services/api";
import { TimePeriodFilter, filterByTimePeriod, periodLabel, periodRangeLabel, type TimePeriod } from "./TimePeriodFilter";
import { RevenueScopeFilter, applyRevenueScope, type RevenueScope } from "./RevenueScopeFilter";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { exportCsv, csvFilename } from "@/utils/exportCsv";
import { downloadPdf, pdfFilename, formatCurrencyPdf } from "@/utils/exportPdf";
import { ExportPdfModal, type PdfSection } from "@/components/pdf/ExportPdfModal";
// ReportPdf is dynamically imported on click to keep @react-pdf/renderer out of this route chunk

export function ProductReport() {
  const api = useApi();
  const { companyInfo } = api;
  const orders = api.orders.list();
  const products = api.products.list();
  const [period, setPeriod] = useState<TimePeriod>("monthly");
  const [scope, setScope] = useState<RevenueScope>("delivered");
  const filteredOrders = applyRevenueScope(filterByTimePeriod(orders, period), scope);

  const data = products
    .map((p) => {
      let qty = 0;
      let rev = 0;
      filteredOrders.forEach((o) => {
        const gross = o.lines.reduce((s, l) => s + l.lineTotal, 0);
        const savings = o.schemeSavings || 0;
        // Pro-rate order-level scheme savings across lines by line share of gross
        const netFactor = gross > 0 ? Math.max(0, (gross - savings)) / gross : 1;
        o.lines.forEach((l) => {
          if (l.productId === p.id) {
            qty += l.quantity;
            rev += l.lineTotal * netFactor;
          }
        });
      });
      return { ...p, qtySold: qty, revenue: rev };
    })
    .filter((p) => p.qtySold > 0)
    .sort((a, b) => b.revenue - a.revenue);

  const totalRevenue = data.reduce((s, p) => s + p.revenue, 0);
  const totalQty = data.reduce((s, p) => s + p.qtySold, 0);

  type ProductRow = typeof data[number];
  const [selected, setSelected] = useState<ProductRow | null>(null);

  const selectedProductOrders = selected
    ? filteredOrders
        .filter((o) => o.lines.some((l) => l.productId === selected.id))
        .map((o) => {
          const line = o.lines.find((l) => l.productId === selected!.id)!;
          return { ...o, qty: line.quantity, lineTotal: line.lineTotal };
        })
    : [];
  const [pdfOpen, setPdfOpen] = useState(false);
  const rptSections: PdfSection[] = [
    { id: "company", label: "Company header" },
    { id: "summary", label: "Summary statistics" },
    { id: "table", label: "Product table" },
  ];

  return (
    <div className="space-y-4 overflow-x-hidden">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
        <TimePeriodFilter value={period} onChange={setPeriod} />
        <RevenueScopeFilter value={scope} onChange={setScope} />
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs md:gap-6 md:text-sm">
          <span className="whitespace-nowrap text-muted-foreground">
            {periodLabel(period)}: <span className="font-semibold text-foreground">{formatCurrency(totalRevenue)}</span>
          </span>
          <span className="whitespace-nowrap text-muted-foreground">{formatNumber(totalQty)} units sold</span>
          <span className="whitespace-nowrap text-[11px] text-muted-foreground/70">Showing {periodRangeLabel(period)} · {scope === "delivered" ? "Delivered only" : "All orders"}</span>
        </div>
        <div className="sm:ml-auto">
          <Button
            variant="outline"
            size="sm"
            className="h-10 w-10 sm:h-10 sm:w-auto sm:px-4"
            onClick={() => {
              exportCsv(
                csvFilename("product-report"),
                ["Product", "SKU", "Qty Sold", "Revenue"],
                data.map((p) => [p.name, p.sku, String(p.qtySold), formatCurrency(p.revenue)])
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
                <th className="px-6 py-3 font-medium">Product</th>
                <th className="px-6 py-3 font-medium">SKU</th>
                <th className="px-6 py-3 font-medium text-right">Qty Sold</th>
                <th className="px-6 py-3 font-medium text-right">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">No data for {periodLabel(period).toLowerCase()}</td></tr>
              ) : data.map((p) => (
                <tr key={p.id} className="border-b border-border/50 row-hover cursor-pointer" onClick={() => setSelected(p)}>
                  <td className="px-6 py-4 font-medium">{p.name}</td>
                  <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{p.sku}</td>
                  <td className="px-6 py-4 text-right">{formatNumber(p.qtySold)}</td>
                  <td className="px-6 py-4 text-right font-medium">{formatCurrency(p.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="md:hidden">
          {data.length === 0 ? (
            <div className="px-4 py-12 text-center text-xs text-muted-foreground">No data for {periodLabel(period).toLowerCase()}</div>
          ) : data.map((p) => (
            <div key={p.id} className="border-b border-border/50 px-4 py-3 card-hover cursor-pointer" onClick={() => setSelected(p)}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{p.name}</span>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{p.sku} · {formatNumber(p.qtySold)} sold</p>
                </div>
                <span className="shrink-0 text-sm font-medium">{formatCurrency(p.revenue)}</span>
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
                    <span className="text-[10px] text-muted-foreground md:text-xs">SKU</span>
                    <p className="mt-0.5 font-mono text-xs font-medium md:text-sm">{selected.sku}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/20 p-3">
                    <span className="text-[10px] text-muted-foreground md:text-xs">Base Price</span>
                    <p className="mt-0.5 text-xs font-medium md:text-sm">{formatCurrency(selected.basePrice)}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/20 p-3">
                    <span className="text-[10px] text-muted-foreground md:text-xs">Units Sold</span>
                    <p className="mt-0.5 text-xs font-semibold md:text-sm">{formatNumber(selected.qtySold)}</p>
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
                          <th className="px-2 py-2 font-medium text-right md:px-4">Qty</th>
                          <th className="px-2 py-2 font-medium text-right md:px-4">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedProductOrders.map((o) => (
                          <tr key={o.id} className="border-b border-border/50">
                            <td className="px-2 py-2.5 max-w-[90px] truncate font-medium md:px-4">{o.orderNumber}</td>
                            <td className="px-2 py-2.5 max-w-[90px] truncate text-muted-foreground md:px-4">{o.distributorName}</td>
                            <td className="px-2 py-2.5 text-right text-muted-foreground md:px-4">{formatNumber(o.qty)}</td>
                            <td className="px-2 py-2.5 text-right font-medium md:px-4">{formatCurrency(o.lineTotal)}</td>
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
        title="Export Product Report PDF"
        onGenerate={async (sel) => {
          const { ReportPdf } = await import("@/components/pdf/ReportPdf");
          downloadPdf(
            pdfFilename("product-report"),
            <ReportPdf
              companyName={companyInfo.name}
              companyAddress={companyInfo.address}
              gstin={companyInfo.gstin}
              logoUrl={companyInfo.logoUrl}
              title="Product Report"
              subtitle={periodLabel(period)}
              showCompany={sel.company}
              showSummary={sel.summary}
              showTable={sel.table}
              summary={[
                { label: "Revenue", value: formatCurrencyPdf(totalRevenue) },
                { label: "Units Sold", value: formatNumber(totalQty) },
              ]}
              columns={[
                { header: "Product", width: "35%" },
                { header: "SKU", width: "20%" },
                { header: "Qty Sold", width: "20%", align: "right" },
                { header: "Revenue", width: "25%", align: "right" },
              ]}
              rows={data.map((p) => [p.name, p.sku, formatNumber(p.qtySold), formatCurrencyPdf(p.revenue)])}
            />
          );
        }}
      />
    </div>
  );
}
