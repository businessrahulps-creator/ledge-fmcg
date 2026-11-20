import { describe, expect, it } from "vitest";
import { isReturnableBill } from "./return-bill-eligibility";

const issuedBill = {
  docType: "gst_invoice" as const,
  supplyType: "intra_state" as const,
  status: "final",
  sourceOrderId: "order-1",
};

describe("return bill eligibility", () => {
  it.each(["posted", "partial", "paid"])("accepts an issued %s GST bill", status => {
    expect(isReturnableBill({ ...issuedBill, status })).toBe(true);
  });
  it.each(["posted", "partial", "paid"])("accepts an issued %s Bill of Supply", status => {
    expect(isReturnableBill({ ...issuedBill, supplyType: "bill_of_supply", status })).toBe(true);
  });
  it("accepts a final intrastate GST bill linked to an order", () => {
    expect(isReturnableBill(issuedBill)).toBe(true);
  });
  it("accepts a final interstate GST bill", () => {
    expect(isReturnableBill({ ...issuedBill, supplyType: "inter_state" })).toBe(true);
  });
  it("accepts a final Bill of Supply stored as gst_invoice", () => {
    expect(isReturnableBill({ ...issuedBill, supplyType: "bill_of_supply" })).toBe(true);
  });
  it.each(["intra_state", "inter_state", "bill_of_supply"] as const)("rejects an unissued %s draft", supplyType => {
    expect(isReturnableBill({ ...issuedBill, supplyType, status: "draft" })).toBe(false);
  });
  it("rejects a cancelled document", () => {
    expect(isReturnableBill({ ...issuedBill, status: "cancelled" })).toBe(false);
  });
  it("rejects an unknown document status", () => {
    expect(isReturnableBill({ ...issuedBill, status: "unknown" })).toBe(false);
  });
  it.each(["estimate", "proforma", "credit_note"] as const)("rejects %s documents", docType => {
    expect(isReturnableBill({ ...issuedBill, docType })).toBe(false);
  });
  it.each([undefined, ""])("rejects a bill with no source order (%s)", sourceOrderId => {
    expect(isReturnableBill({ ...issuedBill, sourceOrderId })).toBe(false);
  });
});