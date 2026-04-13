import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { createChainMock, createMockDeps } from "@/test/mock-supabase";

const mockFrom = vi.fn();
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: (...args: any[]) => mockFrom(...args) },
}));

import { useTargetsDomain } from "../useTargetsDomain";

function makeTarget(overrides = {}) {
  return {
    id: "t1", entityType: "salesperson" as const, entityId: "s1",
    entityName: "Ram", periodType: "monthly" as const, periodStart: "2026-04-01",
    targetRevenue: 50000, targetOrders: 20, ...overrides,
  };
}

describe("useTargetsDomain", () => {
  beforeEach(() => vi.clearAllMocks());

  it("addTarget — inserts and adds to state", async () => {
    const deps = createMockDeps();
    const chain = createChainMock({ data: { id: "t-new" }, error: null });
    mockFrom.mockReturnValue(chain);

    const { result } = renderHook(() => useTargetsDomain(deps));
    await act(async () => {
      await result.current.addTarget(makeTarget());
    });

    expect(mockFrom).toHaveBeenCalledWith("targets");
    expect(result.current.targets).toHaveLength(1);
    expect(result.current.targets[0].id).toBe("t-new");
  });

  it("deleteTarget — removes from state", async () => {
    const deps = createMockDeps();
    const chain = createChainMock({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    const { result } = renderHook(() => useTargetsDomain(deps));
    await act(async () => {
      result.current.setTargets([makeTarget()]);
    });

    await act(async () => {
      await result.current.deleteTarget("t1");
    });

    expect(result.current.targets).toHaveLength(0);
  });

  it("addSecondarySale — inserts and adds to state", async () => {
    const deps = createMockDeps();
    const chain = createChainMock({ data: { id: "ss-new" }, error: null });
    mockFrom.mockReturnValue(chain);

    const { result } = renderHook(() => useTargetsDomain(deps));
    await act(async () => {
      await result.current.addSecondarySale({
        id: "", distributorId: "d1", productId: "p1", productName: "Widget",
        retailerName: "Shop", quantity: 5, date: "2026-04-13", remarks: "",
      });
    });

    expect(result.current.secondarySales).toHaveLength(1);
  });

  it("addTarget with no companyId — does nothing", async () => {
    const deps = createMockDeps();
    deps.companyId = null;

    const { result } = renderHook(() => useTargetsDomain(deps));
    await act(async () => {
      await result.current.addTarget(makeTarget());
    });

    expect(mockFrom).not.toHaveBeenCalled();
    expect(result.current.targets).toHaveLength(0);
  });
});
