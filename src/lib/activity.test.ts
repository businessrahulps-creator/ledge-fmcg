import { describe, it, expect } from "vitest";
import { periodRange, describeChanges, activityLink, groupOf } from "./activity";
import { groupNotifications } from "@/components/layout/NotificationCenter";

describe("periodRange (IST date keys)", () => {
  it("today / yesterday / week / month", () => {
    expect(periodRange("today", "2026-10-04", "", "")).toEqual({ from: "2026-10-04", to: "2026-10-04" });
    expect(periodRange("yesterday", "2026-10-01", "", "")).toEqual({ from: "2026-09-30", to: "2026-09-30" });
    expect(periodRange("week", "2026-10-04", "", "")).toEqual({ from: "2026-09-28", to: "2026-10-04" });
    expect(periodRange("month", "2026-10-04", "", "")).toEqual({ from: "2026-10-01", to: "2026-10-04" });
  });
  it("custom swaps reversed dates", () => {
    expect(periodRange("custom", "2026-10-04", "2026-10-03", "2026-09-01")).toEqual({ from: "2026-09-01", to: "2026-10-03" });
  });
});

describe("describeChanges", () => {
  it("shows plain labels and hides ids", () => {
    const c = describeChanges({ changed_fields: ["credit_limit", "godown_id"], before: { credit_limit: 50000, godown_id: "a" }, after: { credit_limit: 80000, godown_id: "b" } });
    expect(c).toEqual([{ field: "Credit limit", from: "50000", to: "80000" }]);
  });
  it("nothing for creates", () => {
    expect(describeChanges({ changed_fields: [], before: null, after: null })).toEqual([]);
  });
});

describe("activityLink / groupOf", () => {
  it("links orders and skips deleted", () => {
    expect(activityLink({ entity_type: "order", entity_id: "x", action: "created", metadata: {} })).toBe("/orders/x");
    expect(activityLink({ entity_type: "order", entity_id: "x", action: "deleted", metadata: {} })).toBeNull();
    expect(activityLink({ entity_type: "payment", entity_id: "p", action: "created", metadata: { order_id: "o" } })).toBe("/orders/o");
  });
  it("groups", () => {
    expect(groupOf("payment")).toBe("money");
    expect(groupOf("purchase_bill")).toBe("buying");
  });
});

describe("groupNotifications", () => {
  const n = (id: string, groupKey: string) => ({ id, groupKey, type: "order_placed" as const, title: "", description: "", timestamp: new Date(), read: false, link: "" });
  it("bundles same key, keeps order", () => {
    const g = groupNotifications([n("1", "a"), n("2", "b"), n("3", "a"), n("4", "")]);
    expect(g.map(x => x.items.map(i => i.id))).toEqual([["1", "3"], ["2"], ["4"]]);
  });
});
