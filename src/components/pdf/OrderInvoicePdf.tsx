import { Document, Page, View, Text } from "@react-pdf/renderer";
import { pdfStyles as s } from "./PdfStyles";
import { PdfHeader } from "./PdfHeader";
import { PdfFooter } from "./PdfFooter";
import { formatCurrency } from "@/data/mock-data";
import { formatIndianDate } from "@/utils/formatDate";
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

        {/* Order details */}
        <View style={{ flexDirection: "row", marginBottom: 16, gap: 12 }}>
          <View style={s.summaryCard}>
            <Text style={s.summaryLabel}>Order Date</Text>
            <Text style={s.summaryValue}>{formatIndianDate(order.date)}</Text>
          </View>
          <View style={s.summaryCard}>
            <Text style={s.summaryLabel}>Dealer</Text>
            <Text style={s.summaryValue}>{order.distributorName}</Text>
          </View>
          <View style={s.summaryCard}>
            <Text style={s.summaryLabel}>Sales Person</Text>
            <Text style={s.summaryValue}>{order.salesperson}</Text>
          </View>
          <View style={s.summaryCard}>
            <Text style={s.summaryLabel}>Payment</Text>
            <Text style={s.summaryValue}>
              {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)} · {order.paymentMode.replace("_", " ")}
            </Text>
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
              <Text style={[s.tableCellRight, { width: "15%" }]}>{formatCurrency(line.unitPrice)}</Text>
              <Text style={[s.tableCellRightBold, { width: "20%" }]}>{formatCurrency(line.lineTotal)}</Text>
            </View>
          ))}
        </View>

        {/* Total */}
        <View style={{ alignItems: "flex-end", marginTop: 4, borderTop: "1pt solid #000", paddingTop: 8 }}>
          <View style={{ flexDirection: "row", gap: 20 }}>
            <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold" }}>Grand Total</Text>
            <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold" }}>{formatCurrency(order.total)}</Text>
          </View>
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
