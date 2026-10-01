import { describe, it, expect } from "vitest";
import { GST_RATES, calcLine } from "@/lib/payables";

describe("purchase GST rates", () => {
  it("offers every rate the database accepts", () => {
    expect([...GST_RATES]).toEqual([0, 0.25, 3, 5, 12, 18, 28]);
  });
  it("works out 3% GST correctly", () => {
    const l = calcLine({ quantity: 10, rate: 100, gstRate: 3 }, false);
    expect(l.taxable).toBe(1000);
    expect(l.cgst + l.sgst).toBe(30);
  });
});
