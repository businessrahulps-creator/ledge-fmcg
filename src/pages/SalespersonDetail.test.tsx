import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import SalespersonDetail from "./SalespersonDetail";

const access = vi.hoisted(() => ({ money: false, targetOrders: 4 }));
vi.mock("@/hooks/useCan", () => ({ useCan: () => access.money }));
// Mirrors the server summary: money fields are null without see_money.
vi.mock("@/hooks/use-target-achievement", async () => {
  const actual = await vi.importActual<typeof import("@/hooks/use-target-achievement")>("@/hooks/use-target-achievement");
  return { ...actual, useTargetAchievement: () => ({ data: [{ entityType: "salesperson", entityId: "person-1",
    gross: access.money ? 500 : null, returnsDeducted: access.money ? 0 : null, returnsOnEarlierOrders: access.money ? 0 : null, net: access.money ? 500 : null,
    deliveredCount: 1, fullyReturnedCount: 0 }] }) };
});
vi.mock("@/components/layout/AppLayout", () => ({ AppLayout: ({ children }: { children: React.ReactNode }) => children }));
vi.mock("@/components/layout/EntityHistory", () => ({ EntityHistory: () => null }));
vi.mock("@/hooks/useShopVisits", () => ({ useShopVisits: () => ({ prospects: [] }) }));
vi.mock("@/hooks/useReceivables", () => ({ useReceivables: () => ({ paymentStatus: new Map([["order-1", "paid"]]) }) }));
vi.mock("@/services/api", async () => {
  const { toDateKey, istCalendarNow } = await import("@/utils/dateKey");
  const today = toDateKey(istCalendarNow());
  return { useApi: () => ({
    loading: false,
    companyInfo: { name: "Test business" },
    salespersons: { list: () => [{ id: "person-1", name: "Test person", phone: "123", email: "test@example.test", region: "North", totalValue: 9876 }] },
    dealers: { list: () => [] },
    orders: { list: () => [{ id: "order-1", salespersonId: "person-1", orderNumber: "TEST-1", distributorName: "Test dealer", date: today, total: 500, schemeSavings: 0, paymentStatus: "paid" }] },
    targets: { list: () => [{ entityType: "salesperson", entityId: "person-1", periodType: "daily", periodStart: today, targetRevenue: 1000, targetOrders: access.targetOrders }] },
  }) };
});

afterEach(() => { cleanup(); access.money = false; access.targetOrders = 4; });
function open(money: boolean) {
  access.money = money;
  return render(<MemoryRouter initialEntries={["/salespersons/person-1"]}><Routes><Route path="/salespersons/:id" element={<SalespersonDetail />} /></Routes></MemoryRouter>);
}

describe("salesperson detail money access", () => {
  it("omits all financial values and the financial PDF without see_money", () => {
    const { container } = open(false);
    expect(container.textContent).not.toMatch(/₹|9,876|500|1,000/);
    expect(screen.queryByRole("button", { name: "Statement PDF" })).not.toBeInTheDocument();
    expect(screen.getAllByText("TEST-1")).toHaveLength(2);
    expect(container.textContent).toContain("25%");
    expect(container.textContent).not.toContain("50%");
  });

  it("preserves financial values, statement access and revenue achievement with see_money", () => {
    const { container } = open(true);
    expect(container.textContent).toContain("9,876");
    expect(container.textContent).toContain("500");
    expect(container.textContent).toContain("1,000");
    expect(screen.getByRole("button", { name: "Statement PDF" })).toBeEnabled();
    expect(container.textContent).toContain("50%");
  });

  it("does not disclose achievement for a revenue-only target without money access", () => {
    access.targetOrders = 0;
    open(false);
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(screen.getAllByText("TEST-1")).toHaveLength(2);
  });
});