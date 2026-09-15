import { Document, Page, View, Text } from "@react-pdf/renderer";
import { PdfHeader } from "./PdfHeader";
import { PdfFooter } from "./PdfFooter";
import { pdfStyles as s, pdfInk } from "./PdfStyles";
import { formatMoneyPdf } from "@/utils/exportPdf";
import type { SalespersonScorecard, PerformanceHealth } from "@/utils/salespersonScorecard";

interface SalespersonStatementPdfProps {
  companyName: string;
  companyAddress?: string;
  gstin?: string;
  logoUrl?: string;
  salesperson: {
    name: string;
    phone: string;
    email: string;
    region: string;
  };
  scorecard: SalespersonScorecard;
  orders: Array<{
    orderNumber: string;
    date: string;
    distributorName: string;
    total: number;
    paymentStatus: string;
    schemeSavings: number;
  }>;
  health: PerformanceHealth;
}

const healthLabels: Record<PerformanceHealth, string> = {
  high: "High performer",
  medium: "Moderate",
  low: "Needs attention",
};
const healthColors: Record<PerformanceHealth, string> = { high: "#1F7A4C", medium: "#B45309", low: "#B42318" };
const statusColors: Record<string, string> = { paid: "#1F7A4C", partial: "#B45309" };

const MAX_ROWS = 40;

