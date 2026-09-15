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

  it("addStockItem online — adjusts stock atomically and adds to state", async () => {
    const deps = createMockDeps();
    const chain = createChainMock({ data: { id: "si-new" }, error: null });
    mockFrom.mockReturnValue(chain);
    mockRpc.mockResolvedValue({ data: { stock_item_id: "si-new", delta: 100 }, error: null });

    const { result } = renderHook(() => useStockDomain(deps));
    await act(async () => {
      await result.current.addStockItem(makeStockItem());
    });

    expect(mockRpc).toHaveBeenCalledWith("adjust_stock_atomic", expect.objectContaining({ p_product_id: "p1", p_new_quantity: 100 }));
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

});
