import { Document, Page, View, Text } from "@react-pdf/renderer";
import { pdfStyles as s } from "./PdfStyles";
import { PdfHeader } from "./PdfHeader";
import { PdfFooter } from "./PdfFooter";
import { formatCurrencyPdf } from "@/utils/exportPdf";

export interface CommandPdfKpi {
  label: string;
  value: string;
}

export interface CommandPdfSignal {
  label: string;
  message: string;
  tier: "destructive" | "warning" | "success" | "neutral";
  value?: string;
}

export interface CommandPdfLeaderRow {
  name: string;
  primary: string;
  secondary?: string;
}

export interface CommandPdfAging {
  b0: number;
  b31: number;
  b61: number;
  b90: number;
}

export interface CommandPdfPipelineRow {
  stage: string;
  count: number;
  value: number;
}

export interface CommandPdfTrendRow {
  label: string;
  actual: number;
  target: number;
}

export interface CommandPdfCreditRow {
  name: string;
  outstanding: number;
  limit: number;
  utilization: number;
}

export interface CommandPdfProps {
  companyName: string;
  companyAddress?: string;
  gstin?: string;
  logoUrl?: string;
  periodLabel: string;
  fromDate: string;
  toDate: string;
  kpis: CommandPdfKpi[];
  signals: CommandPdfSignal[];
  aging: CommandPdfAging;
  pipeline: CommandPdfPipelineRow[];
  trend: CommandPdfTrendRow[];
  topDealers: CommandPdfLeaderRow[];
  topSalespersons: CommandPdfLeaderRow[];
  topProducts: CommandPdfLeaderRow[];
  creditAtRisk: CommandPdfCreditRow[];
  showLeaderboards?: boolean;
}

const TIER_LABEL: Record<CommandPdfSignal["tier"], string> = {
  destructive: "HIGH",
  warning: "MED",
  success: "WIN",
  neutral: "INFO",
};

function SectionTitle({ children }: { children: string }) {
  return <Text style={s.sectionTitle}>{children}</Text>;
}

function EmptyRow({ cols, label = "No data" }: { cols: number; label?: string }) {
  return (
    <View style={s.tableRow}>
      <Text style={[s.tableCell, { width: "100%", textAlign: "center", color: "#999" }]}>{label}</Text>
    </View>
  );
}

