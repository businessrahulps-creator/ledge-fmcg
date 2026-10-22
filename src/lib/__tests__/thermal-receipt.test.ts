import { describe, it, expect } from "vitest";
import { receiptFromInvoice, receiptFromOrder } from "@/lib/thermal-receipt";

const inv: any = {
  docType: "gst_invoice", invoiceNumber: "INV-1", invoiceDate: "2026-10-22", supplyType: "intra_state",
  subtotal: 2100, cgstAmount: 52.5, sgstAmount: 52.5, igstAmount: 0, roundOff: 0.0, grandTotal: 2205,
  amountInWords: "x", sellerName: "S", sellerAddress: "", sellerPhone: "", sellerGstin: "", buyerName: "B", buyerGstin: "",
  sellerBankAccount: "", lines: [{ productName: "Atta", quantity: 5, unitPrice: 420, taxableValue: 2100, lineTotal: 2205 }],
};

describe("thermal receipt", () => {
  it("copies saved GST bill total and split", () => {
    const r = receiptFromInvoice(inv);
    expect(r.isBill).toBe(true);
    expect(r.total).toBe(2205);
    expect(r.totals.map(t => t.label)).toEqual(["Taxable value", "CGST", "SGST", "TOTAL"]);
  });
  it("uses IGST for inter-state bills", () => {
    const r = receiptFromInvoice({ ...inv, supplyType: "inter_state", igstAmount: 105 });
    expect(r.totals.find(t => t.label === "IGST")?.value).toBe(105);
    expect(r.totals.some(t => t.label === "CGST")).toBe(false);
  });
  it("order slip is never labelled a bill and subtracts offers once", () => {
    const order: any = { orderNumber: "ORD-1", date: "2026-10-22", distributorName: "B", total: 1000, schemeSavings: 50,
      lines: [{ productName: "Tea", quantity: 2, unitPrice: 500, lineTotal: 1000 }] };
    const r = receiptFromOrder(order, { name: "S", address: "", phone: "", gstin: "" });
    expect(r.isBill).toBe(false);
    expect(r.title).toContain("NOT A BILL");
    expect(r.total).toBe(950);
  });
});

describe("thermal receipt fixes", () => {
  it("item amounts add up to taxable value", () => {
    const r = receiptFromInvoice(inv);
    expect(r.rows.reduce((a, x) => a + x.amount, 0)).toBe(2100);
    expect(r.rows[0].amount).toBe(5 * 420);
  });
  it("refuses a bill with no items", () => {
    expect(() => receiptFromInvoice({ ...inv, lines: [] })).toThrow("Couldn't load the bill items");
  });
  it("prints Indian date and place of supply", () => {
    const r = receiptFromInvoice({ ...inv, buyerStateCode: "29", sellerStateCode: "32" });
    expect(r.date).not.toBe("2026-10-22");
    expect(r.placeOfSupply).toBe("State code 29");
  });
});

describe("draft bills", () => {
  it("a draft GST bill never prints as a Tax Invoice", () => {
    const r = receiptFromInvoice({ ...inv, status: "draft" });
    expect(r.isBill).toBe(false);
    expect(r.title).toContain("NOT A BILL");
  });
});

import { receiptHtml } from "@/components/print/printThermal";
describe("credit notes on receipt", () => {
  const prefs = { width: 80 as const, showBank: false, footer: "", copies: 1 as const };
  it("shows the credit-note amount so paid + credit + balance = total", () => {
    const html = receiptHtml(receiptFromInvoice(inv), prefs, { paid: 1000, balance: 905 });
    expect(html).toContain("Less credit notes");
    expect(html).toContain("300.00");
  });
  it("no credit line when nothing was credited", () => {
    const html = receiptHtml(receiptFromInvoice(inv), prefs, { paid: 1000, balance: 1205 });
    expect(html).not.toContain("Less credit notes");
  });
});
