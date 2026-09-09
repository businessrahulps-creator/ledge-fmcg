import { Document, Page, Text, View } from "@react-pdf/renderer";
import { pdfStyles as s } from "./PdfStyles";
import { PdfHeader } from "./PdfHeader";
import { PdfFooter } from "./PdfFooter";
import { formatCurrencyPdf } from "@/utils/exportPdf";
import { numberToWords } from "@/utils/numberToWords";

const docTypeLabels: Record<string, string> = {
  gst_invoice: "Tax Invoice",
  invoice: "Invoice",
  estimate: "Estimate",
  proforma: "Proforma Invoice",
  credit_note: "Credit Note",
};

export interface InvoicePdfData {
  docType: string;
  invoiceNumber: string;
  invoiceDate: string;
  buyerName: string;
  buyerAddress: string;
  buyerGstin: string;
  buyerStateCode: string;
  sellerName: string;
  sellerAddress: string;
  sellerGstin: string;
  sellerPan: string;
  sellerStateCode: string;
  sellerPhone: string;
  sellerEmail: string;
  sellerBankName: string;
  sellerBankAccountName?: string;
  sellerBankAccount: string;
  sellerBankIfsc: string;
  supplyType: string;
  gstRate: number;
  vehicle: string;
  driverName: string;
  lines: {
    productName: string;
    hsnCode: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    taxableValue: number;
    gstRate?: number | null;
    lineTotal?: number | null;
  }[];
  subtotal: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTax: number;
  grandTotal: number;
  roundOff: number;
  amountInWords: string;
  notes: string;
}

