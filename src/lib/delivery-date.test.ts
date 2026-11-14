import { describe, it, expect } from "vitest";
import { deliveryDateBounds, validateDeliveryDate, deliveryDayToTimestamp } from "./delivery-date";
import { istDateKey } from "@/utils/dateKey";

const b = deliveryDateBounds({ dispatchDate: "2026-11-10", date: "2026-11-08" }, "2026-11-14");
describe("delivery date", () => {
  it("today allowed", () => expect(validateDeliveryDate("2026-11-14", b)).toBeNull());
  it("backdate allowed", () => expect(validateDeliveryDate("2026-11-11", b)).toBeNull());
  it("future blocked", () => expect(validateDeliveryDate("2026-11-15", b)).toMatch(/future/));
  it("before dispatch blocked", () => expect(validateDeliveryDate("2026-11-09", b)).toMatch(/before/));
  it("falls back to order date", () =>
    expect(deliveryDateBounds({ dispatchDate: null, date: "2026-11-08" }, "2026-11-14").min).toBe("2026-11-08"));
  it("IST day kept", () => expect(istDateKey(new Date(deliveryDayToTimestamp("2026-11-11")))).toBe("2026-11-11"));
});
