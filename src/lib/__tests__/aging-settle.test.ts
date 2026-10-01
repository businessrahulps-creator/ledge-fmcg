import { describe, it, expect } from "vitest";
import { agingFromReceivables, type ReceivableRow } from "@/lib/receivables";

const row = (due: number, ageDays: number, bucket: ReceivableRow["bucket"]): ReceivableRow => ({
  invoiceId: `i${ageDays}`, invoiceNumber: "", invoiceDate: "", orderId: null, orderNumber: "",
  distributorId: "d1", distributorName: "A", billed: due, received: 0, credited: 0, due, ageDays, bucket,
});

describe("agingFromReceivables settleToBalance", () => {
  const rows = [row(1000, 100, "b90"), row(500, 10, "b0_30" as any)];
  it("keeps bill-level totals when not settling", () => {
    expect(agingFromReceivables(rows, [{ id: "d1", name: "A", outstandingAmount: 1200 }])[0].totalOutstanding).toBe(1500);
  });
  it("applies unlinked credit to the oldest money first", () => {
    const [a] = agingFromReceivables(rows, [{ id: "d1", name: "A", outstandingAmount: 1200 }], { settleToBalance: true });
    expect(a.totalOutstanding).toBe(1200);
    expect(a.bucket_90_plus).toBe(700);
  });
  it("drops a dealer whose advance covers every bill", () => {
    expect(agingFromReceivables(rows, [{ id: "d1", name: "A", outstandingAmount: -50 }], { settleToBalance: true })).toHaveLength(0);
  });
});
