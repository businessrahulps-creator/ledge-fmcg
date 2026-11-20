import { afterEach, describe, expect, it, vi } from "vitest";
import { shareDealerOnWhatsApp } from "./shareWhatsApp";
vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));
afterEach(() => vi.restoreAllMocks());
const dealer = { name: "Test dealer", location: "North", contact: "123", totalOrders: 4, totalValue: 9876 };
describe("dealer WhatsApp money access", () => {
  it("shares contact and counts but no money without see_money", () => {
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    shareDealerOnWhatsApp(dealer, false);
    const message = new URL(String(open.mock.calls[0][0])).searchParams.get("text");
    expect(message).toContain("Orders: 4");
    expect(message).not.toMatch(/₹|9,876/);
  });
  it("keeps the financial share for money users", () => {
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    shareDealerOnWhatsApp(dealer, true);
    expect(new URL(String(open.mock.calls[0][0])).searchParams.get("text")).toContain("9,876");
  });
});