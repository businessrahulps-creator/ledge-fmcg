import { StyleSheet } from "@react-pdf/renderer";
import { PDF_FONT } from "./PdfFonts";

/** Brand ink */
const MIDNIGHT = "#0F1F3A";
const INK_MUTED = "#5B6577";
const INK_SOFT = "#8A93A3";
const RULE = "#DCE0E7";
const RULE_SOFT = "#EDEFF3";
const BAND = "#F6F7F9";

/**
 * Page geometry — a generous bottom gutter keeps flowing tables clear of the
 * fixed footer strip (which sits 26pt from the bottom edge).
 */
export const PAGE_PADDING_TOP = 36;
export const PAGE_PADDING_X = 40;
export const PAGE_PADDING_BOTTOM = 62;

export const pdfStyles = StyleSheet.create({
  page: {
    paddingTop: PAGE_PADDING_TOP,
    paddingLeft: PAGE_PADDING_X,
    paddingRight: PAGE_PADDING_X,
    paddingBottom: PAGE_PADDING_BOTTOM,
    fontFamily: PDF_FONT,
    fontSize: 9,
    lineHeight: 1.35,
    color: MIDNIGHT,
    backgroundColor: "#FFFFFF",
  },
  // Header — Midnight letterhead
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 18,
    borderBottom: `1.5pt solid ${MIDNIGHT}`,
    paddingBottom: 10,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    width: "58%",
  },
  headerRight: {
    width: "40%",
  },
  companyName: {
    fontSize: 13,
    fontFamily: PDF_FONT,
    fontWeight: 700,
    letterSpacing: 0.2,
  },
  companyDetail: {
    fontSize: 8,
    color: INK_MUTED,
    marginTop: 2,
  },
  docTitle: {
    fontSize: 12,
    fontFamily: PDF_FONT,
    fontWeight: 700,
    textAlign: "right",
  },
  docSubtitle: {
    fontSize: 8,
    color: INK_MUTED,
    textAlign: "right",
    marginTop: 2,
  },
  // Two-column info block
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  billToBox: {
    width: "48%",
  },
  orderMetaBox: {
    width: "48%",
  },
  infoLabel: {
    fontSize: 7,
    fontFamily: PDF_FONT,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: INK_SOFT,
    marginBottom: 5,
  },
  infoValue: {
    fontSize: 9,
    marginBottom: 2,
    color: INK_MUTED,
  },
  infoValueBold: {
    fontSize: 10,
    fontFamily: PDF_FONT,
    fontWeight: 700,
    marginBottom: 3,
    color: MIDNIGHT,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  metaLabel: {
    fontSize: 8,
    color: INK_MUTED,
  },
  metaValue: {
    fontSize: 8,
    fontFamily: PDF_FONT,
    fontWeight: 700,
  },
  // Summary cards
  summaryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 14,
    gap: 8,
  },
  summaryCard: {
    flexGrow: 1,
    flexBasis: "22%",
    minWidth: "22%",
    border: `0.5pt solid ${RULE}`,
    backgroundColor: BAND,
    borderRadius: 3,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  summaryLabel: {
    fontSize: 7,
    color: INK_SOFT,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontSize: 11,
    fontFamily: PDF_FONT,
    fontWeight: 700,
    marginTop: 3,
  },
  // Table
  table: {
    width: "100%",
    marginBottom: 12,
    borderBottom: `0.5pt solid ${RULE}`,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: MIDNIGHT,
    color: "#FFFFFF",
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableHeaderCell: {
    fontSize: 7,
    fontFamily: PDF_FONT,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottom: `0.5pt solid ${RULE_SOFT}`,
  },
  tableRowAlt: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottom: `0.5pt solid ${RULE_SOFT}`,
    backgroundColor: BAND,
  },
  tableCell: {
    fontSize: 8,
    paddingRight: 4,
  },
  tableCellRight: {
    fontSize: 8,
    textAlign: "right",
    paddingLeft: 4,
  },
  tableCellBold: {
    fontSize: 8,
    fontFamily: PDF_FONT,
    fontWeight: 700,
    paddingRight: 4,
  },
  tableCellRightBold: {
    fontSize: 8,
    fontFamily: PDF_FONT,
    fontWeight: 700,
    textAlign: "right",
    paddingLeft: 4,
  },
  // Totals box
  totalsContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
  },
  totalsBox: {
    width: "48%",
    border: `0.5pt solid ${RULE}`,
    borderRadius: 3,
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  totalsRowBorder: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderTop: `1pt solid ${MIDNIGHT}`,
    backgroundColor: BAND,
  },
  totalsLabel: {
    fontSize: 8,
    color: INK_MUTED,
  },
  totalsValue: {
    fontSize: 8,
    fontFamily: PDF_FONT,
    fontWeight: 700,
  },
  totalsFinalLabel: {
    fontSize: 10,
    fontFamily: PDF_FONT,
    fontWeight: 700,
  },
  totalsFinalValue: {
    fontSize: 10,
    fontFamily: PDF_FONT,
    fontWeight: 700,
  },
  schemeDivider: {
    borderTop: `0.5pt dashed ${RULE}`,
    marginVertical: 2,
  },
  schemeHeader: {
    fontSize: 7,
    fontFamily: PDF_FONT,
    fontWeight: 700,
    textTransform: "uppercase",
    color: INK_SOFT,
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
    color: "#1F7A4C",
  },
  schemeSavings: {
    fontSize: 8,
    fontFamily: PDF_FONT,
    fontWeight: 700,
    color: "#1F7A4C",
  },
  // Callout block (amount in words, notes)
  callout: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: BAND,
    border: `0.5pt solid ${RULE}`,
    borderRadius: 3,
  },
  // Signature
  signatureRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 24,
  },
  signatureBox: {
    width: "40%",
    alignItems: "center",
    borderTop: `0.5pt solid ${RULE}`,
    paddingTop: 6,
  },
  signatureText: {
    fontSize: 8,
    color: INK_MUTED,
  },
  // Footer
  footer: {
    position: "absolute",
    bottom: 26,
    left: PAGE_PADDING_X,
    right: PAGE_PADDING_X,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTop: `0.5pt solid ${RULE}`,
    paddingTop: 6,
  },
  footerText: {
    fontSize: 7,
    color: INK_SOFT,
  },
  // Section label
  sectionTitle: {
    fontSize: 9,
    fontFamily: PDF_FONT,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    color: MIDNIGHT,
    marginBottom: 6,
    marginTop: 10,
  },
});

export const pdfInk = { MIDNIGHT, INK_MUTED, INK_SOFT, RULE, RULE_SOFT, BAND };
