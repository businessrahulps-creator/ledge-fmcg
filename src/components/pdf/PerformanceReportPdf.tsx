import { Document, Page, View, Text } from "@react-pdf/renderer";
import { pdfStyles as s } from "./PdfStyles";
import { PdfHeader } from "./PdfHeader";
import { PdfFooter } from "./PdfFooter";
import { formatCurrencyPdf } from "@/utils/exportPdf";

/* ── hex colours (PDF Views can't use CSS vars) ── */
const C = {
  primary: "#1e3a5f",
  success: "#16a34a",
  warning: "#d97706",
  destructive: "#dc2626",
  muted: "#e5e7eb",
  labelText: "#666",
  barBg: "#f3f4f6",
};

/* ── shared tiny styles ── */
const label = { fontSize: 7, color: C.labelText } as const;
const sectionGap = { marginTop: 18 } as const;

/* ── types ── */
export interface PerformancePdfData {
  summary: { label: string; value: string }[];
  revenueTrend: { date: string; revenue: number }[];
  paymentSplit: { name: string; value: number; status: string }[];
  topDealers: { name: string; revenue: number }[];
  productVelocity: { name: string; qty: number }[];
  salesRanking: { name: string; revenue: number }[];
}

interface Props {
  title: string;
  subtitle?: string;
  companyName?: string;
  companyAddress?: string;
  gstin?: string;
  logoUrl?: string;
  show: Record<string, boolean>;
  data: PerformancePdfData;
}

/* ── horizontal bar row ── */
function HBar({
  label: lbl,
  value,
  pct,
  color = C.primary,
}: {
  label: string;
  value: string;
  pct: number;
  color?: string;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 5 }}>
      <Text style={{ fontSize: 8, width: "35%" }}>
        {lbl}
      </Text>
      <View style={{ flex: 1, height: 10, backgroundColor: C.barBg, borderRadius: 2 }}>
        <View
          style={{
            width: `${Math.max(pct, 2)}%`,
            height: 10,
            backgroundColor: color,
            borderRadius: 2,
          }}
        />
      </View>
      <Text style={{ fontSize: 8, width: "22%", textAlign: "right" }}>{value}</Text>
    </View>
  );
}

export function PerformanceReportPdf({
  title,
  subtitle,
  companyName,
  companyAddress,
  gstin,
  logoUrl,
  show,
  data,
}: Props) {
  const maxRevTrend = Math.max(...data.revenueTrend.map((r) => r.revenue), 1);
  const maxDealer = Math.max(...data.topDealers.map((d) => d.revenue), 1);
  const maxProduct = Math.max(...data.productVelocity.map((p) => p.qty), 1);
  const maxSales = Math.max(...data.salesRanking.map((s) => s.revenue), 1);
  const totalPayment = data.paymentSplit.reduce((s, p) => s + p.value, 0) || 1;

  const paymentColor = (status: string) =>
    status === "paid" ? C.success : status === "partial" ? C.warning : C.destructive;

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <PdfHeader
          title={title}
          subtitle={subtitle}
          showCompany={!!show.company}
          companyName={companyName}
          companyAddress={companyAddress}
          gstin={gstin}
          logoUrl={logoUrl}
        />

        {/* KPI Summary */}
        {show.summary && data.summary.length > 0 && (
          <View style={s.summaryRow}>
            {data.summary.map((item, i) => (
              <View key={i} style={s.summaryCard}>
                <Text style={s.summaryLabel}>{item.label}</Text>
                <Text style={s.summaryValue}>{item.value}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Revenue Trend */}
        {show.revenueTrend && data.revenueTrend.length > 0 && (
          <View style={sectionGap}>
            <Text style={s.sectionTitle}>Revenue Trend</Text>
            {data.revenueTrend.map((d, i) => (
              <HBar
                key={i}
                label={d.date}
                value={formatCurrencyPdf(d.revenue)}
                pct={(d.revenue / maxRevTrend) * 100}
              />
            ))}
          </View>
        )}

        {/* Payment Split */}
        {show.paymentSplit && data.paymentSplit.length > 0 && (
          <View style={sectionGap}>
            <Text style={s.sectionTitle}>Payment Split</Text>
            {/* Stacked bar */}
            <View style={{ flexDirection: "row", height: 16, borderRadius: 3, overflow: "hidden", marginBottom: 6 }}>
              {data.paymentSplit.map((p, i) => (
                <View
                  key={i}
                  style={{
                    width: `${(p.value / totalPayment) * 100}%`,
                    backgroundColor: paymentColor(p.status),
                    height: 16,
                  }}
                />
              ))}
            </View>
            {/* Legend */}
            <View style={{ flexDirection: "row", gap: 14 }}>
              {data.paymentSplit.map((p, i) => (
                <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <View style={{ width: 8, height: 8, backgroundColor: paymentColor(p.status), borderRadius: 1 }} />
                  <Text style={label}>
                    {p.name} ({p.value})
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Top Dealers */}
        {show.dealers && data.topDealers.length > 0 && (
          <View style={sectionGap}>
            <Text style={s.sectionTitle}>Top Dealers</Text>
            {data.topDealers.map((d, i) => (
              <HBar
                key={i}
                label={`${i + 1}. ${d.name}`}
                value={formatCurrencyPdf(d.revenue)}
                pct={(d.revenue / maxDealer) * 100}
              />
            ))}
          </View>
        )}

        {/* Top Products */}
        {show.products && data.productVelocity.length > 0 && (
          <View style={sectionGap}>
            <Text style={s.sectionTitle}>Top Products</Text>
            {data.productVelocity.map((p, i) => (
              <HBar
                key={i}
                label={`${i + 1}. ${p.name}`}
                value={p.qty.toString()}
                pct={(p.qty / maxProduct) * 100}
              />
            ))}
          </View>
        )}

        {/* Sales Team */}
        {show.salesTeam && data.salesRanking.length > 0 && (
          <View style={sectionGap}>
            <Text style={s.sectionTitle}>Sales Team Ranking</Text>
            {data.salesRanking.map((sr, i) => (
              <HBar
                key={i}
                label={`${i + 1}. ${sr.name}`}
                value={formatCurrencyPdf(sr.revenue)}
                pct={(sr.revenue / maxSales) * 100}
              />
            ))}
          </View>
        )}

        <PdfFooter />
      </Page>
    </Document>
  );
}
