import { Document, Page, View, Text } from "@react-pdf/renderer";
import { PdfHeader } from "./PdfHeader";
import { PdfFooter } from "./PdfFooter";
import { pdfStyles as s } from "./PdfStyles";
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

const fmt = (n: number) => `Rs. ${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n)}`;

const riskLabels: Record<ChurnRisk, string> = { low: "Low", medium: "Medium", high: "High" };
const riskColors: Record<ChurnRisk, string> = { low: "#16a34a", medium: "#d97706", high: "#dc2626" };

export function DealerStatementPdf({
  companyName,
  companyAddress,
  gstin,
  logoUrl,
  dealer,
  scorecard,
  orders,
}: DealerStatementPdfProps) {
  const effectiveTotal = orders.reduce((s, o) => s + o.total - o.schemeSavings, 0);

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <PdfHeader
          companyName={companyName}
          companyAddress={companyAddress}
          gstin={gstin}
          logoUrl={logoUrl}
          title="Dealer Statement"
          subtitle={dealer.name}
        />

        {/* Dealer Info */}
        <View style={{ flexDirection: "row", marginBottom: 14, gap: 16 }}>
          <View style={{ flex: 1, backgroundColor: "#f8fafc", padding: 10, borderRadius: 4, border: "1pt solid #e2e8f0" }}>
            <Text style={{ fontSize: 8, color: "#64748b", marginBottom: 4 }}>DEALER DETAILS</Text>
            <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", marginBottom: 2 }}>{dealer.name}</Text>
            {dealer.location ? <Text style={{ fontSize: 9, color: "#475569" }}>{dealer.location}</Text> : null}
            {dealer.contact ? <Text style={{ fontSize: 9, color: "#475569" }}>{dealer.contact}</Text> : null}
          </View>
          <View style={{ flex: 1, backgroundColor: "#f8fafc", padding: 10, borderRadius: 4, border: "1pt solid #e2e8f0" }}>
            <Text style={{ fontSize: 8, color: "#64748b", marginBottom: 4 }}>CREDIT STATUS</Text>
            <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", marginBottom: 2 }}>
              Outstanding: {fmt(dealer.outstandingAmount)}
            </Text>
            <Text style={{ fontSize: 9, color: "#475569" }}>
              Credit Limit: {dealer.creditLimit > 0 ? fmt(dealer.creditLimit) : "Unlimited"}
            </Text>
          </View>
        </View>

        {/* Performance Scorecard */}
        <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", marginBottom: 6, color: "#1e293b" }}>
          PERFORMANCE SCORECARD
        </Text>
        <View style={{ border: "1pt solid #e2e8f0", borderRadius: 4, marginBottom: 14 }}>
          {/* Header */}
          <View style={{ flexDirection: "row", backgroundColor: "#f1f5f9", padding: 6, borderBottom: "1pt solid #e2e8f0" }}>
            <Text style={{ flex: 1, fontSize: 8, fontFamily: "Helvetica-Bold", color: "#475569" }}>Metric</Text>
            <Text style={{ flex: 1, fontSize: 8, fontFamily: "Helvetica-Bold", color: "#475569", textAlign: "right" }}>Value</Text>
          </View>
          {[
            ["Orders (Last 30 Days)", String(scorecard.orders30d)],
            ["Orders (Last 60 Days)", String(scorecard.orders60d)],
            ["Orders (Last 90 Days)", String(scorecard.orders90d)],
            ["Average Order Value", fmt(scorecard.avgOrderValue)],
            ["Payment Timeliness", `${scorecard.paymentTimeliness.toFixed(0)}%`],
            ["Days Since Last Order", scorecard.daysSinceLastOrder !== null ? `${scorecard.daysSinceLastOrder} days` : "N/A"],
          ].map(([label, value], i) => (
            <View key={i} style={{ flexDirection: "row", padding: 6, borderBottom: "0.5pt solid #e2e8f0", backgroundColor: i % 2 === 0 ? "#ffffff" : "#fafafa" }}>
              <Text style={{ flex: 1, fontSize: 9, color: "#334155" }}>{label}</Text>
              <Text style={{ flex: 1, fontSize: 9, fontFamily: "Helvetica-Bold", color: "#1e293b", textAlign: "right" }}>{value}</Text>
            </View>
          ))}
          {/* Churn Risk Row */}
          <View style={{ flexDirection: "row", padding: 6, backgroundColor: "#ffffff" }}>
            <Text style={{ flex: 1, fontSize: 9, fontFamily: "Helvetica-Bold", color: "#334155" }}>Churn Risk</Text>
            <Text style={{ flex: 1, fontSize: 9, fontFamily: "Helvetica-Bold", color: riskColors[scorecard.churnRisk], textAlign: "right" }}>
              {riskLabels[scorecard.churnRisk]}
            </Text>
          </View>
        </View>

        {/* Order History */}
        <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", marginBottom: 6, color: "#1e293b" }}>
          ORDER HISTORY ({orders.length} orders)
        </Text>
        {orders.length > 0 ? (
          <View style={{ border: "1pt solid #e2e8f0", borderRadius: 4 }}>
            <View style={{ flexDirection: "row", backgroundColor: "#f1f5f9", padding: 6, borderBottom: "1pt solid #e2e8f0" }}>
              <Text style={{ width: "20%", fontSize: 8, fontFamily: "Helvetica-Bold", color: "#475569" }}>Order #</Text>
              <Text style={{ width: "20%", fontSize: 8, fontFamily: "Helvetica-Bold", color: "#475569" }}>Date</Text>
              <Text style={{ width: "20%", fontSize: 8, fontFamily: "Helvetica-Bold", color: "#475569", textAlign: "right" }}>Amount</Text>
              <Text style={{ width: "20%", fontSize: 8, fontFamily: "Helvetica-Bold", color: "#475569", textAlign: "right" }}>Savings</Text>
              <Text style={{ width: "20%", fontSize: 8, fontFamily: "Helvetica-Bold", color: "#475569", textAlign: "right" }}>Status</Text>
            </View>
            {orders.slice(0, 30).map((o, i) => (
              <View key={i} style={{ flexDirection: "row", padding: 6, borderBottom: "0.5pt solid #e2e8f0", backgroundColor: i % 2 === 0 ? "#ffffff" : "#fafafa" }}>
                <Text style={{ width: "20%", fontSize: 8, color: "#1e293b" }}>{o.orderNumber}</Text>
                <Text style={{ width: "20%", fontSize: 8, color: "#475569" }}>
                  {new Date(o.date + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                </Text>
                <Text style={{ width: "20%", fontSize: 8, color: "#1e293b", textAlign: "right" }}>{fmt(o.total)}</Text>
                <Text style={{ width: "20%", fontSize: 8, color: o.schemeSavings > 0 ? "#16a34a" : "#94a3b8", textAlign: "right" }}>
                  {o.schemeSavings > 0 ? `-${fmt(o.schemeSavings)}` : "—"}
                </Text>
                <Text style={{ width: "20%", fontSize: 8, textAlign: "right", color: o.paymentStatus === "paid" ? "#16a34a" : o.paymentStatus === "partial" ? "#d97706" : "#dc2626" }}>
                  {o.paymentStatus.charAt(0).toUpperCase() + o.paymentStatus.slice(1)}
                </Text>
              </View>
            ))}
            {orders.length > 30 && (
              <View style={{ padding: 6 }}>
                <Text style={{ fontSize: 8, color: "#94a3b8", textAlign: "center" }}>
                  ... and {orders.length - 30} more orders
                </Text>
              </View>
            )}
          </View>
        ) : (
          <Text style={{ fontSize: 9, color: "#94a3b8" }}>No orders found</Text>
        )}

        {/* Summary */}
        {orders.length > 0 && (
          <View style={{ marginTop: 12, alignItems: "flex-end" }}>
            <View style={{ width: 200, border: "1pt solid #e2e8f0", borderRadius: 4, padding: 8 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                <Text style={{ fontSize: 9, color: "#475569" }}>Gross Total</Text>
                <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold" }}>{fmt(orders.reduce((s, o) => s + o.total, 0))}</Text>
              </View>
              {orders.some(o => o.schemeSavings > 0) && (
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                  <Text style={{ fontSize: 9, color: "#16a34a" }}>Scheme Savings</Text>
                  <Text style={{ fontSize: 9, color: "#16a34a" }}>-{fmt(orders.reduce((s, o) => s + o.schemeSavings, 0))}</Text>
                </View>
              )}
              <View style={{ borderTop: "1pt solid #e2e8f0", paddingTop: 4, flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold" }}>Effective Total</Text>
                <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold" }}>{fmt(effectiveTotal)}</Text>
              </View>
            </View>
          </View>
        )}

        <PdfFooter />
      </Page>
    </Document>
  );
}
