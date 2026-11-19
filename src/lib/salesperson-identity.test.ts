import { describe, it, expect } from "vitest";
import { resolveCurrentSalesperson, formatVisitStamp } from "./salesperson-identity";

const roster = [
  { id: "sp1", userId: "u1", email: "ravi@x.com", name: "Ravi" },
  { id: "sp2", userId: null, email: "asha@x.com", name: "Asha" },
];

describe("resolveCurrentSalesperson", () => {
  it("finds the sales person linked to this login", () => {
    expect(resolveCurrentSalesperson("u1", roster)?.id).toBe("sp1");
  });
  it("does not match by email when there is no login link", () => {
    expect(resolveCurrentSalesperson("u-asha", roster)).toBeNull();
  });
  it("returns nothing when signed out", () => {
    expect(resolveCurrentSalesperson(null, roster)).toBeNull();
  });
});

describe("formatVisitStamp", () => {
  it("shows date and time in India time", () => {
    expect(formatVisitStamp("2026-11-19T07:00:00Z")).toBe("19 Nov 2026, 12:30 PM");
  });
  it("handles a time after midnight India time", () => {
    expect(formatVisitStamp("2026-11-18T19:15:00Z")).toBe("19 Nov 2026, 12:45 AM");
  });
});
