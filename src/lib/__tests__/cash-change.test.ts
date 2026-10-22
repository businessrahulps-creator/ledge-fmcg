import { describe, it, expect } from "vitest";
import { splitCashOverpay, isCashChange } from "../cash-change";

describe("cash overpay given back as change", () => {
  it("saves only the order amount: 6000 for 5617 saves 5617, change 383", () => {
    expect(splitCashOverpay(6000, 5617)).toEqual({ save: 5617, change: 383 });
  });
  it("exact pay gives no change", () => {
    expect(splitCashOverpay(5617, 5617)).toEqual({ save: 5617, change: 0 });
  });
  it("underpay keeps the full amount", () => {
    expect(splitCashOverpay(2000, 5617)).toEqual({ save: 2000, change: 0 });
  });
  it("only cash + give back counts as change now", () => {
    expect(isCashChange("cash", "refund")).toBe(true);
    expect(isCashChange("upi", "refund")).toBe(false);
    expect(isCashChange("cash", "dealer_credit")).toBe(false);
  });
});
