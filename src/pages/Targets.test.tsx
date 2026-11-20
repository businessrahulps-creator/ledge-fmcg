import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import Targets from "./Targets";

const mocks = vi.hoisted(() => ({ money: false, manage: false, update: vi.fn(), remove: vi.fn() }));
vi.mock("@/hooks/useCan", () => ({ useCan: (key: string) => key === "see_money" ? mocks.money : mocks.manage }));
vi.mock("@/hooks/use-loading", () => ({ usePageLoading: () => false }));
vi.mock("@/components/layout/AppLayout", () => ({ AppLayout: ({ children }: { children: React.ReactNode }) => children }));
vi.mock("@/services/api", async () => {
  const { toDateKey, istCalendarNow } = await import("@/utils/dateKey");
  const now = istCalendarNow();
  const period = toDateKey(new Date(now.getFullYear(), now.getMonth(), 1));
  return { useApi: () => ({ loading: false,
    salespersons: { list: () => [{ id: "s1", name: "Test person", region: "North" }] },
    dealers: { list: () => [{ id: "d1", name: "Test dealer", location: "North" }] },
    orders: { list: () => [{ id: "o1", salespersonId: "s1", distributorId: "d1", deliveryStatus: "delivered", deliveredAt: `${period}T09:00:00`, total: 500, schemeSavings: 0 }] },
    targets: {
      list: () => [
        { id: "t1", entityType: "salesperson", entityId: "s1", entityName: "Test person", periodType: "monthly", periodStart: period, targetRevenue: 1000, targetOrders: 4 },
        { id: "t2", entityType: "dealer", entityId: "d1", entityName: "Test dealer", periodType: "monthly", periodStart: period, targetRevenue: 2000, targetOrders: 4 },
      ], update: mocks.update, create: vi.fn(), remove: mocks.remove,
    },
  }) };
});

afterEach(() => { cleanup(); vi.clearAllMocks(); mocks.money = false; mocks.manage = false; });
function open(money: boolean, manage = false) {
  mocks.money = money; mocks.manage = manage;
  return render(<MemoryRouter><Targets /></MemoryRouter>);
}

describe("Targets financial access", () => {
  it("omits money and revenue-derived progress from both team and dealer targets without see_money", async () => {
    const { container } = open(false);
    expect(container.textContent).not.toMatch(/₹|1,000|2,000|50%/);
    expect(container.textContent).toContain("25%");
    expect(screen.getByPlaceholderText("e.g. 20")).toBeDisabled();
    expect(screen.queryByPlaceholderText("e.g. 100000")).not.toBeInTheDocument();
    fireEvent.mouseDown(screen.getByRole("tab", { name: "Dealers (1)" }), { button: 0, ctrlKey: false });
    await waitFor(() => expect(screen.getByText("Test dealer")).toBeInTheDocument());
    expect(container.textContent).not.toMatch(/₹|2,000|50%/);
    expect(container.textContent).toContain("25%");
  });

  it("preserves financial targets and actual sales with see_money", () => {
    const { container } = open(true, true);
    expect(container.textContent).toContain("1,000");
    expect(container.textContent).toContain("500");
    expect(container.textContent).toContain("50%");
    expect(screen.getByPlaceholderText("e.g. 100000")).toHaveValue("1000");
    expect(screen.getByPlaceholderText("e.g. 100000")).toBeEnabled();
  });

  it("lets an authorized non-money manager edit an order target without changing the hidden revenue target", async () => {
    mocks.update.mockResolvedValue(true);
    open(false, true);
    const orders = screen.getByPlaceholderText("e.g. 20");
    fireEvent.change(orders, { target: { value: "8" } });
    fireEvent.blur(orders);
    await waitFor(() => expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ id: "t1", targetRevenue: 1000, targetOrders: 8 })));
    expect(mocks.remove).not.toHaveBeenCalled();
  });

  it("clearing an order target preserves an existing hidden revenue goal instead of deleting it", async () => {
    mocks.update.mockResolvedValue(true);
    open(false, true);
    const orders = screen.getByPlaceholderText("e.g. 20");
    fireEvent.change(orders, { target: { value: "" } });
    fireEvent.blur(orders);
    await waitFor(() => expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ id: "t1", targetRevenue: 1000, targetOrders: 0 })));
    expect(mocks.remove).not.toHaveBeenCalled();
  });
});