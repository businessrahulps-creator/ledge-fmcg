import { describe, it, expect } from "vitest";
import { displayDeliveryStatus, isAwaitingDispatch } from "./order-cancelled";

describe("cancelled order display", () => {
  it("shows a cancelled order as cancelled, not pending", () => {
    expect(displayDeliveryStatus({ cancelledAt: "2026-11-20", deliveryStatus: "pending" })).toBe("cancelled");
  });
  it("keeps live order status", () => {
    expect(displayDeliveryStatus({ cancelledAt: null, deliveryStatus: "dispatched" })).toBe("dispatched");
  });
  it("cancelled orders are not waiting to be sent", () => {
    expect(isAwaitingDispatch({ cancelledAt: "2026-11-20", deliveryStatus: "pending" })).toBe(false);
    expect(isAwaitingDispatch({ cancelledAt: null, deliveryStatus: "pending" })).toBe(true);
  });
});
