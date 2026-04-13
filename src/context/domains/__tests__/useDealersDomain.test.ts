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

import { useDealersDomain } from "../useDealersDomain";
import { enqueueMutation } from "@/lib/offline-store";

function makeDealer(overrides = {}) {
  return {
    id: "d1", name: "Acme Dist", location: "Mumbai", contact: "9876543210",
    email: "", address: "", gstin: "", pan: "", stateCode: "",
    bankName: "", bankAccountName: "", bankAccount: "", bankIfsc: "",
    totalOrders: 0, totalValue: 0, creditLimit: 0, outstandingAmount: 0,
    ...overrides,
  };
}

describe("useDealersDomain", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, "onLine", { value: true, writable: true, configurable: true });
  });

  it("add dealer online — inserts and adds to state", async () => {
    const deps = createMockDeps();
    const chain = createChainMock({ data: { id: "d-new" }, error: null });
    mockFrom.mockReturnValue(chain);

    const { result } = renderHook(() => useDealersDomain(deps));
    await act(async () => {
      await result.current.addDistributor(makeDealer());
    });

    expect(mockFrom).toHaveBeenCalledWith("distributors");
    expect(result.current.distributors).toHaveLength(1);
    expect(result.current.distributors[0].id).toBe("d-new");
  });

  it("add dealer offline — enqueues mutation", async () => {
    Object.defineProperty(navigator, "onLine", { value: false, configurable: true });
    const deps = createMockDeps();

    const { result } = renderHook(() => useDealersDomain(deps));
    await act(async () => {
      await result.current.addDistributor(makeDealer());
    });

    expect(enqueueMutation).toHaveBeenCalledWith(expect.objectContaining({ type: "insert", table: "distributors" }));
    expect(result.current.distributors).toHaveLength(1);
  });

  it("delete dealer online — removes from state", async () => {
    const deps = createMockDeps();
    const chain = createChainMock({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    const { result } = renderHook(() => useDealersDomain(deps));
    await act(async () => {
      result.current.setDistributors([makeDealer()]);
    });

    await act(async () => {
      await result.current.deleteDistributor("d1");
    });

    expect(result.current.distributors).toHaveLength(0);
  });
});
