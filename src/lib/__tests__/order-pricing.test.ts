import { describe, it, expect } from "vitest";
import { computeOrderPricing } from "../order-pricing";
import type { Scheme } from "@/data/mock-data";

const baseScheme: Scheme = {
  id: "s1",
  name: "Test Scheme",
  description: "",
  schemeType: "percentage",
  discountPercent: 0,
  buyQty: 0,
  freeQty: 0,
  flatAmount: 0,
  minOrderValue: 0,
  minQty: 0,
  productId: null,
  dealerId: null,
  isActive: true,
  validFrom: "2020-01-01",
  validUntil: null,
};

const lines = [
  { productId: "p1", quantity: 10, unitPrice: 100 },
  { productId: "p2", quantity: 5, unitPrice: 200 },
];

describe("computeOrderPricing", () => {
  it("returns correct gross total with no schemes", () => {
    const result = computeOrderPricing(lines, [], "d1");
    expect(result.grossTotal).toBe(2000); // 10*100 + 5*200
    expect(result.totalSchemeSavings).toBe(0);
    expect(result.netTotal).toBe(2000);
    expect(result.appliedSchemes).toHaveLength(0);
  });

  it("applies percentage scheme on full order", () => {
    const schemes: Scheme[] = [{ ...baseScheme, schemeType: "percentage", discountPercent: 10 }];
    const result = computeOrderPricing(lines, schemes, "d1");
    expect(result.totalSchemeSavings).toBe(200); // 10% of 2000
    expect(result.netTotal).toBe(1800);
    expect(result.appliedSchemes[0].label).toBe("10% off");
  });

  it("applies percentage scheme on specific product", () => {
    const schemes: Scheme[] = [{
      ...baseScheme, schemeType: "percentage", discountPercent: 20, productId: "p2",
    }];
    const result = computeOrderPricing(lines, schemes, "d1");
    // 20% of (5 * 200) = 200
    expect(result.totalSchemeSavings).toBe(200);
    expect(result.netTotal).toBe(1800);
  });

  it("applies flat_discount scheme", () => {
    const schemes: Scheme[] = [{
      ...baseScheme, id: "s2", schemeType: "flat_discount", flatAmount: 500,
    }];
    const result = computeOrderPricing(lines, schemes, "d1");
    expect(result.totalSchemeSavings).toBe(500);
    expect(result.netTotal).toBe(1500);
  });

  it("applies buy_x_get_y scheme on specific product", () => {
    const schemes: Scheme[] = [{
      ...baseScheme, id: "s3", schemeType: "buy_x_get_y", buyQty: 5, freeQty: 1, productId: "p1",
    }];
    const result = computeOrderPricing(lines, schemes, "d1");
    // p1 has qty 10, sets = floor(10/5) = 2, savings = 2 * 1 * 100 = 200
    expect(result.totalSchemeSavings).toBe(200);
    expect(result.appliedSchemes[0].label).toBe("Buy 5 Get 1 Free");
  });

  it("applies buy_x_get_y scheme across all products (no productId)", () => {
    const schemes: Scheme[] = [{
      ...baseScheme, id: "s4", schemeType: "buy_x_get_y", buyQty: 5, freeQty: 1, productId: null,
    }];
    const result = computeOrderPricing(lines, schemes, "d1");
    // totalQty = 15, sets = floor(15/5) = 3, savings = 3 * 1 * 200 (highest price) = 600
    expect(result.totalSchemeSavings).toBe(600);
  });

  it("filters by dealer ID", () => {
    const schemes: Scheme[] = [{ ...baseScheme, discountPercent: 10, dealerId: "d2" }];
    const result = computeOrderPricing(lines, schemes, "d1");
    expect(result.totalSchemeSavings).toBe(0);

    const result2 = computeOrderPricing(lines, schemes, "d2");
    expect(result2.totalSchemeSavings).toBe(200);
  });

  it("filters by min order value", () => {
    const schemes: Scheme[] = [{ ...baseScheme, discountPercent: 10, minOrderValue: 5000 }];
    const result = computeOrderPricing(lines, schemes, "d1");
    expect(result.totalSchemeSavings).toBe(0);
  });

  it("filters by min qty", () => {
    const schemes: Scheme[] = [{ ...baseScheme, discountPercent: 10, minQty: 20 }];
    const result = computeOrderPricing(lines, schemes, "d1");
    // totalQty = 15 < 20
    expect(result.totalSchemeSavings).toBe(0);
  });

  it("filters by date range", () => {
    const expiredScheme: Scheme[] = [{
      ...baseScheme, discountPercent: 10, validUntil: "2020-12-31",
    }];
    const result = computeOrderPricing(lines, expiredScheme, "d1", "2026-04-01");
    expect(result.totalSchemeSavings).toBe(0);
  });

  it("filters inactive schemes", () => {
    const schemes: Scheme[] = [{ ...baseScheme, discountPercent: 10, isActive: false }];
    const result = computeOrderPricing(lines, schemes, "d1");
    expect(result.totalSchemeSavings).toBe(0);
  });

  it("net total never goes below 0", () => {
    const schemes: Scheme[] = [{ ...baseScheme, schemeType: "flat_discount", flatAmount: 999999 }];
    const result = computeOrderPricing(lines, schemes, "d1");
    expect(result.netTotal).toBe(0);
  });

  it("applies multiple schemes correctly", () => {
    const schemes: Scheme[] = [
      { ...baseScheme, id: "s1", schemeType: "percentage", discountPercent: 10 },
      { ...baseScheme, id: "s2", schemeType: "flat_discount", flatAmount: 100 },
    ];
    const result = computeOrderPricing(lines, schemes, "d1");
    expect(result.totalSchemeSavings).toBe(300); // 200 + 100
    expect(result.appliedSchemes).toHaveLength(2);
  });

  it("ignores lines with no productId or zero quantity", () => {
    const mixedLines = [
      { productId: "", quantity: 10, unitPrice: 100 },
      { productId: "p1", quantity: 0, unitPrice: 100 },
      { productId: "p2", quantity: 5, unitPrice: 200 },
    ];
    const result = computeOrderPricing(mixedLines, [], "d1");
    expect(result.grossTotal).toBe(1000); // only p2
  });
});
