import { describe, expect, it } from "vitest";
import {
  buildOrderSummary,
  buildInvoiceSummary,
  type InvoiceShareData,
} from "@/utils/shareWhatsApp";
import { formatCurrency, type Order } from "@/data/mock-data";

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: "o1",
    orderNumber: "ORD-001",
    date: "2026-05-15",
    distributorId: "d1",
    distributorName: "Sharma Traders",
    salespersonId: "s1",
    salesperson: "Ravi",
    lines: [
      { productId: "p1", productName: "Atta 10kg", quantity: 4, unitPrice: 500, lineTotal: 2000 },
      { productId: "p2", productName: "Ghee 1L", quantity: 2, unitPrice: 750, lineTotal: 1500 },
    ],
    total: 3500,
    paymentMode: "cash",
    paymentStatus: "pending",
    dispatchDate: null,
    vehicle: "",
    driverName: "",
    deliveryStatus: "pending",
    dispatchRemarks: "",
    schemeSavings: 0,
    appliedSchemes: [],
    ...overrides,
  };
}

function makeInvoice(overrides: Partial<InvoiceShareData> = {}): InvoiceShareData {
  return {
    invoiceNumber: "INV-100",
    docType: "gst_invoice",
    invoiceDate: "15 May 2026",
    buyerName: "Sharma Traders",
    buyerGstin: "29ABCDE1234F1Z5",
    subtotal: 1000,
    cgstAmount: 90,
    sgstAmount: 90,
    igstAmount: 0,
    totalTax: 180,
    grandTotal: 1180,
    supplyType: "intra_state",
    gstRate: 18,
    lines: [
      { productName: "Atta 10kg", quantity: 2, unit: "bag", unitPrice: 500, taxableValue: 1000, hsnCode: "1101" },
    ],
    sellerName: "Ledge Foods",
    sellerAddress: "Bengaluru",
    sellerGstin: "29XYZ",
    sellerPan: "ABCDE1234F",
    sellerStateCode: "29",
    sellerPhone: "9999",
    sellerEmail: "a@b.com",
    sellerBankName: "HDFC",
    sellerBankAccountName: "Ledge",
    sellerBankAccount: "1234",
    sellerBankIfsc: "HDFC0001",
    buyerAddress: "Mysore",
    buyerStateCode: "29",
    roundOff: 0,
    amountInWords: "One thousand one hundred eighty",
    notes: "",
    ...overrides,
  };
}

describe("buildOrderSummary", () => {
  it("includes dealer, every line, and the grand total from the live order", () => {
    const o = makeOrder();
    const msg = buildOrderSummary(o, "Ledge Foods");
    expect(msg).toContain("ORD-001");
    expect(msg).toContain("Sharma Traders");
    expect(msg).toContain("Atta 10kg × 4");
    expect(msg).toContain(formatCurrency(2000));
    expect(msg).toContain("Ghee 1L × 2");
    expect(msg).toContain(formatCurrency(1500));
    expect(msg).toContain(`*Total: ${formatCurrency(3500)}*`);
    expect(msg).toContain("From: Ledge Foods");
  });

  it("reflects mutated quantities and totals on the next call (no stale memoisation)", () => {
    const o = makeOrder();
    const first = buildOrderSummary(o, "Ledge");
    expect(first).toContain(formatCurrency(3500));

    o.lines[0].quantity = 10;
    o.lines[0].lineTotal = 5000;
    o.total = 6500;
    const second = buildOrderSummary(o, "Ledge");

    expect(second).toContain("Atta 10kg × 10");
    expect(second).toContain(formatCurrency(5000));
    expect(second).toContain(`*Total: ${formatCurrency(6500)}*`);
    expect(second).not.toContain(formatCurrency(3500));
  });
});

describe("buildInvoiceSummary", () => {
  it("intra-state invoice shows CGST + SGST and hides IGST", () => {
    const msg = buildInvoiceSummary(makeInvoice());
    expect(msg).toContain("INV-100");
    expect(msg).toContain("Sharma Traders");
    expect(msg).toContain("CGST:");
    expect(msg).toContain("SGST:");
    expect(msg).not.toContain("IGST:");
    expect(msg).toContain(`Subtotal: ${formatCurrency(1000)}`);
    expect(msg).toContain(`*Grand Total: ${formatCurrency(1180)}*`);
  });

  it("inter-state invoice shows IGST and hides CGST/SGST", () => {
    const msg = buildInvoiceSummary(
      makeInvoice({
        supplyType: "inter_state",
        cgstAmount: 0,
        sgstAmount: 0,
        igstAmount: 180,
        totalTax: 180,
      }),
    );
    expect(msg).toContain("IGST:");
    expect(msg).not.toContain("CGST:");
    expect(msg).not.toContain("SGST:");
    expect(msg).toContain(`*Grand Total: ${formatCurrency(1180)}*`);
  });

  it("omits the tax block when totalTax is 0", () => {
    const msg = buildInvoiceSummary(
      makeInvoice({ cgstAmount: 0, sgstAmount: 0, totalTax: 0, grandTotal: 1000 }),
    );
    expect(msg).not.toContain("CGST:");
    expect(msg).not.toContain("IGST:");
    expect(msg).toContain(`*Grand Total: ${formatCurrency(1000)}*`);
  });
});
