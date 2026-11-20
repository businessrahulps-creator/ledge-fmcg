import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import DealerDetail from "./DealerDetail";

const mocks = vi.hoisted(() => ({ money: false, share: vi.fn() }));
vi.mock("@/hooks/useCan", () => ({ useCan: (key: string) => key === "see_money" && mocks.money }));
vi.mock("@/components/layout/AppLayout", () => ({ AppLayout: ({ children }: { children: React.ReactNode }) => children }));
vi.mock("@/components/layout/EntityHistory", () => ({ EntityHistory: () => null }));
vi.mock("@/components/visits/DealerVisitsPanel", () => ({ DealerVisitsPanel: () => <div>Test visits</div> }));
vi.mock("@/utils/shareWhatsApp", () => ({ shareDealerOnWhatsApp: mocks.share }));
vi.mock("@/hooks/useReceivables", () => ({ useReceivables: () => ({ rows: [], receipts: [], creditNotes: [], advances: new Map(), paymentStatus: new Map([["o1", "paid"]]), ready: true }) }));
vi.mock("@/services/api", async () => {
  const { toDateKey, istCalendarNow } = await import("@/utils/dateKey");
  const today = toDateKey(istCalendarNow());
  return { useApi: () => ({ loading: false, companyInfo: { name: "Business" },
    dealers: { list: () => [{ id: "d1", name: "Test dealer", location: "North", contact: "123", totalOrders: 1, totalValue: 9876, creditLimit: 5000, outstandingAmount: 300 }] },
    orders: { list: () => [{ id: "o1", distributorId: "d1", orderNumber: "TEST-1", date: today, total: 500, schemeSavings: 0 }] },
    products: { list: () => [] }, secondarySales: { list: () => [] }, salespersons: { list: () => [] },
    invoices: { list: () => [{ id: "i1", docType: "gst_invoice", status: "final", sourceOrderId: "o1", invoiceDate: today, invoiceNumber: "TEST-BILL-1", grandTotal: 500 }] },
    targets: { list: () => [{ entityType: "dealer", entityId: "d1", periodType: "daily", periodStart: today, targetRevenue: 1000, targetOrders: 4 }] },
  }) };
});

afterEach(() => { cleanup(); mocks.money = false; vi.clearAllMocks(); });
function open(money: boolean, tab = "overview") {
  mocks.money = money;
  return render(<MemoryRouter initialEntries={[`/distributors/d1?tab=${tab}`]}><Routes><Route path="/distributors/:id" element={<DealerDetail />} /></Routes></MemoryRouter>);
}

describe("Dealer Detail financial access", () => {
  it("denies a direct ledger tab link without see_money and preserves the dealer profile", () => {
    const { container } = open(false, "ledger");
    expect(container.textContent).not.toMatch(/₹|9,876|5,000|TEST-BILL-1/);
    expect(screen.queryByRole("tab", { name: "Bills & payments" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Statement PDF" })).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Overview" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Test visits")).toBeInTheDocument();
    expect(container.textContent).toContain("25%");
    fireEvent.click(screen.getByRole("button", { name: "WhatsApp" }));
    expect(mocks.share).toHaveBeenCalledWith(expect.objectContaining({ id: "d1" }), false);
  });

  it("omits money on desktop and phone order lists without see_money", async () => {
    const { container } = open(false, "orders");
    await waitFor(() => expect(screen.getAllByText("TEST-1")).toHaveLength(2));
    expect(container.textContent).not.toMatch(/₹|500/);
  });

  it("preserves financial overview and statement access for money users", () => {
    const { container } = open(true);
    expect(container.textContent).toContain("9,876");
    expect(container.textContent).toContain("5,000");
    expect(container.textContent).toContain("50%");
    expect(screen.getByRole("button", { name: "Statement PDF" })).toBeEnabled();
  });

  it("allows a direct ledger link with see_money", () => {
    const { container } = open(true, "ledger");
    expect(screen.getByRole("tab", { name: "Bills & payments" })).toHaveAttribute("aria-selected", "true");
    expect(container.textContent).toContain("TEST-BILL-1");
    expect(container.textContent).toContain("500");
  });
});