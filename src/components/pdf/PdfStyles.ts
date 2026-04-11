import { StyleSheet } from "@react-pdf/renderer";

export const pdfStyles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#000",
  },
  // Header
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    borderBottom: "1pt solid #000",
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
    backgroundColor: "#374151",
    color: "#fff",
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  tableHeaderCell: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottom: "0.5pt solid #E5E5E5",
  },
  tableRowAlt: {
    flexDirection: "row",
    paddingVertical: 6,
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