export function GstInvoicePdf({ data }: { data: InvoicePdfData }) {
  const isGst = data.docType === "gst_invoice" || data.docType === "credit_note";
  const isIntraState = data.supplyType === "intra_state";
  const lineRates = Array.from(new Set(
    data.lines.map(l => (l.gstRate ?? null)).filter((r): r is number => r !== null)
  ));
  const mixedRates = lineRates.length > 1;
  const headerRate = lineRates.length === 1 ? lineRates[0] : data.gstRate;
  const halfRate = Math.round((headerRate / 2) * 100) / 100;

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <PdfHeader
          title={docTypeLabels[data.docType] || "Invoice"}
          subtitle={data.invoiceNumber}
          companyName={data.sellerName || "Company Name"}
          companyAddress={data.sellerAddress}
          gstin={data.sellerGstin}
        />

        {/* Seller / Buyer */}
        <View style={s.infoRow}>
          <View style={s.billToBox}>
            <Text style={s.infoLabel}>Bill From</Text>
            <Text style={s.infoValueBold}>{data.sellerName}</Text>
            {data.sellerAddress ? <Text style={s.infoValue}>{data.sellerAddress}</Text> : null}
            {data.sellerGstin ? <Text style={s.infoValue}>GSTIN: {data.sellerGstin}</Text> : null}
            {data.sellerPan ? <Text style={s.infoValue}>PAN: {data.sellerPan}</Text> : null}
            {data.sellerStateCode ? <Text style={s.infoValue}>State Code: {data.sellerStateCode}</Text> : null}
            {data.sellerPhone ? <Text style={s.infoValue}>Phone: {data.sellerPhone}</Text> : null}
            {data.sellerEmail ? <Text style={s.infoValue}>Email: {data.sellerEmail}</Text> : null}
          </View>
          <View style={s.orderMetaBox}>
            <Text style={s.infoLabel}>Bill To</Text>
            <Text style={s.infoValueBold}>{data.buyerName}</Text>
            {data.buyerAddress ? <Text style={s.infoValue}>{data.buyerAddress}</Text> : null}
            {data.buyerGstin ? <Text style={s.infoValue}>GSTIN: {data.buyerGstin}</Text> : null}
            {data.buyerStateCode ? <Text style={s.infoValue}>State Code: {data.buyerStateCode}</Text> : null}
            <View style={{ marginTop: 6 }}>
              <Text style={s.infoLabel}>Invoice Details</Text>
              <View style={s.metaRow}>
                <Text style={s.metaLabel}>Date</Text>
                <Text style={s.metaValue}>{data.invoiceDate}</Text>
              </View>
              <View style={s.metaRow}>
                <Text style={s.metaLabel}>Supply Type</Text>
                <Text style={s.metaValue}>{isIntraState ? "Intra-State" : "Inter-State"}</Text>
              </View>
              {isGst && (
                <View style={s.metaRow}>
                  <Text style={s.metaLabel}>GST Rate</Text>
                  <Text style={s.metaValue}>{mixedRates ? "Multiple (see line items)" : `${headerRate}%`}</Text>
                </View>
              )}
              {data.vehicle ? (
                <View style={s.metaRow}>
                  <Text style={s.metaLabel}>Vehicle</Text>
                  <Text style={s.metaValue}>{data.vehicle}</Text>
                </View>
              ) : null}
              {data.driverName ? (
                <View style={s.metaRow}>
                  <Text style={s.metaLabel}>Driver</Text>
                  <Text style={s.metaValue}>{data.driverName}</Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        {/* Line Items Table */}
        <Text style={s.sectionTitle}>Line Items</Text>
        <View style={s.table}>
          <View style={s.tableHeader}>
            <Text style={[s.tableHeaderCell, { width: "5%" }]}>#</Text>
            <Text style={[s.tableHeaderCell, { width: isGst ? "24%" : "40%" }]}>Item</Text>
            {isGst && <Text style={[s.tableHeaderCell, { width: "10%" }]}>HSN</Text>}
            <Text style={[s.tableHeaderCell, { width: "8%", textAlign: "right" }]}>Qty</Text>
            <Text style={[s.tableHeaderCell, { width: "8%" }]}>Unit</Text>
            <Text style={[s.tableHeaderCell, { width: isGst ? "13%" : "14%", textAlign: "right" }]}>Rate</Text>
            {isGst && <Text style={[s.tableHeaderCell, { width: "7%", textAlign: "right" }]}>GST%</Text>}
            <Text style={[s.tableHeaderCell, { width: isGst ? "12%" : "15%", textAlign: "right" }]}>Taxable</Text>
            <Text style={[s.tableHeaderCell, { width: "13%", textAlign: "right" }]}>Amount</Text>
          </View>
          {data.lines.map((line, i) => (
            <View key={i} style={i % 2 === 1 ? s.tableRowAlt : s.tableRow} wrap={false}>
              <Text style={[s.tableCell, { width: "5%" }]}>{i + 1}</Text>
              <Text style={[s.tableCellBold, { width: isGst ? "24%" : "40%" }]}>{line.productName}</Text>
              {isGst && <Text style={[s.tableCell, { width: "10%" }]}>{line.hsnCode || "-"}</Text>}
              <Text style={[s.tableCellRight, { width: "8%" }]}>{line.quantity}</Text>
              <Text style={[s.tableCell, { width: "8%" }]}>{line.unit}</Text>
              <Text style={[s.tableCellRight, { width: isGst ? "13%" : "14%" }]}>{formatCurrencyPdf(line.unitPrice)}</Text>
              {isGst && <Text style={[s.tableCellRight, { width: "7%" }]}>{line.gstRate != null ? `${line.gstRate}%` : "-"}</Text>}
              <Text style={[s.tableCellRight, { width: isGst ? "12%" : "15%" }]}>{formatCurrencyPdf(line.taxableValue)}</Text>
              <Text style={[s.tableCellRightBold, { width: "13%" }]}>{formatCurrencyPdf(line.lineTotal ?? line.taxableValue)}</Text>
            </View>
          ))}
        </View>

        {/* Totals box — right-aligned */}
        <View style={s.totalsContainer}>
          <View style={s.totalsBox}>
            <View style={s.totalsRow}>
              <Text style={s.totalsLabel}>Subtotal</Text>
              <Text style={s.totalsValue}>{formatCurrencyPdf(data.subtotal)}</Text>
            </View>

            {isGst && isIntraState && (
              <>
                <View style={s.totalsRow}>
                  <Text style={s.totalsLabel}>{mixedRates ? "CGST" : `CGST @ ${halfRate}%`}</Text>
                  <Text style={s.totalsValue}>{formatCurrencyPdf(data.cgstAmount)}</Text>
                </View>
                <View style={s.totalsRow}>
                  <Text style={s.totalsLabel}>{mixedRates ? "SGST" : `SGST @ ${halfRate}%`}</Text>
                  <Text style={s.totalsValue}>{formatCurrencyPdf(data.sgstAmount)}</Text>
                </View>
              </>
            )}

            {isGst && !isIntraState && (
              <View style={s.totalsRow}>
                <Text style={s.totalsLabel}>{mixedRates ? "IGST" : `IGST @ ${headerRate}%`}</Text>
                <Text style={s.totalsValue}>{formatCurrencyPdf(data.igstAmount)}</Text>
              </View>
            )}

            {isGst && (
              <View style={s.totalsRow}>
                <Text style={s.totalsLabel}>Total Tax</Text>
                <Text style={s.totalsValue}>{formatCurrencyPdf(data.totalTax)}</Text>
              </View>
            )}

            {data.roundOff !== 0 && (
              <View style={s.totalsRow}>
                <Text style={s.totalsLabel}>Round Off</Text>
                <Text style={s.totalsValue}>{data.roundOff > 0 ? "+" : ""}{data.roundOff.toFixed(2)}</Text>
              </View>
            )}

            <View style={s.totalsRowBorder}>
              <Text style={s.totalsFinalLabel}>Grand Total</Text>
              <Text style={s.totalsFinalValue}>{formatCurrencyPdf(data.grandTotal)}</Text>
            </View>
          </View>
        </View>

        {/* Amount in Words */}
        <View style={{ marginTop: 12, padding: 8, backgroundColor: "#FAFAFA" }}>
          <Text style={s.infoLabel}>Amount in Words</Text>
          <Text style={s.infoValueBold}>{data.amountInWords}</Text>
        </View>

        {/* Bank Details */}
        {(data.sellerBankName || data.sellerBankAccount) && (
          <View style={{ marginTop: 12 }}>
            <Text style={s.sectionTitle}>Bank Details</Text>
            <View style={{ flexDirection: "row", gap: 12 }}>
              {data.sellerBankName && (
                <View style={s.summaryCard}>
                  <Text style={s.summaryLabel}>Bank</Text>
                  <Text style={{ fontSize: 9 }}>{data.sellerBankName}</Text>
                </View>
              )}
              {data.sellerBankAccountName && (
                <View style={s.summaryCard}>
                  <Text style={s.summaryLabel}>A/c Holder</Text>
                  <Text style={{ fontSize: 9 }}>{data.sellerBankAccountName}</Text>
                </View>
              )}
              {data.sellerBankAccount && (
                <View style={s.summaryCard}>
                  <Text style={s.summaryLabel}>Account No.</Text>
                  <Text style={{ fontSize: 9 }}>{data.sellerBankAccount}</Text>
                </View>
              )}
              {data.sellerBankIfsc && (
                <View style={s.summaryCard}>
                  <Text style={s.summaryLabel}>IFSC</Text>
                  <Text style={{ fontSize: 9 }}>{data.sellerBankIfsc}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Notes */}
        {data.notes && (
          <View style={{ marginTop: 10 }}>
            <Text style={s.infoLabel}>Notes</Text>
            <Text style={s.infoValue}>{data.notes}</Text>
          </View>
        )}

        <PdfFooter />
      </Page>
    </Document>
  );
}
