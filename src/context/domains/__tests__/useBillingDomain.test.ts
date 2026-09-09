import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { createChainMock, createMockDeps } from "@/test/mock-supabase";

const mockFrom = vi.fn();
const mockRpc = vi.fn();
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (...args: any[]) => mockFrom(...args),
    rpc: (...args: any[]) => mockRpc(...args),
  },
}));

import { useBillingDomain } from "../useBillingDomain";

function makeDeps(overrides = {}) {
  return {
    ...createMockDeps(),
    getOrders: vi.fn().mockReturnValue([]),
    safeRefetchStockItems: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function makeInvoice(overrides = {}) {
  return {
    docType: "gst_invoice" as const,
    invoiceDate: "2026-04-13",
    buyerName: "Buyer", buyerAddress: "Addr", buyerGstin: "GSTIN", buyerStateCode: "07",
    sellerName: "Seller", sellerAddress: "SAddr", sellerGstin: "SGSTIN", sellerPan: "PAN",
    sellerStateCode: "07", sellerPhone: "123", sellerEmail: "s@x.com",
    sellerBankName: "SBI", sellerBankAccountName: "Acc", sellerBankAccount: "1234", sellerBankIfsc: "SBIN",
    sellerLogoUrl: "", supplyType: "intra_state" as const, gstRate: 18,
    subtotal: 1000, cgstAmount: 90, sgstAmount: 90, igstAmount: 0,
    totalTax: 180, grandTotal: 1180, roundOff: 0,
    amountInWords: "One Thousand", notes: "", status: "draft" as const, vehicle: "", driverName: "",
    lines: [{ productName: "Widget", hsnCode: "1234", quantity: 10, unit: "Pack", unitPrice: 100, taxableValue: 1000 }],
    ...overrides,
  };
}

describe("useBillingDomain — record return", () => {
  beforeEach(() => vi.clearAllMocks());

  it("recordReturn — posts good and damaged quantities through the atomic RPC", async () => {
    const deps = makeDeps();
    mockRpc.mockResolvedValueOnce({
      data: { ok: true, credit_note_number: "CN/2026-27/0001", grand_total: 1180, restocked: true },
      error: null,
    });
    mockFrom.mockImplementation(() => createChainMock({ data: [], error: null }));

    const { result } = renderHook(() => useBillingDomain(deps));
    let res: any;
    await act(async () => {
      res = await result.current.recordReturn(
        "order-1",
        [
          { invoiceLineId: "il-1", goodQty: 2, damagedQty: 1 },
          { invoiceLineId: "il-2", goodQty: 0, damagedQty: 0 },
        ],
        "Leaking bottles",
      );
    });

    expect(mockRpc).toHaveBeenCalledWith("record_return_and_credit_atomic", {
      p_order_id: "order-1",
      p_lines: [{ invoice_line_id: "il-1", good_qty: 2, damaged_qty: 1 }],
      p_reason: "Leaking bottles",
      p_godown_id: null,
    });
    expect(res).toEqual({ creditNoteNumber: "CN/2026-27/0001", grandTotal: 1180, restocked: true });
    expect(deps.safeRefetchStockItems).toHaveBeenCalled();
  });

  it("recordReturn — returns null when the server rejects the return", async () => {
    const deps = makeDeps();
    mockRpc.mockResolvedValueOnce({ data: null, error: { message: "You cannot return more than was billed" } });
    mockFrom.mockImplementation(() => createChainMock({ data: [], error: null }));

    const { result } = renderHook(() => useBillingDomain(deps));
    let res: any = "unset";
    await act(async () => {
      res = await result.current.recordReturn("order-1", [{ invoiceLineId: "il-1", goodQty: 99, damagedQty: 0 }], "");
    });
    expect(res).toBeNull();
  });
});
