import { describe, it, expect } from "vitest";
import { buildReceivables, advancesByDealer } from "./receivables";

const inv = (id: string, date: string, total: number, orderId: string) =>
  ({ id, invoiceNumber: id, invoiceDate: date, grandTotal: total, docType: "gst_invoice", status: "issued", sourceOrderId: orderId, buyerName: "D" }) as any;
const ord = (id: string, dealer: string, cancelledAt: string | null = null) =>
  ({ id, distributorId: dealer, distributorName: dealer, orderNumber: id, cancelledAt }) as any;

describe("dealer credit pays the oldest bills first", () => {
  const invoices = [inv("B1", "2026-09-01", 1000, "o1"), inv("B2", "2026-09-10", 500, "o2")];
  const orders = [ord("o1", "d1"), ord("o2", "d1")];

  it("clears the oldest bill and shrinks the next", () => {
    const rows = buildReceivables({
      invoices, orders, receivedByInvoice: new Map(), creditedByInvoice: new Map(),
      dealerCreditByDealer: new Map([["d1", 1200]]), today: new Date("2026-10-04T00:00:00"),
    });
    expect(rows.map(r => [r.invoiceId, r.due])).toEqual([["B2", 300]]);
  });

  it("without credit both bills stay due", () => {
    const rows = buildReceivables({ invoices, orders, receivedByInvoice: new Map(), creditedByInvoice: new Map(), today: new Date("2026-10-04T00:00:00") });
    expect(rows).toHaveLength(2);
  });

  it("money on a cancelled order is not an advance", () => {
    const adv = advancesByDealer([ord("o3", "d1", "2026-10-02T00:00:00Z")], [], new Map([["o3", 750]]));
    expect(adv.get("d1")).toBeUndefined();
  });
});
