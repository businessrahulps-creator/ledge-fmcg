import { Document, Page, View, Text } from "@react-pdf/renderer";
import { pdfStyles as s } from "./PdfStyles";
import { PdfHeader } from "./PdfHeader";
import { PdfFooter } from "./PdfFooter";

export interface PdfColumn {
  header: string;
  width: string; // e.g. "30%"
  align?: "left" | "right";
}

export interface PdfSummaryItem {
  label: string;
  value: string;
}

interface ReportPdfProps {
  title: string;
  subtitle?: string;
  columns: PdfColumn[];
  rows: string[][];
  summary?: PdfSummaryItem[];
  showCompany?: boolean;
  showSummary?: boolean;
  showTable?: boolean;
  companyName?: string;
  companyAddress?: string;
  gstin?: string;
}

export function ReportPdf({
  title,
  subtitle,
  columns,
  rows,
  summary = [],
  showCompany = true,
  showSummary = true,
  showTable = true,
  companyName,
  companyAddress,
  gstin,
}: ReportPdfProps) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <PdfHeader
          title={title}
          subtitle={subtitle}
          showCompany={showCompany}
          companyName={companyName}
          companyAddress={companyAddress}
          gstin={gstin}
        />

        {showSummary && summary.length > 0 && (
          <View style={s.summaryRow}>
            {summary.map((item, i) => (
              <View key={i} style={s.summaryCard}>
                <Text style={s.summaryLabel}>{item.label}</Text>
                <Text style={s.summaryValue}>{item.value}</Text>
              </View>
            ))}
          </View>
        )}

        {showTable && (
          <View style={s.table}>
            <View style={s.tableHeader}>
              {columns.map((col, i) => (
                <Text
                  key={i}
                  style={[
                    s.tableHeaderCell,
                    { width: col.width, textAlign: col.align || "left" },
                  ]}
                >
                  {col.header}
                </Text>
              ))}
            </View>
            {rows.map((row, ri) => (
              <View key={ri} style={ri % 2 === 1 ? s.tableRowAlt : s.tableRow} wrap={false}>
                {row.map((cell, ci) => (
                  <Text
                    key={ci}
                    style={[
                      columns[ci]?.align === "right" ? s.tableCellRight : s.tableCell,
                      { width: columns[ci]?.width || "auto" },
                    ]}
                  >
                    {cell}
                  </Text>
                ))}
              </View>
            ))}
            {rows.length === 0 && (
              <View style={s.tableRow}>
                <Text style={[s.tableCell, { width: "100%", textAlign: "center", color: "#999" }]}>
                  No data
                </Text>
              </View>
            )}
          </View>
        )}

        <PdfFooter />
      </Page>
    </Document>
  );
}
