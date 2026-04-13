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

import { useCatalogDomain } from "../useCatalogDomain";

function makeProduct(overrides = {}) {
  return { id: "p1", name: "Widget", sku: "W01", unit: "Pack", basePrice: 250, hsnCode: "", totalSold: 0, ...overrides };
}

function makeScheme(overrides = {}) {
  return {
    id: "sch1", name: "Diwali", description: "Festive", schemeType: "percentage" as const,
    discountPercent: 10, buyQty: 0, freeQty: 0, flatAmount: 0,
    minOrderValue: 0, minQty: 0, productId: null, dealerId: null,
    isActive: true, validFrom: "2026-01-01", validUntil: null,
    ...overrides,
  };
}

describe("useCatalogDomain", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, "onLine", { value: true, writable: true, configurable: true });
  });

  it("add product online — inserts and updates state", async () => {
    const deps = createMockDeps();
    const chain = createChainMock({ data: { id: "p-new" }, error: null });
    mockFrom.mockReturnValue(chain);

    const { result } = renderHook(() => useCatalogDomain(deps));
    await act(async () => {
      await result.current.addProduct(makeProduct());
    });

    expect(mockFrom).toHaveBeenCalledWith("products");
    expect(result.current.rawProducts).toHaveLength(1);
  });

  it("add scheme online — inserts and updates state", async () => {
    const deps = createMockDeps();
    const chain = createChainMock({ data: { id: "sch-new" }, error: null });
    mockFrom.mockReturnValue(chain);

    const { result } = renderHook(() => useCatalogDomain(deps));
    await act(async () => {
      await result.current.addScheme(makeScheme());
    });

    expect(mockFrom).toHaveBeenCalledWith("schemes");
    expect(result.current.schemes).toHaveLength(1);
  });

  it("delete product — removes from state", async () => {
    const deps = createMockDeps();
    const chain = createChainMock({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    const { result } = renderHook(() => useCatalogDomain(deps));
    await act(async () => {
      result.current.setProducts([makeProduct()]);
    });

    await act(async () => {
      await result.current.deleteProduct("p1");
    });

    expect(result.current.rawProducts).toHaveLength(0);
  });
});
