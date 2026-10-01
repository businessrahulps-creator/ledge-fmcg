import { describe, it, expect } from "vitest";
import { calcLine, calcBill, isInterState, supplierBalances, billPaidStatus } from "./payables";

describe("purchase bill maths", () => {
  it("splits GST into CGST+SGST within the state, IGST across states", () => {
    expect(calcLine({ quantity: 3, rate: 33.33, gstRate: 18 }, false)).toEqual({ taxable: 99.99, cgst: 9, sgst: 9, igst: 0, total: 117.99 });
    expect(calcLine({ quantity: 3, rate: 33.33, gstRate: 18 }, true)).toEqual({ taxable: 99.99, cgst: 0, sgst: 0, igst: 18, total: 117.99 });
  });
  it("totals add up line by line", () => {
    const t = calcBill([{ quantity: 10, rate: 50, gstRate: 5 }, { quantity: 2, rate: 100, gstRate: 18 }], false);
    expect(t).toMatchObject({ subtotal: 700, cgst: 30.5, sgst: 30.5, tax: 61, total: 761 });
  });
  it("inter-state only when both states known and different", () => {
    expect(isInterState("29", "32")).toBe(true);
    expect(isInterState("", "32")).toBe(false);
    expect(isInterState("32", "")).toBe(false);
  });
});

describe("supplier balances", () => {
  const s = [{ id: "a", name: "A", openingBalance: 100 }];
  const bills = [
    { id: "b1", supplierId: "a", grandTotal: 1000, status: "posted", billDate: "2026-09-01" },
    { id: "b2", supplierId: "a", grandTotal: 500, status: "posted", billDate: "2026-09-10" },
    { id: "b3", supplierId: "a", grandTotal: 999, status: "cancelled", billDate: "2026-09-11" },
  ];
  const returns = [{ billId: "b2", supplierId: "a", grandTotal: 200 }];
  const pays = [{ supplierId: "a", amount: 600, status: "posted" }, { supplierId: "a", amount: 50, status: "voided" }];
  it("opening + bills − returns − payments; cancelled and voided ignored", () => {
    expect(supplierBalances(s, bills, returns, pays).get("a")).toBe(800);
  });
  it("paid status settles oldest first and agrees with the balance", () => {
    const st = billPaidStatus(s[0], bills, returns, pays);
    expect(st.get("b1")).toEqual({ due: 500, status: "partial" });
    expect(st.get("b2")).toEqual({ due: 300, status: "unpaid" });
    expect(st.get("b1")!.due + st.get("b2")!.due).toBe(800);
  });
});
