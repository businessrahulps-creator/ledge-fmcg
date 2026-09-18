import { describe, it, expect } from "vitest";
import {
  buildReceivables,
  sumDue,
  advancesByDealer,
  paymentStatusByOrder,
} from "../receivables";

const inv = (over: Record<string, unknown> = {}) =>
  ({
    id: "i1",
    invoiceNumber: "INV/2026-27/0001",
    invoiceDate: "2026-09-01",
    docType: "gst_invoice",
    status: "posted",
    sourceOrderId: "o1",
    buyerName: "Buyer",
    grandTotal: 1000,
    ...over,
  }) as any;

const ord = (over: Record<string, unknown> = {}) =>
  ({
    id: "o1",
    orderNumber: "ORD-2026-0001",
    distributorId: "d1",
    distributorName: "Dealer One",
    date: "2026-09-01",
    total: 1000,
    ...over,
  }) as any;

const today = new Date("2026-09-30T00:00:00");
const m = (e: [string, number][] = []) => new Map(e);

describe("buildReceivables", () => {
  it("skips draft bills and non-GST documents", () => {
    const rows = buildReceivables({
      invoices: [inv({ id: "a", status: "draft" }), inv({ id: "b", docType: "proforma" })],
      orders: [ord()],
      receivedByInvoice: m(),
      creditedByInvoice: m(),
      today,
    });
    expect(rows).toHaveLength(0);
  });

  it("drops a fully settled bill", () => {
    const rows = buildReceivables({
      invoices: [inv()],
      orders: [ord()],
      receivedByInvoice: m([["i1", 600]]),
      creditedByInvoice: m([["i1", 400]]),
      today,
    });
    expect(rows).toHaveLength(0);
  });

  it("keeps a bill short by a few paise", () => {
    const rows = buildReceivables({
      invoices: [inv()],
      orders: [ord()],
      receivedByInvoice: m([["i1", 999.5]]),
      creditedByInvoice: m(),
      today,
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].due).toBe(0.5);
  });

  it("ages from the bill date and buckets it", () => {
    const rows = buildReceivables({
      invoices: [inv({ invoiceDate: "2026-09-01" })],
      orders: [ord()],
      receivedByInvoice: m(),
      creditedByInvoice: m(),
      today,
    });
    expect(rows[0].ageDays).toBe(29);
    expect(rows[0].bucket).toBe("b0");
  });

  it("sorts oldest first and totals due to the paise", () => {
    const rows = buildReceivables({
      invoices: [
        inv({ id: "new", sourceOrderId: "o1", invoiceDate: "2026-09-20", grandTotal: 100.25 }),
        inv({ id: "old", sourceOrderId: "o1", invoiceDate: "2026-06-01", grandTotal: 200.5 }),
      ],
      orders: [ord()],
      receivedByInvoice: m(),
      creditedByInvoice: m(),
      today,
    });
    expect(rows.map(r => r.invoiceId)).toEqual(["old", "new"]);
    expect(rows[0].bucket).toBe("b90");
    expect(sumDue(rows)).toBe(300.75);
  });
});

describe("advancesByDealer", () => {
  it("counts money on unbilled orders only", () => {
    const orders = [ord({ id: "o1" }), ord({ id: "o2", distributorId: "d1" })];
    const map = advancesByDealer(
      orders,
      [inv({ sourceOrderId: "o1" })],
      m([["o1", 500], ["o2", 300]]),
    );
    expect(map.get("d1")).toBe(300);
  });
});

describe("paymentStatusByOrder", () => {
  it("derives paid / partial / pending from receipts, never the stored flag", () => {
    const orders = [
      ord({ id: "o1", paymentStatus: "pending" }),
      ord({ id: "o2", paymentStatus: "paid" }),
      ord({ id: "o3", paymentStatus: "paid" }),
      ord({ id: "o4", paymentStatus: "paid" }),
    ];
    const invoices = [
      inv({ id: "i1", sourceOrderId: "o1" }),
      inv({ id: "i2", sourceOrderId: "o2" }),
      inv({ id: "i3", sourceOrderId: "o3" }),
    ];
    const status = paymentStatusByOrder(
      orders,
      invoices,
      m([["i1", 1000], ["i2", 400]]),
      m([["o4", 250]]),
      m(),
    );
    expect(status.get("o1")).toBe("paid");
    expect(status.get("o2")).toBe("partial");
    expect(status.get("o3")).toBe("pending");
    // Unbilled order holding an advance can never read "paid".
    expect(status.get("o4")).toBe("partial");
  });
});
