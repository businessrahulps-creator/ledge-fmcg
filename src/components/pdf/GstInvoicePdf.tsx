import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";
import { numberToWords } from "@/utils/numberToWords";

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 9, fontFamily: "Helvetica", color: "#1a1a1a" },
  header: { textAlign: "center", marginBottom: 12 },
  title: { fontSize: 14, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  subtitle: { fontSize: 8, color: "#666", marginBottom: 8 },
  docType: { fontSize: 11, fontFamily: "Helvetica-Bold", textAlign: "center", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  col: { width: "48%" },
  label: { fontSize: 7, color: "#888", textTransform: "uppercase", marginBottom: 1 },
  value: { fontSize: 9, marginBottom: 3 },
  bold: { fontFamily: "Helvetica-Bold" },
  divider: { borderBottomWidth: 0.5, borderBottomColor: "#ccc", marginVertical: 8 },
  thickDivider: { borderBottomWidth: 1, borderBottomColor: "#333", marginVertical: 8 },
  tableHeader: { flexDirection: "row", backgroundColor: "#f5f5f5", borderBottomWidth: 0.5, borderBottomColor: "#ccc", paddingVertical: 4, paddingHorizontal: 4 },
  tableRow: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#eee", paddingVertical: 3, paddingHorizontal: 4 },
  colSno: { width: "6%" },
  colName: { width: "28%" },
  colHsn: { width: "12%" },
  colQty: { width: "8%", textAlign: "right" },
  colUnit: { width: "8%" },
  colRate: { width: "12%", textAlign: "right" },
  colTax: { width: "14%", textAlign: "right" },
  colAmt: { width: "12%", textAlign: "right" },
  taxSection: { marginTop: 8, alignItems: "flex-end" },
  taxRow: { flexDirection: "row", justifyContent: "flex-end", width: 220, marginBottom: 2 },
  taxLabel: { width: 140, textAlign: "right", paddingRight: 8, fontSize: 8 },
  taxValue: { width: 80, textAlign: "right", fontSize: 9 },
  grandTotal: { flexDirection: "row", justifyContent: "flex-end", width: 220, marginTop: 4, paddingTop: 4, borderTopWidth: 1, borderTopColor: "#333" },
  wordsSection: { marginTop: 10, padding: 6, backgroundColor: "#fafafa", borderRadius: 2 },
  bankSection: { marginTop: 12 },
  footer: { position: "absolute", bottom: 30, left: 30, right: 30, fontSize: 7, color: "#999", textAlign: "center" },
});

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
  sellerBankAccount: string;
  sellerBankIfsc: string;
  supplyType: string;
  gstRate: number;
  lines: {
    productName: string;
    hsnCode: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    taxableValue: number;
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
  const halfRate = Math.round((data.gstRate / 2) * 100) / 100;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{data.sellerName || "Company Name"}</Text>
          {data.sellerAddress ? <Text style={styles.subtitle}>{data.sellerAddress}</Text> : null}
          {data.sellerGstin ? <Text style={styles.subtitle}>GSTIN: {data.sellerGstin}</Text> : null}
        </View>

        <Text style={styles.docType}>{docTypeLabels[data.docType] || "Invoice"}</Text>

        {/* Invoice meta */}
        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.label}>Document No.</Text>
            <Text style={[styles.value, styles.bold]}>{data.invoiceNumber}</Text>
          </View>
          <View style={[styles.col, { alignItems: "flex-end" }]}>
            <Text style={styles.label}>Date</Text>
            <Text style={styles.value}>{data.invoiceDate}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Seller / Buyer */}
        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={[styles.label, { marginBottom: 3 }]}>Bill From</Text>
            <Text style={[styles.value, styles.bold]}>{data.sellerName}</Text>
            {data.sellerAddress ? <Text style={styles.value}>{data.sellerAddress}</Text> : null}
            {data.sellerGstin ? <Text style={styles.value}>GSTIN: {data.sellerGstin}</Text> : null}
            {data.sellerPan ? <Text style={styles.value}>PAN: {data.sellerPan}</Text> : null}
            {data.sellerStateCode ? <Text style={styles.value}>State Code: {data.sellerStateCode}</Text> : null}
            {data.sellerPhone ? <Text style={styles.value}>Phone: {data.sellerPhone}</Text> : null}
            {data.sellerEmail ? <Text style={styles.value}>Email: {data.sellerEmail}</Text> : null}
          </View>
          <View style={styles.col}>
            <Text style={[styles.label, { marginBottom: 3 }]}>Bill To</Text>
            <Text style={[styles.value, styles.bold]}>{data.buyerName}</Text>
            {data.buyerAddress ? <Text style={styles.value}>{data.buyerAddress}</Text> : null}
            {data.buyerGstin ? <Text style={styles.value}>GSTIN: {data.buyerGstin}</Text> : null}
            {data.buyerStateCode ? <Text style={styles.value}>State Code: {data.buyerStateCode}</Text> : null}
          </View>
        </View>

        <View style={styles.thickDivider} />

        {/* Line Items Table */}
        <View style={styles.tableHeader}>
          <Text style={[styles.colSno, styles.bold]}>#</Text>
          <Text style={[styles.colName, styles.bold]}>Item</Text>
          {isGst && <Text style={[styles.colHsn, styles.bold]}>HSN</Text>}
          <Text style={[styles.colQty, styles.bold]}>Qty</Text>
          <Text style={[styles.colUnit, styles.bold]}>Unit</Text>
          <Text style={[styles.colRate, styles.bold]}>Rate</Text>
          <Text style={[styles.colAmt, styles.bold]}>Amount</Text>
        </View>
        {data.lines.map((line, i) => (
          <View key={i} style={styles.tableRow}>
            <Text style={styles.colSno}>{i + 1}</Text>
            <Text style={styles.colName}>{line.productName}</Text>
            {isGst && <Text style={styles.colHsn}>{line.hsnCode || "-"}</Text>}
            <Text style={styles.colQty}>{line.quantity}</Text>
            <Text style={styles.colUnit}>{line.unit}</Text>
            <Text style={styles.colRate}>{line.unitPrice.toFixed(2)}</Text>
            <Text style={styles.colAmt}>{line.taxableValue.toFixed(2)}</Text>
          </View>
        ))}

        {/* Tax Summary */}
        <View style={styles.taxSection}>
          <View style={styles.taxRow}>
            <Text style={styles.taxLabel}>Subtotal</Text>
            <Text style={[styles.taxValue, styles.bold]}>{data.subtotal.toFixed(2)}</Text>
          </View>

          {isGst && isIntraState && (
            <>
              <View style={styles.taxRow}>
                <Text style={styles.taxLabel}>CGST @ {halfRate}%</Text>
                <Text style={styles.taxValue}>{data.cgstAmount.toFixed(2)}</Text>
              </View>
              <View style={styles.taxRow}>
                <Text style={styles.taxLabel}>SGST @ {halfRate}%</Text>
                <Text style={styles.taxValue}>{data.sgstAmount.toFixed(2)}</Text>
              </View>
            </>
          )}

          {isGst && !isIntraState && (
            <View style={styles.taxRow}>
              <Text style={styles.taxLabel}>IGST @ {data.gstRate}%</Text>
              <Text style={styles.taxValue}>{data.igstAmount.toFixed(2)}</Text>
            </View>
          )}

          {isGst && (
            <View style={styles.taxRow}>
              <Text style={styles.taxLabel}>Total Tax</Text>
              <Text style={styles.taxValue}>{data.totalTax.toFixed(2)}</Text>
            </View>
          )}

          {data.roundOff !== 0 && (
            <View style={styles.taxRow}>
              <Text style={styles.taxLabel}>Round Off</Text>
              <Text style={styles.taxValue}>{data.roundOff > 0 ? "+" : ""}{data.roundOff.toFixed(2)}</Text>
            </View>
          )}

          <View style={styles.grandTotal}>
            <Text style={[styles.taxLabel, styles.bold, { fontSize: 10 }]}>Grand Total</Text>
            <Text style={[styles.taxValue, styles.bold, { fontSize: 11 }]}>₹{data.grandTotal.toFixed(2)}</Text>
          </View>
        </View>

        {/* Amount in Words */}
        <View style={styles.wordsSection}>
          <Text style={styles.label}>Amount in Words</Text>
          <Text style={[styles.value, styles.bold]}>{data.amountInWords}</Text>
        </View>

        {/* Bank Details */}
        {(data.sellerBankName || data.sellerBankAccount) && (
          <View style={styles.bankSection}>
            <Text style={[styles.label, { marginBottom: 3 }]}>Bank Details</Text>
            {data.sellerBankName && <Text style={styles.value}>Bank: {data.sellerBankName}</Text>}
            {data.sellerBankAccount && <Text style={styles.value}>A/C No: {data.sellerBankAccount}</Text>}
            {data.sellerBankIfsc && <Text style={styles.value}>IFSC: {data.sellerBankIfsc}</Text>}
          </View>
        )}

        {/* Notes */}
        {data.notes && (
          <View style={{ marginTop: 10 }}>
            <Text style={styles.label}>Notes</Text>
            <Text style={styles.value}>{data.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>This is a computer-generated document. No signature is required.</Text>
        </View>
      </Page>
    </Document>
  );
}
