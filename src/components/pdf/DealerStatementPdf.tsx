import { Document, Page, View, Text } from "@react-pdf/renderer";
import { PdfHeader } from "./PdfHeader";
import { PdfFooter } from "./PdfFooter";
import { pdfStyles as s, pdfInk } from "./PdfStyles";
import { bold } from "./PdfFonts";
import { formatMoneyPdf } from "@/utils/exportPdf";
import type { DealerScorecard, ChurnRisk } from "@/utils/dealerScorecard";

interface DealerStatementPdfProps {
  companyName: string;
  companyAddress?: string;
  gstin?: string;
  logoUrl?: string;
  dealer: {
    name: string;
    location: string;
    contact: string;
    creditLimit: number;
    outstandingAmount: number;
  };
  scorecard: DealerScorecard;
  orders: Array<{
    orderNumber: string;
    date: string;
    total: number;
    paymentStatus: string;
    schemeSavings: number;
  }>;
}

const riskLabels: Record<ChurnRisk, string> = { low: "Low", medium: "Medium", high: "High" };
const riskColors: Record<ChurnRisk, string> = { low: "#1F7A4C", medium: "#B45309", high: "#B42318" };
const statusColors: Record<string, string> = { paid: "#1F7A4C", partial: "#B45309" };

const MAX_ROWS = 40;

export function DealerStatementPdf({
  companyName,
  companyAddress,
  gstin,
  logoUrl,
  dealer,
  scorecard,
  orders,
}: DealerStatementPdfProps) {
  const gross = orders.reduce((sum, o) => sum + o.total, 0);
  const savings = orders.reduce((sum, o) => sum + o.schemeSavings, 0);
  const effectiveTotal = gross - savings;
  const shown = orders.slice(0, MAX_ROWS);

  const metrics: Array<[string, string]> = [
    ["Orders (last 30 days)", String(scorecard.orders30d)],
    ["Orders (last 60 days)", String(scorecard.orders60d)],
    ["Orders (last 90 days)", String(scorecard.orders90d)],
    ["Average order value", formatMoneyPdf(scorecard.avgOrderValue)],
    ["Payment timeliness", `${scorecard.paymentTimeliness.toFixed(0)}%`],
    ["Days since last order", scorecard.daysSinceLastOrder !== null ? `${scorecard.daysSinceLastOrder} days` : "—"],
  ];

  return (
    <Document title={`Dealer statement — ${dealer.name}`} author={companyName}>
      <Page size="A4" style={s.page}>
        <PdfHeader
          companyName={companyName}
          companyAddress={companyAddress}
          gstin={gstin}
          logoUrl={logoUrl}
          title="Dealer Statement"
          subtitle={dealer.name}
        />

        {/* Dealer + credit */}
        <View style={s.infoRow}>
          <View style={s.billToBox}>
            <Text style={s.infoLabel}>Dealer</Text>
            <Text style={s.infoValueBold}>{dealer.name}</Text>
            {dealer.location ? <Text style={s.infoValue}>{dealer.location}</Text> : null}
            {dealer.contact ? <Text style={s.infoValue}>{dealer.contact}</Text> : null}
          </View>
          <View style={s.orderMetaBox}>
            <Text style={s.infoLabel}>Credit status</Text>
            <View style={s.metaRow}>
              <Text style={s.metaLabel}>Outstanding</Text>
              <Text style={s.metaValue}>{formatMoneyPdf(dealer.outstandingAmount)}</Text>
            </View>
            <View style={s.metaRow}>
              <Text style={s.metaLabel}>Credit limit</Text>
              <Text style={s.metaValue}>
                {dealer.creditLimit > 0 ? formatMoneyPdf(dealer.creditLimit) : "Unlimited"}
              </Text>
            </View>
            <View style={s.metaRow}>
              <Text style={s.metaLabel}>Churn risk</Text>
              <Text style={[s.metaValue, { color: riskColors[scorecard.churnRisk] }]}>
                {riskLabels[scorecard.churnRisk]}
              </Text>
            </View>
          </View>
        </View>

        {/* Scorecard */}
        <Text style={s.sectionTitle} minPresenceAhead={60}>Performance scorecard</Text>
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

        {/* Order history */}
        <Text style={s.sectionTitle} minPresenceAhead={60}>Order history ({orders.length})</Text>
        <View style={s.table}>
          <View style={s.tableHeader} fixed>
            <Text style={[s.tableHeaderCell, { width: "24%" }]}>Order</Text>
            <Text style={[s.tableHeaderCell, { width: "20%" }]}>Date</Text>
            <Text style={[s.tableHeaderCell, { width: "20%", textAlign: "right" }]}>Amount</Text>
            <Text style={[s.tableHeaderCell, { width: "20%", textAlign: "right" }]}>Savings</Text>
            <Text style={[s.tableHeaderCell, { width: "16%", textAlign: "right" }]}>Status</Text>
          </View>
          {shown.map((o, i) => (
            <View
              key={`${o.orderNumber}-${i}`}
              style={i % 2 === 1 ? s.tableRowAlt : s.tableRow}
              wrap={false}
              minPresenceAhead={24}
            >
              <Text style={[s.tableCell, { width: "24%" }]}>{o.orderNumber}</Text>
              <Text style={[s.tableCell, { width: "20%", color: pdfInk.INK_MUTED }]}>
                {new Date(o.date + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
              </Text>
              <Text style={[s.tableCellRight, { width: "20%" }]}>{formatMoneyPdf(o.total)}</Text>
              <Text style={[s.tableCellRight, { width: "20%", color: o.schemeSavings > 0 ? "#1F7A4C" : pdfInk.INK_SOFT }]}>
                {o.schemeSavings > 0 ? `-${formatMoneyPdf(o.schemeSavings)}` : "-"}
              </Text>
              <Text style={[s.tableCellRight, { width: "16%", color: statusColors[o.paymentStatus] || "#B42318" }]}>
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

        {/* Totals */}
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

        <Text style={[s.infoValue, { marginTop: 10, ...bold, color: pdfInk.INK_SOFT, fontSize: 7 }]}>
          Order value is shown before GST. Tax invoices carry the final payable amount.
        </Text>

        <PdfFooter />
      </Page>
    </Document>
  );
}
