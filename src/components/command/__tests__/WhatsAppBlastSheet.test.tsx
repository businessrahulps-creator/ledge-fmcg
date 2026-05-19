import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { WhatsAppBlastSheet } from "@/components/command/WhatsAppBlastSheet";
import { formatCurrency, type Distributor, type Order } from "@/data/mock-data";

function dealer(id: string, overrides: Partial<Distributor> = {}): Distributor {
  return {
    id,
    name: `Dealer ${id}`,
    location: "Mysore",
    contact: "9876543210",
    email: "",
    address: "",
    gstin: "",
    pan: "",
    stateCode: "29",
    bankName: "",
    bankAccountName: "",
    bankAccount: "",
    bankIfsc: "",
    totalOrders: 0,
    totalValue: 0,
    creditLimit: 100000,
    outstandingAmount: 12000,
    ...overrides,
  };
}

function order(id: string, distributorId: string, date: string): Order {
  return {
    id,
    orderNumber: id,
    date,
    distributorId,
    distributorName: "",
    salespersonId: "s1",
    salesperson: "Ravi",
    lines: [],
    total: 0,
    paymentMode: "cash",
    paymentStatus: "pending",
    dispatchDate: null,
    vehicle: "",
    driverName: "",
    deliveryStatus: "pending",
    dispatchRemarks: "",
    schemeSavings: 0,
    appliedSchemes: [],
  };
}

const TEMPLATE =
  "Hi {dealer_name}, your outstanding is {outstanding}. Last order: {last_order_date}.";

describe("WhatsAppBlastSheet", () => {
  it("renders merged messages and reachable count for the live dealer set", () => {
    const dealers = [
      dealer("A", { name: "Sharma", outstandingAmount: 12000 }),
      dealer("B", { name: "Verma", outstandingAmount: 4500, contact: "" }), // no phone
      dealer("C", { name: "Patel", outstandingAmount: 800 }),
    ];
    const orders = [order("o1", "A", "2026-05-10"), order("o2", "C", "2026-04-22")];

    render(
      <WhatsAppBlastSheet
        open
        onClose={() => {}}
        title="Chase"
        description="Chase dormant"
        dealers={dealers}
        orders={orders}
        defaultTemplate={TEMPLATE}
      />,
    );

    // Preview shows the first three rendered messages.
    expect(screen.getByText(/Hi Sharma,/)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(formatCurrency(12000).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))).toBeInTheDocument();
    expect(screen.getByText(/10 May 2026/)).toBeInTheDocument();
    expect(screen.getByText(/Verma/)).toBeInTheDocument();
    expect(screen.getByText(/no order on record/)).toBeInTheDocument();

    // Reachable count: 2 of 3 have a phone.
    expect(screen.getByText(/2/).closest("div")?.textContent).toMatch(/2.*of 3 dealer/);
    expect(screen.getByText(/Send WhatsApp to 2 dealers/)).toBeInTheDocument();
  });

  it("re-seeds the template when defaultTemplate prop changes", () => {
    const dealers = [dealer("A", { name: "Sharma" })];
    const orders: Order[] = [];

    const { rerender } = render(
      <WhatsAppBlastSheet
        open
        onClose={() => {}}
        title="Chase"
        description="d"
        dealers={dealers}
        orders={orders}
        defaultTemplate="Hello {dealer_name}, pay {outstanding}."
      />,
    );

    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
    expect(textarea.value).toContain("Hello {dealer_name}");

    rerender(
      <WhatsAppBlastSheet
        open
        onClose={() => {}}
        title="Block"
        description="d"
        dealers={dealers}
        orders={orders}
        defaultTemplate="Credit blocked for {dealer_name}."
      />,
    );

    expect((screen.getByRole("textbox") as HTMLTextAreaElement).value).toBe(
      "Credit blocked for {dealer_name}.",
    );
  });

  it("reflects a filtered dealer set on rerender (preview + send count update)", () => {
    const all = [
      dealer("A", { name: "Sharma", outstandingAmount: 12000 }),
      dealer("B", { name: "Patel", outstandingAmount: 800 }),
    ];

    const { rerender } = render(
      <WhatsAppBlastSheet
        open
        onClose={() => {}}
        title="t"
        description="d"
        dealers={all}
        orders={[]}
        defaultTemplate={TEMPLATE}
      />,
    );
    expect(screen.getByText(/Send WhatsApp to 2 dealers/)).toBeInTheDocument();

    rerender(
      <WhatsAppBlastSheet
        open
        onClose={() => {}}
        title="t"
        description="d"
        dealers={[all[1]]}
        orders={[]}
        defaultTemplate={TEMPLATE}
      />,
    );
    expect(screen.getByText(/Send WhatsApp to 1 dealer\b/)).toBeInTheDocument();
    expect(screen.getByText(/Hi Patel,/)).toBeInTheDocument();
    expect(screen.queryByText(/Hi Sharma,/)).not.toBeInTheDocument();
  });
});
