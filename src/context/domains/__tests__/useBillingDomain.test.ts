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

describe("useBillingDomain", () => {
  beforeEach(() => vi.clearAllMocks());

  it("addInvoice — generates invoice number via RPC", async () => {
    const deps = makeDeps();
    mockRpc.mockResolvedValueOnce({ data: [{ prefix: "INV", seq: 1 }], error: null });

    const insertChain = createChainMock({ data: { id: "inv-1" }, error: null });
    const linesChain = createChainMock({ data: null, error: null });
    mockFrom.mockImplementation((table: string) => {
      if (table === "invoice_lines") return linesChain;
      return insertChain;
    });

    const { result } = renderHook(() => useBillingDomain(deps));
    let invoice: any;
    await act(async () => {
      invoice = await result.current.addInvoice(makeInvoice());
    });

    expect(invoice).not.toBeNull();
    expect(invoice.invoiceNumber).toMatch(/^INV-\d{4}-0001$/);
    expect(invoice.id).toBe("inv-1");
    expect(result.current.invoices).toHaveLength(1);
  });

  it("addInvoice — RPC error returns null", async () => {
    const deps = makeDeps();
    mockRpc.mockResolvedValueOnce({ data: null, error: { message: "RPC fail" } });

    const { result } = renderHook(() => useBillingDomain(deps));
    let invoice: any;
    await act(async () => {
      invoice = await result.current.addInvoice(makeInvoice());
    });

    expect(invoice).toBeNull();
  });

  it("deleteInvoice — blocks deletion of finalized invoice", async () => {
    const deps = makeDeps();
    const { result } = renderHook(() => useBillingDomain(deps));

    await act(async () => {
      result.current.setInvoices([{
        id: "inv-1", invoiceNumber: "INV-1", docType: "gst_invoice",
        invoiceDate: "2026-01-01", status: "final", lines: [],
        buyerName: "", buyerAddress: "", buyerGstin: "", buyerStateCode: "",
        sellerName: "", sellerAddress: "", sellerGstin: "", sellerPan: "",
        sellerStateCode: "", sellerPhone: "", sellerEmail: "",
        sellerBankName: "", sellerBankAccountName: "", sellerBankAccount: "", sellerBankIfsc: "",
        sellerLogoUrl: "", supplyType: "intra_state", gstRate: 18,
        subtotal: 0, cgstAmount: 0, sgstAmount: 0, igstAmount: 0,
        totalTax: 0, grandTotal: 0, roundOff: 0,
        amountInWords: "", notes: "", vehicle: "", driverName: "", createdAt: "2026-01-01",
      }]);
    });

    await act(async () => {
      await result.current.deleteInvoice("inv-1");
    });

    // Should NOT have called supabase delete
    expect(mockFrom).not.toHaveBeenCalled();
    // Invoice should still exist
    expect(result.current.invoices).toHaveLength(1);
  });

  it("addClaim with stock restore — calls stock update", async () => {
    const deps = makeDeps({
      getOrders: vi.fn().mockReturnValue([{ id: "o1", godownId: "g1" }]),
    });

    // reverse_dispatch_for_order rpc default
    mockRpc.mockResolvedValue({ data: null, error: null });

    // Mock claims insert
    const claimChain = createChainMock({ data: { id: "cl-1" }, error: null });
    const linesChain = createChainMock({ data: null, error: null });
    const stockSelectChain = createChainMock({ data: { id: "si-1", quantity: 50 }, error: null });
    const stockUpdateChain = createChainMock({ data: null, error: null });

    mockFrom.mockImplementation((table: string) => {
      if (table === "claim_lines") return linesChain;
      if (table === "stock_items") {
        // Return different chains for select vs update
        const chain = createChainMock({ data: { id: "si-1", quantity: 50 }, error: null });
        return chain;
      }
      return claimChain;
    });

    const { result } = renderHook(() => useBillingDomain(deps));
    let success: boolean;
    await act(async () => {
      success = await result.current.addClaim({
        id: "", orderId: "o1", orderNumber: "ORD-1",
        distributorId: "d1", distributorName: "Acme",
        claimType: "return", status: "open", reason: "Damaged",
        resolutionNotes: "", restoreStock: true, totalClaimValue: 500,
        lines: [{ productId: "p1", productName: "Widget", quantity: 5, unitPrice: 100, lineTotal: 500 }],
        createdAt: "", resolvedAt: null,
      });
    });

    expect(success!).toBe(true);
    expect(result.current.claims).toHaveLength(1);
    // Stock items table should have been accessed for restore
    expect(mockFrom).toHaveBeenCalledWith("stock_items");
    expect(deps.safeRefetchStockItems).toHaveBeenCalled();
  });

  it("updateClaim — sets resolvedAt when status is resolved", async () => {
    const deps = makeDeps();
    const chain = createChainMock({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    const { result } = renderHook(() => useBillingDomain(deps));
    await act(async () => {
      result.current.setClaims([{
        id: "cl-1", orderId: "o1", orderNumber: "ORD-1",
        distributorId: "d1", distributorName: "Acme",
        claimType: "return", status: "open", reason: "X",
        resolutionNotes: "", restoreStock: false, totalClaimValue: 100,
        lines: [], createdAt: "2026-01-01", resolvedAt: null,
      }]);
    });

    await act(async () => {
      await result.current.updateClaim("cl-1", { status: "resolved", resolutionNotes: "Fixed" });
    });

    expect(result.current.claims[0].status).toBe("resolved");
    expect(result.current.claims[0].resolvedAt).toBeTruthy();
  });
});
