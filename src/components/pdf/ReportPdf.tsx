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

export interface PdfSectionBlock {
  name?: string;
  rows: string[][];
  /** Subtotal row printed under this section. */
  subtotal?: string[];
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
  logoUrl?: string;
  /** "Period · filters · Made by …" line under the title. */
  meta?: string;
  /** Grouped rows; when set, replaces `rows`. */
  sections?: PdfSectionBlock[];
  /** Grand total row (bold). */
  totalsRow?: string[];
  /** Plain closing sentence under the table. */
  note?: string;
  orientation?: "portrait" | "landscape";
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
  logoUrl,
  meta,
  sections,
  totalsRow,
  note,
  orientation = "portrait",
}: ReportPdfProps) {
  const blocks: PdfSectionBlock[] = sections ?? [{ rows }];
  const boldRow = (cells: string[], key: string, label?: boolean) => (
    <View key={key} style={[s.tableRow, { borderTop: "0.75pt solid #1A1A1A" }]} wrap={false}>
      {cells.map((cell, ci) => (
        <Text key={ci} style={[columns[ci]?.align === "right" ? s.tableCellRightBold : s.tableCellBold, { width: columns[ci]?.width || "auto" }]}>
          {ci === 0 && label && !cell ? "Total" : cell}
        </Text>
      ))}
    </View>
  );
  return (
    <Document title={title} author={companyName || "Ledge"}>
      <Page size="A4" orientation={orientation} style={s.page}>
        <PdfHeader
          title={title}
          subtitle={subtitle}
          showCompany={showCompany}
          companyName={companyName}
          companyAddress={companyAddress}
          gstin={gstin}
          logoUrl={logoUrl}
        />

        {showSummary && summary.length > 0 && (
          <View style={s.summaryRow} wrap={false}>
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
            <View style={s.tableHeader} fixed>
              {columns.map((col, i) => (
                <Text
                  key={i}
                  style={[
                    s.tableHeaderCell,
                    {
                      width: col.width,
                      textAlign: col.align || "left",
                      paddingRight: 8,
                      paddingLeft: col.align === "right" ? 6 : 0,
                    },
                  ]}
                >
                  {col.header}
                </Text>
              ))}
            </View>
            {rows.map((row, ri) => (
              <View
                key={ri}
                style={ri % 2 === 1 ? s.tableRowAlt : s.tableRow}
                wrap={false}
                minPresenceAhead={24}
              >
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
                <Text style={[s.tableCell, { width: "100%", textAlign: "center", color: "#8A93A3" }]}>
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
