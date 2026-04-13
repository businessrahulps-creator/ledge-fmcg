import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { createChainMock, createMockDeps } from "@/test/mock-supabase";

const mockFrom = vi.fn();
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: (...args: any[]) => mockFrom(...args) },
}));

vi.mock("@/lib/offline-store", () => ({
  cacheData: vi.fn(),
  enqueueMutation: vi.fn().mockResolvedValue(undefined),
}));

import { useStockDomain } from "../useStockDomain";
import { enqueueMutation } from "@/lib/offline-store";

function makeStockItem(overrides = {}) {
  return {
    id: "si1", productId: "p1", godownId: "g1",
    productName: "Widget", sku: "W01", unit: "Pack",
    godownName: "Main", quantity: 100, threshold: 10,
    basePrice: 250, lastDeductedDate: null,
    ...overrides,
  };
}

describe("useStockDomain", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, "onLine", { value: true, writable: true, configurable: true });
  });

  it("addStockItem online — upserts and adds to state", async () => {
    const deps = createMockDeps();
    const chain = createChainMock({ data: { id: "si-new" }, error: null });
    mockFrom.mockReturnValue(chain);

    const { result } = renderHook(() => useStockDomain(deps));
    await act(async () => {
      await result.current.addStockItem(makeStockItem());
    });

    expect(mockFrom).toHaveBeenCalledWith("stock_items");
    expect(result.current.stockItems).toHaveLength(1);
  });

  it("addStockItem offline — enqueues mutation", async () => {
    Object.defineProperty(navigator, "onLine", { value: false, configurable: true });
    const deps = createMockDeps();

    const { result } = renderHook(() => useStockDomain(deps));
    await act(async () => {
      await result.current.addStockItem(makeStockItem());
    });

    expect(enqueueMutation).toHaveBeenCalledWith(expect.objectContaining({ type: "upsert" }));
    expect(result.current.stockItems).toHaveLength(1);
  });

  it("deleteStockItem online — removes from state", async () => {
    const deps = createMockDeps();
    const chain = createChainMock({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    const { result } = renderHook(() => useStockDomain(deps));
    await act(async () => {
      result.current.setStockItems([makeStockItem()]);
    });

    await act(async () => {
      await result.current.deleteStockItem("si1");
    });

    expect(result.current.stockItems).toHaveLength(0);
  });

  it("deductStockForOrder — deducts and warns on negative", async () => {
    const deps = createMockDeps();
    // stock_items select returns existing item with low quantity
    const selectChain = createChainMock({ data: [{ id: "si1", product_id: "p1", godown_id: "g1", quantity: 3 }], error: null });
    const insertChain = createChainMock({ data: null, error: null });
    const updateChain = createChainMock({ data: null, error: null });
    // For refetch
    const refetchChain = createChainMock({ data: [], error: null });

    mockFrom.mockImplementation((table: string) => {
      if (table === "stock_deductions") return insertChain;
      if (table === "stock_items") return { ...selectChain, update: vi.fn().mockReturnValue(updateChain), insert: vi.fn().mockReturnValue(insertChain) };
      return refetchChain;
    });

    const { result } = renderHook(() => useStockDomain(deps));
    await act(async () => {
      await result.current.deductStockForOrder(
        "o1",
        [{ productId: "p1", productName: "Widget", quantity: 10, unitPrice: 100, lineTotal: 1000 }],
        "g1",
        "company-1"
      );
    });

    // Stock deductions table should have been called
    expect(mockFrom).toHaveBeenCalledWith("stock_deductions");
  });
});
