import { describe, it, expect } from "vitest";
import { computeFreeLines, computeOrderPricing } from "@/lib/order-pricing";
import type { Scheme } from "@/data/mock-data";

const bxgy: Scheme = {
  id: "s1", name: "Rice offer", description: "", schemeType: "buy_x_get_y", discountPercent: 0,
  buyQty: 10, freeQty: 1, flatAmount: 0, minOrderValue: 0, minQty: 0, productId: "rice",
  freeProductId: "oil", dealerId: null, isActive: true, validFrom: "2026-01-01", validUntil: null,
};
const D = "2026-11-20";
const rice = (q: number) => [{ productId: "rice", quantity: q, unitPrice: 300 }];

describe("Buy X Get Y free items", () => {
  it("10 bought gives 1 free of the different product", () => {
    expect(computeFreeLines(rice(10), [bxgy], "d", D)).toEqual([
      expect.objectContaining({ productId: "oil", quantity: 1, schemeId: "s1" }),
    ]);
  });
  it("20 bought gives 2 free", () => {
    expect(computeFreeLines(rice(20), [bxgy], "d", D)[0].quantity).toBe(2);
  });
  it("below 10 gives no free item", () => {
    expect(computeFreeLines(rice(9), [bxgy], "d", D)).toEqual([]);
  });
  it("same product when no free product is named", () => {
    expect(computeFreeLines(rice(10), [{ ...bxgy, freeProductId: null }], "d", D)[0].productId).toBe("rice");
  });
  it("free item does not also reduce the bill", () => {
    const p = computeOrderPricing(rice(20), [bxgy], "d", D);
    expect(p.totalSchemeSavings).toBe(0);
    expect(p.netTotal).toBe(6000);
  });
});

describe("multi-product offers", () => {
  const pct: Scheme = { ...bxgy, id: "p", schemeType: "percentage", discountPercent: 10, productId: "a", productIds: ["a", "b"], freeProductId: null };
  it("percentage applies to every picked product only", () => {
    const lines = [
      { productId: "a", quantity: 1, unitPrice: 100 },
      { productId: "b", quantity: 1, unitPrice: 200 },
      { productId: "c", quantity: 1, unitPrice: 500 },
    ];
    expect(computeOrderPricing(lines, [pct], "d", D).totalSchemeSavings).toBe(30);
  });
  it("flat applies only when a picked product is on the order", () => {
    const flat: Scheme = { ...pct, id: "f", schemeType: "flat_discount", flatAmount: 500, minOrderValue: 10000 };
    const big = [{ productId: "b", quantity: 50, unitPrice: 200 }];
    expect(computeOrderPricing(big, [flat], "d", D).totalSchemeSavings).toBe(500);
    expect(computeOrderPricing([{ productId: "c", quantity: 50, unitPrice: 200 }], [flat], "d", D).totalSchemeSavings).toBe(0);
    expect(computeOrderPricing([{ productId: "b", quantity: 49, unitPrice: 200 }], [flat], "d", D).totalSchemeSavings).toBe(0);
  });
});
