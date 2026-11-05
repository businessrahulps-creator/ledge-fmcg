import { describe, expect, it } from "vitest";
import { pendingOrderGstProducts } from "../order-billing";

const lines = [{ productId: "juice" }];
const unconfirmed = [{ id: "juice", name: "Juice", gstRate: null, gstRateConfirmed: false }];
const gstin = "32ABCDE1234F1Z5";

describe("order billing GST gate", () => {
  it.each([undefined, null, "", "   "])("does not block a no-GST business (%s)", value => {
    expect(pendingOrderGstProducts(value, false, lines, unconfirmed)).toEqual([]);
  });

  it("still requires a GST rate for a registered business", () => {
    expect(pendingOrderGstProducts(gstin, false, lines, unconfirmed)).toEqual(["Juice"]);
  });

  it("still requires confirmation of an existing GST rate", () => {
    expect(pendingOrderGstProducts(gstin, false, lines, [{ ...unconfirmed[0], gstRate: 18 }])).toEqual(["Juice"]);
  });

  it("allows a confirmed zero GST rate", () => {
    expect(pendingOrderGstProducts(gstin, false, lines, [{ ...unconfirmed[0], gstRate: 0, gstRateConfirmed: true }])).toEqual([]);
  });

  it("does not recheck GST rates on an already saved bill", () => {
    expect(pendingOrderGstProducts(gstin, true, lines, unconfirmed)).toEqual([]);
  });

  it("reports a repeated product only once", () => {
    expect(pendingOrderGstProducts(gstin, false, [...lines, ...lines], unconfirmed)).toEqual(["Juice"]);
  });
});