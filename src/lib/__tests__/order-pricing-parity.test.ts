import { describe, it, expect } from "vitest";
import { computeOrderPricing, allocateLineDiscounts } from "@/lib/order-pricing";
import { billEquivalentTotal } from "@/lib/credit-exposure";
import type { Scheme } from "@/data/mock-data";

const base: Scheme = {
  id: "s", name: "s", description: "", schemeType: "flat_discount", discountPercent: 0,
  buyQty: 0, freeQty: 0, flatAmount: 0, minOrderValue: 0, minQty: 0,
  productId: null, dealerId: null, isActive: true, validFrom: "2000-01-01", validUntil: null,
};

describe("computeOrderPricing mirrors the server", () => {
  it("applies only the biggest non-combinable offer", () => {
    const p = computeOrderPricing(
      [{ productId: "a", quantity: 10, unitPrice: 100 }],
      [
        { ...base, id: "x", flatAmount: 100, isCombinable: false },
        { ...base, id: "y", flatAmount: 200, isCombinable: false },
      ],
      "d", "2026-01-01",
    );
    expect(p.totalSchemeSavings).toBe(200);
    expect(p.netTotal).toBe(800);
  });

  it("counts every line of the same product", () => {
    const p = computeOrderPricing(
      [{ productId: "a", quantity: 1, unitPrice: 100 }, { productId: "a", quantity: 1, unitPrice: 100 }],
      [{ ...base, schemeType: "percentage", discountPercent: 10, productId: "a" }],
      "d", "2026-01-01",
    );
    expect(p.totalSchemeSavings).toBe(20);
  });

  it("never saves more than the order is worth", () => {
    const p = computeOrderPricing(
      [{ productId: "a", quantity: 1, unitPrice: 100 }],
      [{ ...base, id: "x", flatAmount: 80 }, { ...base, id: "y", flatAmount: 80 }],
      "d", "2026-01-01",
    );
    expect(p.totalSchemeSavings).toBe(100);
  });

  it("keeps a product offer on its own GST rate", () => {
    const lines = [{ productId: "a", quantity: 1, unitPrice: 100 }, { productId: "b", quantity: 1, unitPrice: 100 }];
    const p = computeOrderPricing(lines, [{ ...base, flatAmount: 50, productId: "a" }], "d", "2026-01-01");
    const disc = allocateLineDiscounts(lines, p.appliedSchemes);
    expect(disc).toEqual([50, 0]);
    const rate = (id: string) => (id === "a" ? 5 : 18);
    expect(billEquivalentTotal(lines, rate, 50, { lineDiscounts: disc })).toBe(170.5);
  });
});
