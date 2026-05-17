import { StyleSheet } from "@react-pdf/renderer";

export const pdfStyles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#000",
  },
  // Header — Midnight letterhead (PR-C brand placement)
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    borderBottom: "1.5pt solid #0F1F3A",
    paddingBottom: 10,
  },
  companyName: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
  },
  companyDetail: {
    fontSize: 8,
    color: "#333",
    marginTop: 2,
  },
  docTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    textAlign: "right",
  },
  docSubtitle: {
    fontSize: 8,
    color: "#333",
    textAlign: "right",
    marginTop: 2,
  },
  // Two-column info block
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  billToBox: {
    width: "48%",
  },
  orderMetaBox: {
    width: "48%",
  },
  infoLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: "#666",
    marginBottom: 6,
  },
  infoValue: {
    fontSize: 9,
    marginBottom: 3,
  },
  infoValueBold: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    marginBottom: 3,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  metaLabel: {
    fontSize: 8,
    color: "#555",
  },
  metaValue: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
  },
  // Summary cards
  summaryRow: {
    flexDirection: "row",
    marginBottom: 16,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    border: "0.5pt solid #D4D4D4",
    backgroundColor: "#F9F9F9",
    padding: 10,
  },
  summaryLabel: {
    fontSize: 7,
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    marginTop: 2,
  },
  // Table
  table: {
    width: "100%",
    marginBottom: 12,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#0F1F3A",
    color: "#fff",
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableHeaderCell: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottom: "0.5pt solid #E5E5E5",
  },
  tableRowAlt: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottom: "0.5pt solid #E5E5E5",
    backgroundColor: "#FAFAFA",
  },
  tableCell: {
    fontSize: 8,
  },
  tableCellRight: {
    fontSize: 8,
    textAlign: "right",
  },
  tableCellBold: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
  },
  tableCellRightBold: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    textAlign: "right",
  },
  // Totals box
  totalsContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 12,
  },
  totalsBox: {
    width: "45%",
    border: "0.5pt solid #D4D4D4",
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  totalsRowBorder: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderTop: "1pt solid #0F1F3A",
    backgroundColor: "#F3F4F6",
  },
  totalsLabel: {
    fontSize: 8,
    color: "#555",
  },
  totalsValue: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
  },
  totalsFinalLabel: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
  },
  totalsFinalValue: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
  },
  schemeDivider: {
    borderTop: "0.5pt dashed #D4D4D4",
    marginVertical: 2,
  },
  schemeHeader: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    color: "#666",
    paddingHorizontal: 12,
    paddingTop: 5,
    paddingBottom: 2,
    letterSpacing: 0.5,
  },
  schemeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
    paddingHorizontal: 12,
  },
  schemeName: {
    fontSize: 8,
    color: "#059669",
  },
  schemeSavings: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#059669",
  },
  // Footer
  footer: {
    position: "absolute",
    bottom: 25,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTop: "0.5pt solid #ccc",
    paddingTop: 6,
  },
  footerText: {
    fontSize: 7,
    color: "#999",
  },
  // Section label
  sectionTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    marginBottom: 6,
    marginTop: 8,
  },
});