export function CommandPdf({
  companyName,
  companyAddress,
  gstin,
  logoUrl,
  periodLabel,
  fromDate,
  toDate,
  kpis,
  signals,
  aging,
  pipeline,
  trend,
  topDealers,
  topSalespersons,
  topProducts,
  creditAtRisk,
  showLeaderboards = true,
}: CommandPdfProps) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <PdfHeader
          title="Command Snapshot"
          subtitle={`${periodLabel} · ${fromDate} – ${toDate}`}
          showCompany
          companyName={companyName}
          companyAddress={companyAddress}
          gstin={gstin}
          logoUrl={logoUrl}
        />

        {/* KPIs */}
        <SectionTitle>Key metrics</SectionTitle>
        <View style={[s.summaryRow, { flexWrap: "wrap", gap: 8 }]} wrap={false}>
          {kpis.map((k) => (
            <View key={k.label} style={[s.summaryCard, { minWidth: "30%" }]}>
              <Text style={s.summaryLabel}>{k.label}</Text>
              <Text style={s.summaryValue}>{k.value}</Text>
            </View>
          ))}
        </View>

        {/* Signals */}
        <SectionTitle>Signals ({signals.length})</SectionTitle>
        <View style={s.table}>
          <View style={s.tableHeader}>
            <Text style={[s.tableHeaderCell, { width: "12%" }]}>Tier</Text>
            <Text style={[s.tableHeaderCell, { width: "20%" }]}>Label</Text>
            <Text style={[s.tableHeaderCell, { width: "58%" }]}>Message</Text>
            <Text style={[s.tableHeaderCell, { width: "10%", textAlign: "right" }]}>Value</Text>
          </View>
          {signals.length === 0 ? (
            <EmptyRow cols={4} label="No active signals — all clear" />
          ) : (
            signals.map((sig, i) => (
              <View key={i} style={i % 2 === 1 ? s.tableRowAlt : s.tableRow} wrap={false}>
                <Text style={[s.tableCellBold, { width: "12%" }]}>{TIER_LABEL[sig.tier]}</Text>
                <Text style={[s.tableCell, { width: "20%" }]}>{sig.label}</Text>
                <Text style={[s.tableCell, { width: "58%" }]}>{sig.message}</Text>
                <Text style={[s.tableCellRightBold, { width: "10%" }]}>{sig.value ?? ""}</Text>
              </View>
            ))
          )}
        </View>

        {/* Aging */}
        <SectionTitle>Outstanding by age</SectionTitle>
        <View style={s.table}>
          <View style={s.tableHeader}>
            <Text style={[s.tableHeaderCell, { width: "25%" }]}>Bucket</Text>
            <Text style={[s.tableHeaderCell, { width: "75%", textAlign: "right" }]}>Amount</Text>
          </View>
          {[
            { l: "0–30 days", v: aging.b0 },
            { l: "31–60 days", v: aging.b31 },
            { l: "61–90 days", v: aging.b61 },
            { l: "90+ days", v: aging.b90 },
          ].map((r, i) => (
            <View key={r.l} style={i % 2 === 1 ? s.tableRowAlt : s.tableRow} wrap={false}>
              <Text style={[s.tableCell, { width: "25%" }]}>{r.l}</Text>
              <Text style={[s.tableCellRight, { width: "75%" }]}>{formatCurrencyPdf(r.v)}</Text>
            </View>
          ))}
        </View>

        {/* Pipeline */}
        <SectionTitle>Order pipeline</SectionTitle>
        <View style={s.table}>
          <View style={s.tableHeader}>
            <Text style={[s.tableHeaderCell, { width: "50%" }]}>Stage</Text>
            <Text style={[s.tableHeaderCell, { width: "20%", textAlign: "right" }]}>Orders</Text>
            <Text style={[s.tableHeaderCell, { width: "30%", textAlign: "right" }]}>Value</Text>
          </View>
          {pipeline.length === 0 ? (
            <EmptyRow cols={3} />
          ) : (
            pipeline.map((r, i) => (
              <View key={r.stage} style={i % 2 === 1 ? s.tableRowAlt : s.tableRow} wrap={false}>
                <Text style={[s.tableCell, { width: "50%" }]}>{r.stage}</Text>
                <Text style={[s.tableCellRight, { width: "20%" }]}>{String(r.count)}</Text>
                <Text style={[s.tableCellRight, { width: "30%" }]}>{formatCurrencyPdf(r.value)}</Text>
              </View>
            ))
          )}
        </View>

        <PdfFooter />
      </Page>

      <Page size="A4" style={s.page}>
        <PdfHeader
          title="Command Snapshot"
          subtitle={`${periodLabel} · ${fromDate} – ${toDate}`}
          showCompany
          companyName={companyName}
          companyAddress={companyAddress}
          gstin={gstin}
          logoUrl={logoUrl}
        />

        {/* Trend */}
        <SectionTitle>Revenue trend</SectionTitle>
        <View style={s.table}>
          <View style={s.tableHeader}>
            <Text style={[s.tableHeaderCell, { width: "34%" }]}>Bucket</Text>
            <Text style={[s.tableHeaderCell, { width: "33%", textAlign: "right" }]}>Actual</Text>
            <Text style={[s.tableHeaderCell, { width: "33%", textAlign: "right" }]}>Target</Text>
          </View>
          {trend.length === 0 ? (
            <EmptyRow cols={3} />
          ) : (
            trend.map((r, i) => (
              <View key={i} style={i % 2 === 1 ? s.tableRowAlt : s.tableRow} wrap={false}>
                <Text style={[s.tableCell, { width: "34%" }]}>{r.label}</Text>
                <Text style={[s.tableCellRight, { width: "33%" }]}>{formatCurrencyPdf(r.actual)}</Text>
                <Text style={[s.tableCellRight, { width: "33%" }]}>{formatCurrencyPdf(r.target)}</Text>
              </View>
            ))
          )}
        </View>

        {/* Credit at risk */}
        <SectionTitle>Credit at risk</SectionTitle>
        <View style={s.table}>
          <View style={s.tableHeader}>
            <Text style={[s.tableHeaderCell, { width: "40%" }]}>Dealer</Text>
            <Text style={[s.tableHeaderCell, { width: "25%", textAlign: "right" }]}>Outstanding</Text>
            <Text style={[s.tableHeaderCell, { width: "20%", textAlign: "right" }]}>Limit</Text>
            <Text style={[s.tableHeaderCell, { width: "15%", textAlign: "right" }]}>Util %</Text>
          </View>
          {creditAtRisk.length === 0 ? (
            <EmptyRow cols={4} label="No dealers over 90% utilization" />
          ) : (
            creditAtRisk.map((r, i) => (
              <View key={i} style={i % 2 === 1 ? s.tableRowAlt : s.tableRow} wrap={false}>
                <Text style={[s.tableCell, { width: "40%" }]}>{r.name}</Text>
                <Text style={[s.tableCellRight, { width: "25%" }]}>{formatCurrencyPdf(r.outstanding)}</Text>
                <Text style={[s.tableCellRight, { width: "20%" }]}>{formatCurrencyPdf(r.limit)}</Text>
                <Text style={[s.tableCellRightBold, { width: "15%" }]}>{Math.round(r.utilization * 100)}%</Text>
              </View>
            ))
          )}
        </View>

        {showLeaderboards && (
          <>
            <SectionTitle>Top dealers</SectionTitle>
            <LeaderTable rows={topDealers} primaryHeader="Revenue" />

            <SectionTitle>Top salespersons</SectionTitle>
            <LeaderTable rows={topSalespersons} primaryHeader="Revenue" secondaryHeader="vs Target" />

            <SectionTitle>Top products</SectionTitle>
            <LeaderTable rows={topProducts} primaryHeader="Revenue" secondaryHeader="Qty" />
          </>
        )}

        <PdfFooter />
      </Page>
    </Document>
  );
}

