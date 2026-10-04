import { describe, it, expect } from "vitest";
import { roundPaise } from "./money";
import { agingFromReceivables, type ReceivableRow } from "./receivables";

describe("roundPaise (same as database round(x, 2))", () => {
  it("rounds half a paisa away from zero", () => {
    expect(roundPaise(1.005)).toBe(1.01);
    expect(roundPaise(2.675)).toBe(2.68);
    expect(roundPaise(-1.005)).toBe(-1.01);
    expect(roundPaise(10.004)).toBe(10);
    expect(roundPaise(0.1 + 0.2)).toBe(0.3);
    expect(Object.is(roundPaise(-0.001), 0)).toBe(true);
    expect(roundPaise(NaN)).toBe(0);
  });
});

const row = (id: string, ageDays: number, due: number): ReceivableRow => ({
  invoiceId: id, invoiceNumber: id, invoiceDate: "2026-01-01", orderId: null, orderNumber: "",
  distributorId: "d1", distributorName: "D", billed: due, received: 0, credited: 0, due, ageDays,
  bucket: ageDays > 90 ? "b90" : ageDays > 60 ? "b61" : ageDays > 30 ? "b31" : "b0",
} as ReceivableRow);

describe("oldest unpaid age after spare money settles old bills", () => {
  it("names the oldest bill that is still unpaid", () => {
    const rows = [row("a", 120, 500), row("b", 75, 300), row("c", 10, 200)];
    const [agg] = agingFromReceivables(rows, [{ id: "d1", name: "D", outstandingAmount: 450 }], { settleToBalance: true });
    // 550 of spare money clears bill a (500) and 50 of bill b.
    expect(agg.totalOutstanding).toBe(450);
    expect(agg.oldestAgeDays).toBe(75);
    expect(agg.bucket_90_plus).toBe(0);
    expect(agg.bucket_61_90).toBe(250);
    expect(agg.worstBucket).toBe("b61");
  });
});
