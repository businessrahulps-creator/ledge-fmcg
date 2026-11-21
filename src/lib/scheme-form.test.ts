import { describe, it, expect } from "vitest";
import { normalizeSchemeForm, validateSchemeForm, buyXGetYSummary, schemeProductIds, schemeFreeProductId, type SchemeForm } from "./scheme-form";

const base: SchemeForm = {
  name: "Test", description: "", schemeType: "percentage", discountPercent: 10, buyQty: 10, freeQty: 1,
  flatAmount: 500, minOrderValue: 0, minQty: 5, productId: null, productIds: null, freeProductId: null,
  dealerId: null, isActive: true, validFrom: "2026-11-20", validUntil: null,
};
const names: Record<string, string> = { rice: "Basmati Rice 5kg", oil: "Sunflower Oil 1L" };

describe("offer form rules", () => {
  it("Buy X Get Y drops min order value, min qty and product list", () => {
    const n = normalizeSchemeForm({ ...base, schemeType: "buy_x_get_y", productId: "rice", freeProductId: "oil", minOrderValue: 15000, minQty: 10, productIds: ["x"] });
    expect(n.minOrderValue).toBe(0);
    expect(n.minQty).toBe(0);
    expect(n.productIds).toBeNull();
    expect(n.freeProductId).toBe("oil");
  });
  it("Buy X Get Y with the same product stores no separate free product", () => {
    expect(normalizeSchemeForm({ ...base, schemeType: "buy_x_get_y", productId: "rice", freeProductId: "rice" }).freeProductId).toBeNull();
  });
  it("Percentage keeps several products and min order value", () => {
    const n = normalizeSchemeForm({ ...base, productIds: ["a", "b", "a"], minOrderValue: 5000, freeProductId: "oil" });
    expect(n.productIds).toEqual(["a", "b"]);
    expect(n.productId).toBe("a");
    expect(n.minOrderValue).toBe(5000);
    expect(n.freeProductId).toBeNull();
  });
  it("Flat with no products picked applies to all products", () => {
    const n = normalizeSchemeForm({ ...base, schemeType: "flat_discount", productIds: [] });
    expect(n.productIds).toBeNull();
    expect(n.productId).toBeNull();
  });
  it("Buy X Get Y needs a product to buy", () => {
    expect(validateSchemeForm({ ...base, schemeType: "buy_x_get_y" })).toMatch(/product to buy/);
    expect(validateSchemeForm({ ...base, schemeType: "buy_x_get_y", productId: "rice" })).toBeNull();
  });
  it("summary names the different free product", () => {
    expect(buyXGetYSummary({ buyQty: 10, freeQty: 1, productId: "rice", freeProductId: "oil" }, id => names[id]))
      .toBe("For every 10 Basmati Rice 5kg bought, the dealer gets 1 Sunflower Oil 1L free (₹0).");
  });
  it("old offers with one product still read as that product", () => {
    expect(schemeProductIds({ productId: "rice", productIds: null })).toEqual(["rice"]);
    expect(schemeFreeProductId({ productId: "rice", freeProductId: null })).toBe("rice");
  });
});

describe("blank number boxes", () => {
  const base = { name: "X", description: "", productId: "p1", productIds: null, freeProductId: null, dealerId: null, isActive: true, validFrom: "2026-11-20", validUntil: null, minQty: 0 } as any;
  it("asks for buy quantity when blank", () => {
    expect(validateSchemeForm({ ...base, schemeType: "buy_x_get_y", freeQty: 1 })).toBe("Enter the buy quantity.");
  });
  it("asks for free quantity when blank", () => {
    expect(validateSchemeForm({ ...base, schemeType: "buy_x_get_y", buyQty: 10 })).toBe("Enter the free quantity.");
  });
  it("asks for discount percentage when blank", () => {
    expect(validateSchemeForm({ ...base, schemeType: "percentage" })).toBe("Enter a discount percentage.");
  });
  it("asks for flat amount when blank", () => {
    expect(validateSchemeForm({ ...base, schemeType: "flat_discount" })).toBe("Enter a discount amount.");
  });
  it("blank min order value saves as 0", () => {
    expect(normalizeSchemeForm({ ...base, schemeType: "percentage", discountPercent: 5 }).minOrderValue).toBe(0);
  });
});

import { describe as d2, it as i2, expect as e2 } from "vitest";
import { normalizeSchemeForm as n2, validateSchemeForm as v2 } from "./scheme-form";
d2("offer product scope", () => {
  const base: any = { name: "X", schemeType: "percentage", discountPercent: 10, productId: "p1", productIds: null };
  i2("leftover productId with no list saves as all products", () => {
    const r = n2(base); e2(r.productIds).toBeNull(); e2(r.productId).toBeNull();
  });
  i2("empty selection is refused", () => {
    e2(v2({ ...base, productIds: [] })).toMatch(/at least one product/);
  });
  i2("picked list saves as-is", () => {
    e2(n2({ ...base, productIds: ["p2", "p3"] }).productIds).toEqual(["p2", "p3"]);
  });
  i2("buy x get y keeps its product", () => {
    const r = n2({ ...base, schemeType: "buy_x_get_y", buyQty: 2, freeQty: 1 });
    e2(r.productId).toBe("p1"); e2(v2({ ...base, schemeType: "buy_x_get_y", buyQty: 2, freeQty: 1, productIds: [] })).toBeNull();
  });
});
