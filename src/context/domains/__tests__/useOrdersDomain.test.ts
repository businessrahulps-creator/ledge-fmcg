import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { createChainMock, createMockDeps } from "@/test/mock-supabase";

// Mock supabase client
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

vi.mock("@/utils/activityLog", () => ({
  logActivity: vi.fn(),
  fmtAmount: (n: number) => `₹${n}`,
}));

import { useOrdersDomain } from "../useOrdersDomain";
import { enqueueMutation } from "@/lib/offline-store";

function makeDeps(overrides = {}) {
  return {
    ...createMockDeps(),
    deductStockForOrder: vi.fn().mockResolvedValue(undefined),
    safeRefetchStockItems: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function makeOrder(overrides = {}) {
  return {
    id: "", orderNumber: "", date: "2026-04-13",
    distributorId: "d1", distributorName: "Acme",
    salespersonId: "s1", salesperson: "John",
    lines: [{ productId: "p1", productName: "Widget", quantity: 10, unitPrice: 100, lineTotal: 1000 }],
    total: 1000, paymentMode: "cash" as const, paymentStatus: "pending" as const,
    deliveryStatus: "pending" as const, dispatchDate: "",
    vehicle: "", driverName: "", dispatchRemarks: "",
    schemeSavings: 0, appliedSchemes: [],
    ...overrides,
  };
}

describe("useOrdersDomain", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, "onLine", { value: true, writable: true, configurable: true });
  });

  it("previewOrderNumber returns correct format", () => {
    const deps = makeDeps();
    const { result } = renderHook(() => useOrdersDomain(deps));
    const preview = result.current.previewOrderNumber();
    expect(preview).toMatch(/^ORD-\d{4}-0001$/);
  });

  it("addOrder online — calls RPC and adds to state", async () => {
    const deps = makeDeps();
    const insertedId = "uuid-new";
    const orderNumber = "ORD-2026-0001";

    mockRpc.mockResolvedValueOnce({
      data: [{ id: insertedId, order_number: orderNumber, seq: 1 }],
      error: null,
    });

    // Mock order_lines insert
    const linesChain = createChainMock({ data: null, error: null });
    mockFrom.mockReturnValue(linesChain);

    const { result } = renderHook(() => useOrdersDomain(deps));
    let addResult: any;
    await act(async () => {
      addResult = await result.current.addOrder(makeOrder());
    });

    expect(addResult.success).toBe(true);
    expect(addResult.orderNumber).toBe(orderNumber);
    expect(mockRpc).toHaveBeenCalledWith("insert_order_atomic", expect.objectContaining({
      p_company_id: "company-1",
      p_distributor_id: "d1",
    }));
    expect(result.current.orders).toHaveLength(1);
    expect(result.current.orders[0].id).toBe(insertedId);
    expect(deps.log).toHaveBeenCalledWith("order", insertedId, "created", expect.stringContaining("ORD-2026-0001"));
  });

  it("addOrder online — RPC error returns failure", async () => {
    const deps = makeDeps();
    mockRpc.mockResolvedValueOnce({ data: null, error: { message: "DB error" } });

    const { result } = renderHook(() => useOrdersDomain(deps));
    let addResult: any;
    await act(async () => {
      addResult = await result.current.addOrder(makeOrder());
    });

    expect(addResult.success).toBe(false);
    expect(addResult.error).toBe("DB error");
  });

  it("addOrder offline — enqueues mutation and uses temp ID", async () => {
    Object.defineProperty(navigator, "onLine", { value: false, configurable: true });
    const deps = makeDeps();

    const { result } = renderHook(() => useOrdersDomain(deps));
    let addResult: any;
    await act(async () => {
      addResult = await result.current.addOrder(makeOrder());
    });

    expect(addResult.success).toBe(true);
    expect(addResult.orderNumber).toMatch(/^ORD-\d{4}-0001$/);
    expect(enqueueMutation).toHaveBeenCalledWith(expect.objectContaining({ type: "insert_order_atomic" }));
    expect(result.current.orders).toHaveLength(1);
    // Sequence should have incremented
    expect(result.current.orderSequence).toBe(2);
  });

  it("addOrder with no companyId returns error", async () => {
    const deps = makeDeps({ companyId: null });
    const { result } = renderHook(() => useOrdersDomain(deps));
    let addResult: any;
    await act(async () => {
      addResult = await result.current.addOrder(makeOrder());
    });
    expect(addResult.success).toBe(false);
  });

  it("updateOrder — dispatched triggers stock deduction", async () => {
    const deps = makeDeps();
    const chain = createChainMock({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    const { result } = renderHook(() => useOrdersDomain(deps));
    // Seed an order in state
    await act(async () => {
      result.current.setOrders([makeOrder({ id: "o1", orderNumber: "ORD-1", godownId: "g1" })]);
    });

    await act(async () => {
      await result.current.updateOrder("o1", { deliveryStatus: "dispatched" });
    });

    expect(deps.deductStockForOrder).toHaveBeenCalledWith(
      "o1", expect.any(Array), "g1", "company-1"
    );
  });

  it("updateOrder — delivered after dispatched does NOT re-deduct", async () => {
    const deps = makeDeps();
    const chain = createChainMock({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    const { result } = renderHook(() => useOrdersDomain(deps));
    await act(async () => {
      result.current.setOrders([makeOrder({ id: "o1", orderNumber: "ORD-1", godownId: "g1", deliveryStatus: "dispatched" })]);
    });

    await act(async () => {
      await result.current.updateOrder("o1", { deliveryStatus: "delivered" });
    });

    expect(deps.deductStockForOrder).not.toHaveBeenCalled();
  });

  it("deleteOrder online — cascading delete", async () => {
    const deps = makeDeps();
    const deleteChain = createChainMock({ data: [{ id: "o1" }], error: null });
    mockFrom.mockReturnValue(deleteChain);

    const { result } = renderHook(() => useOrdersDomain(deps));
    await act(async () => {
      result.current.setOrders([makeOrder({ id: "o1", orderNumber: "ORD-1" })]);
    });

    let deleted: boolean;
    await act(async () => {
      deleted = await result.current.deleteOrder("o1");
    });

    expect(deleted!).toBe(true);
    expect(result.current.orders).toHaveLength(0);
    expect(mockFrom).toHaveBeenCalledWith("stock_deductions");
    expect(mockFrom).toHaveBeenCalledWith("order_schemes");
    expect(mockFrom).toHaveBeenCalledWith("order_lines");
    expect(mockFrom).toHaveBeenCalledWith("orders");
    expect(deps.safeRefetchStockItems).toHaveBeenCalled();
  });

  it("deleteOrder offline — returns false", async () => {
    Object.defineProperty(navigator, "onLine", { value: false, configurable: true });
    const deps = makeDeps();

    const { result } = renderHook(() => useOrdersDomain(deps));
    let deleted: boolean;
    await act(async () => {
      deleted = await result.current.deleteOrder("o1");
    });

    expect(deleted!).toBe(false);
  });
});
