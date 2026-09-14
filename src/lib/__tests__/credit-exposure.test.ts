import { describe, it, expect } from "vitest";
import { billEquivalentTotal, projectedExposure } from "@/lib/credit-exposure";

const rate = () => 18;

describe("billEquivalentTotal", () => {
  it("adds GST to the order value", () => {
    expect(billEquivalentTotal([{ productId: "p", quantity: 10, unitPrice: 100 }], rate)).toBe(1180);
  });

  it("applies scheme savings before tax", () => {
    expect(
      billEquivalentTotal([{ productId: "p", quantity: 10, unitPrice: 100 }], rate, 100),
    ).toBe(1062);
  });

  it("uses each product's own rate", () => {
    const mixed = billEquivalentTotal(
      [
        { productId: "a", quantity: 1, unitPrice: 100 },
        { productId: "b", quantity: 1, unitPrice: 100 },
      ],
      id => (id === "a" ? 5 : 28),
    );
    expect(mixed).toBe(233);
  });

  it("ignores empty or zero lines", () => {
    expect(billEquivalentTotal([{ productId: "", quantity: 5, unitPrice: 10 }], rate)).toBe(0);
  });
});

describe("projectedExposure", () => {
  it("adds the bill-equivalent to the canonical outstanding", () => {
    expect(projectedExposure(5000, 1180)).toBe(6180);
  });

  it("removes what this order already contributes when editing", () => {
    expect(projectedExposure(6180, 2360, 1180)).toBe(7360);
  });
});