export function SalespersonStatementPdf({
  companyName,
  companyAddress,
  gstin,
  logoUrl,
  salesperson,
  scorecard,
  orders,
  health,
}: SalespersonStatementPdfProps) {
  const gross = orders.reduce((sum, o) => sum + o.total, 0);
  const savings = orders.reduce((sum, o) => sum + o.schemeSavings, 0);
  const effectiveTotal = gross - savings;
  const shown = orders.slice(0, MAX_ROWS);

  const metrics: Array<[string, string]> = [
    ["Orders (last 30 days)", String(scorecard.orders30d)],
    ["Orders (last 60 days)", String(scorecard.orders60d)],
    ["Orders (last 90 days)", String(scorecard.orders90d)],
    ["Average order value", formatMoneyPdf(scorecard.avgOrderValue)],
    ["Order frequency", `${scorecard.orderFrequency} / week`],
    ["Payment collection", `${scorecard.paymentCollectionEfficiency.toFixed(0)}%`],
    ["Days since last order", scorecard.daysSinceLastOrder !== null ? `${scorecard.daysSinceLastOrder} days` : "—"],
  ];

  return (
    <Document title={`Salesperson statement — ${salesperson.name}`} author={companyName}>
      <Page size="A4" style={s.page}>
        <PdfHeader
          companyName={companyName}
          companyAddress={companyAddress}
          gstin={gstin}
          logoUrl={logoUrl}
          title="Salesperson Statement"
          subtitle={salesperson.name}
        />

        <View style={s.infoRow}>
          <View style={s.billToBox}>
            <Text style={s.infoLabel}>Salesperson</Text>
            <Text style={s.infoValueBold}>{salesperson.name}</Text>
            {salesperson.region ? <Text style={s.infoValue}>Region: {salesperson.region}</Text> : null}
            {salesperson.phone ? <Text style={s.infoValue}>Phone: {salesperson.phone}</Text> : null}
            {salesperson.email ? <Text style={s.infoValue}>Email: {salesperson.email}</Text> : null}
          </View>
          <View style={s.orderMetaBox}>
            <Text style={s.infoLabel}>Summary</Text>
            <View style={s.metaRow}>
              <Text style={s.metaLabel}>Total revenue</Text>
              <Text style={s.metaValue}>{formatMoneyPdf(scorecard.totalRevenue)}</Text>
            </View>
            <View style={s.metaRow}>
              <Text style={s.metaLabel}>Orders</Text>
              <Text style={s.metaValue}>{orders.length}</Text>
            </View>
            <View style={s.metaRow}>
              <Text style={s.metaLabel}>Performance</Text>
              <Text style={[s.metaValue, { color: healthColors[health] }]}>{healthLabels[health]}</Text>
            </View>
          </View>
        </View>

        <Text style={s.sectionTitle}>Performance scorecard</Text>
        <View style={s.table}>
          <View style={s.tableHeader} fixed>
            <Text style={[s.tableHeaderCell, { width: "60%" }]}>Metric</Text>
            <Text style={[s.tableHeaderCell, { width: "40%", textAlign: "right" }]}>Value</Text>
          </View>
          {metrics.map(([lbl, value], i) => (
            <View key={lbl} style={i % 2 === 1 ? s.tableRowAlt : s.tableRow} wrap={false}>
              <Text style={[s.tableCell, { width: "60%" }]}>{lbl}</Text>
              <Text style={[s.tableCellRightBold, { width: "40%" }]}>{value}</Text>
            </View>
          ))}
        </View>

        <Text style={s.sectionTitle}>Order history ({orders.length})</Text>
        <View style={s.table}>
          <View style={s.tableHeader} fixed>
            <Text style={[s.tableHeaderCell, { width: "18%" }]}>Order</Text>
            <Text style={[s.tableHeaderCell, { width: "16%" }]}>Date</Text>
            <Text style={[s.tableHeaderCell, { width: "26%" }]}>Dealer</Text>
            <Text style={[s.tableHeaderCell, { width: "16%", textAlign: "right" }]}>Amount</Text>
            <Text style={[s.tableHeaderCell, { width: "14%", textAlign: "right" }]}>Savings</Text>
            <Text style={[s.tableHeaderCell, { width: "10%", textAlign: "right" }]}>Status</Text>
          </View>
          {shown.map((o, i) => (
            <View
              key={`${o.orderNumber}-${i}`}
              style={i % 2 === 1 ? s.tableRowAlt : s.tableRow}
              wrap={false}
              minPresenceAhead={24}
            >
              <Text style={[s.tableCell, { width: "18%" }]}>{o.orderNumber}</Text>
              <Text style={[s.tableCell, { width: "16%", color: pdfInk.INK_MUTED }]}>
                {new Date(o.date + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" })}
              </Text>
              <Text style={[s.tableCell, { width: "26%", color: pdfInk.INK_MUTED }]}>{o.distributorName}</Text>
              <Text style={[s.tableCellRight, { width: "16%" }]}>{formatMoneyPdf(o.total)}</Text>
              <Text style={[s.tableCellRight, { width: "14%", color: o.schemeSavings > 0 ? "#1F7A4C" : pdfInk.INK_SOFT }]}>
                {o.schemeSavings > 0 ? `-${formatMoneyPdf(o.schemeSavings)}` : "-"}
              </Text>
              <Text style={[s.tableCellRight, { width: "10%", color: statusColors[o.paymentStatus] || "#B42318" }]}>
                {o.paymentStatus.charAt(0).toUpperCase() + o.paymentStatus.slice(1)}
              </Text>
            </View>
          ))}
          {orders.length === 0 && (
            <View style={s.tableRow}>
              <Text style={[s.tableCell, { width: "100%", textAlign: "center", color: pdfInk.INK_SOFT }]}>
                No orders yet
              </Text>
            </View>
          )}
          {orders.length > MAX_ROWS && (
            <View style={s.tableRow}>
              <Text style={[s.tableCell, { width: "100%", textAlign: "center", color: pdfInk.INK_SOFT }]}>
                Showing the {MAX_ROWS} most recent of {orders.length} orders
              </Text>
            </View>
          )}
        </View>

        {orders.length > 0 && (
          <View style={s.totalsContainer} wrap={false}>
            <View style={s.totalsBox}>
              <View style={s.totalsRow}>
                <Text style={s.totalsLabel}>Gross order value</Text>
                <Text style={s.totalsValue}>{formatMoneyPdf(gross)}</Text>
              </View>
              {savings > 0 && (
                <View style={s.totalsRow}>
                  <Text style={[s.totalsLabel, { color: "#1F7A4C" }]}>Scheme savings</Text>
                  <Text style={[s.totalsValue, { color: "#1F7A4C" }]}>-{formatMoneyPdf(savings)}</Text>
                </View>
              )}
              <View style={s.totalsRowBorder}>
                <Text style={s.totalsFinalLabel}>Effective total</Text>
                <Text style={s.totalsFinalValue}>{formatMoneyPdf(effectiveTotal)}</Text>
              </View>
            </View>
          </View>
        )}

        <PdfFooter />
      </Page>
    </Document>
  );
}