function LeaderTable({
  rows,
  primaryHeader,
  secondaryHeader,
}: {
  rows: CommandPdfLeaderRow[];
  primaryHeader: string;
  secondaryHeader?: string;
}) {
  const hasSecondary = !!secondaryHeader;
  return (
    <View style={s.table}>
      <View style={s.tableHeader}>
        <Text style={[s.tableHeaderCell, { width: "8%" }]}>#</Text>
        <Text style={[s.tableHeaderCell, { width: hasSecondary ? "47%" : "62%" }]}>Name</Text>
        <Text style={[s.tableHeaderCell, { width: hasSecondary ? "25%" : "30%", textAlign: "right" }]}>
          {primaryHeader}
        </Text>
        {hasSecondary && (
          <Text style={[s.tableHeaderCell, { width: "20%", textAlign: "right" }]}>{secondaryHeader}</Text>
        )}
      </View>
      {rows.length === 0 ? (
        <EmptyRow cols={hasSecondary ? 4 : 3} />
      ) : (
        rows.map((r, i) => (
          <View key={i} style={i % 2 === 1 ? s.tableRowAlt : s.tableRow} wrap={false}>
            <Text style={[s.tableCellBold, { width: "8%" }]}>{i + 1}</Text>
            <Text style={[s.tableCell, { width: hasSecondary ? "47%" : "62%" }]}>{r.name}</Text>
            <Text style={[s.tableCellRight, { width: hasSecondary ? "25%" : "30%" }]}>{r.primary}</Text>
            {hasSecondary && (
              <Text style={[s.tableCellRight, { width: "20%" }]}>{r.secondary ?? ""}</Text>
            )}
          </View>
        ))
      )}
    </View>
  );
}
