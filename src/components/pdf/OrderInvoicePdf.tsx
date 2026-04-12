import { Document, Page, View, Text } from "@react-pdf/renderer";
import { pdfStyles as s } from "./PdfStyles";
import { PdfHeader } from "./PdfHeader";
import { PdfFooter } from "./PdfFooter";
import { formatCurrencyPdf } from "@/utils/exportPdf";
import { formatIndianDate } from "@/utils/formatDate";
import { numberToWords } from "@/utils/numberToWords";
import type { Order } from "@/data/mock-data";

interface OrderInvoicePdfProps {
  order: Order;
  companyName?: string;
  companyAddress?: string;
  gstin?: string;
  logoUrl?: string;
}

export function OrderInvoicePdf({
  order,
  companyName,
  companyAddress,
  gstin,
  logoUrl,
}: OrderInvoicePdfProps) {
  const hasSavings = order.schemeSavings > 0;
  const effectiveTotal = Math.max(0, order.total - order.schemeSavings);

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <PdfHeader
          title={`Invoice ${order.orderNumber}`}
          companyName={companyName}
          companyAddress={companyAddress}
          gstin={gstin}
          logoUrl={logoUrl}
        />

        {/* Two-column info block: Bill To + Order Details */}
        <View style={s.infoRow}>
          <View style={s.billToBox}>
            <Text style={s.infoLabel}>Bill To</Text>
            <Text style={s.infoValueBold}>{order.distributorName}</Text>
          </View>
          <View style={s.orderMetaBox}>
            <Text style={s.infoLabel}>Order Details</Text>
            <View style={s.metaRow}>
              <Text style={s.metaLabel}>Date</Text>
              <Text style={s.metaValue}>{formatIndianDate(order.date)}</Text>
            </View>
            <View style={s.metaRow}>
              <Text style={s.metaLabel}>Salesperson</Text>
              <Text style={s.metaValue}>{order.salesperson}</Text>
            </View>
            <View style={s.metaRow}>
              <Text style={s.metaLabel}>Payment</Text>
              <Text style={s.metaValue}>
                {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)} · {order.paymentMode.replace("_", " ")}
              </Text>
            </View>
            <View style={s.metaRow}>
              <Text style={s.metaLabel}>Delivery</Text>
              <Text style={s.metaValue}>
                {order.deliveryStatus.charAt(0).toUpperCase() + order.deliveryStatus.slice(1)}
              </Text>
            </View>
          </View>
        </View>

        {/* Line items table */}
        <Text style={s.sectionTitle}>Line Items</Text>
        <View style={s.table}>
          <View style={s.tableHeader}>
            <Text style={[s.tableHeaderCell, { width: "5%" }]}>#</Text>
            <Text style={[s.tableHeaderCell, { width: "45%" }]}>Product</Text>
            <Text style={[s.tableHeaderCell, { width: "15%", textAlign: "right" }]}>Qty</Text>
            <Text style={[s.tableHeaderCell, { width: "15%", textAlign: "right" }]}>Unit Price</Text>
            <Text style={[s.tableHeaderCell, { width: "20%", textAlign: "right" }]}>Total</Text>
          </View>
          {order.lines.map((line, i) => (
            <View key={i} style={i % 2 === 1 ? s.tableRowAlt : s.tableRow} wrap={false}>
              <Text style={[s.tableCell, { width: "5%" }]}>{i + 1}</Text>
              <Text style={[s.tableCellBold, { width: "45%" }]}>{line.productName}</Text>
              <Text style={[s.tableCellRight, { width: "15%" }]}>{line.quantity}</Text>
              <Text style={[s.tableCellRight, { width: "15%" }]}>{formatCurrencyPdf(line.unitPrice)}</Text>
              <Text style={[s.tableCellRightBold, { width: "20%" }]}>{formatCurrencyPdf(line.lineTotal)}</Text>
            </View>
          ))}
        </View>

        {/* Totals box — right-aligned */}
        <View style={s.totalsContainer}>
          <View style={s.totalsBox}>
            {/* Subtotal */}
            <View style={s.totalsRow}>
              <Text style={s.totalsLabel}>Subtotal</Text>
              <Text style={s.totalsValue}>{formatCurrencyPdf(order.total)}</Text>
            </View>

            {/* Schemes Applied */}
            {hasSavings && order.appliedSchemes && order.appliedSchemes.length > 0 && (
              <>
                <View style={s.schemeDivider} />
                <Text style={s.schemeHeader}>Schemes Applied</Text>
                {order.appliedSchemes.map((scheme, i) => (
                  <View key={i} style={s.schemeRow}>
                    <Text style={s.schemeName}>{scheme.schemeName}</Text>
                    <Text style={s.schemeSavings}>-{formatCurrencyPdf(scheme.savings)}</Text>
                  </View>
                ))}
                <View style={s.totalsRow}>
                  <Text style={[s.totalsLabel, { color: "#059669" }]}>Total Savings</Text>
                  <Text style={[s.totalsValue, { color: "#059669" }]}>-{formatCurrencyPdf(order.schemeSavings)}</Text>
                </View>
              </>
            )}

            {/* Grand / Effective Total */}
            <View style={s.totalsRowBorder}>
              <Text style={s.totalsFinalLabel}>{hasSavings ? "Effective Total" : "Grand Total"}</Text>
              <Text style={s.totalsFinalValue}>{formatCurrencyPdf(hasSavings ? effectiveTotal : order.total)}</Text>
            </View>
          </View>
        </View>

        {/* Amount in Words */}
        <View style={{ marginTop: 12, padding: 8, backgroundColor: "#FAFAFA" }}>
          <Text style={s.infoLabel}>Amount in Words</Text>
          <Text style={s.infoValueBold}>
            {numberToWords(hasSavings ? effectiveTotal : order.total)}
          </Text>
        </View>

        {/* Dispatch info if available */}
        {(order.dispatchDate || order.vehicle || order.driverName) && (
          <View style={{ marginTop: 20 }}>
            <Text style={s.sectionTitle}>Dispatch Details</Text>
            <View style={{ flexDirection: "row", gap: 12 }}>
              {order.dispatchDate && (
                <View style={s.summaryCard}>
                  <Text style={s.summaryLabel}>Dispatch Date</Text>
                  <Text style={{ fontSize: 9 }}>{formatIndianDate(order.dispatchDate)}</Text>
                </View>
              )}
              {order.vehicle && (
                <View style={s.summaryCard}>
                  <Text style={s.summaryLabel}>Vehicle</Text>
                  <Text style={{ fontSize: 9 }}>{order.vehicle}</Text>
                </View>
              )}
              {order.driverName && (
                <View style={s.summaryCard}>
                  <Text style={s.summaryLabel}>Driver</Text>
                  <Text style={{ fontSize: 9 }}>{order.driverName}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        <PdfFooter />
      </Page>
    </Document>
  );
}
