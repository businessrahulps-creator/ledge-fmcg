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

import { acquiredByLabel, assignedLabel } from "./salesperson-identity";
describe("dealer attribution labels", () => {
  const fmt = (d: string) => d;
  it("old dealers with no data show Direct onboarding and Unassigned", () => {
    expect(acquiredByLabel(null, null, fmt)).toBe("Direct onboarding");
    expect(assignedLabel(null)).toBe("Unassigned");
  });
  it("shows who acquired and when", () => {
    expect(acquiredByLabel("Ravi", "2026-11-12", fmt)).toBe("Acquired by Ravi on 2026-11-12");
  });
});

import { prefillOrderSalesperson as pf } from "./salesperson-identity";
describe("order sales person prefill", () => {
  it("fills empty box with the dealer's assigned person", () => {
    expect(pf("", null, "sp1", ["sp1", "sp2"])).toBe("sp1");
  });
  it("never overwrites a hand-picked person", () => {
    expect(pf("sp2", null, "sp1", ["sp1", "sp2"])).toBe("sp2");
  });
  it("switching dealer replaces our own earlier suggestion", () => {
    expect(pf("sp1", "sp1", "sp2", ["sp1", "sp2"])).toBe("sp2");
  });
  it("unassigned dealer clears only our own suggestion", () => {
    expect(pf("sp1", "sp1", null, ["sp1"])).toBe("");
    expect(pf("sp2", "sp1", null, ["sp1", "sp2"])).toBe("sp2");
  });
  it("ignores an assignee no longer in the team list", () => {
    expect(pf("", null, "gone", ["sp1"])).toBe("");
  });
});

import { salespersonCoverage } from "./salesperson-identity";
describe("sales team coverage counts", () => {
  const team = [{ id: "a", name: "Ravi" }, { id: "b", name: "Meena" }];
  it("counts acquired, assigned and found separately", () => {
    const rows = salespersonCoverage(team,
      [{ acquiredBySalespersonId: "a", assignedSalespersonId: "b" }, { acquiredBySalespersonId: "a", assignedSalespersonId: "a" }, {}],
      [{ foundBySalespersonId: "b" }, { foundBySalespersonId: null }]);
    expect(rows[0]).toMatchObject({ shopsAcquired: 2, dealersAssigned: 1, prospectsFound: 0 });
    expect(rows[1]).toMatchObject({ shopsAcquired: 0, dealersAssigned: 1, prospectsFound: 1 });
  });
  it("reassigning a dealer never changes who acquired it", () => {
    const rows = salespersonCoverage(team, [{ acquiredBySalespersonId: "a", assignedSalespersonId: "b" }], []);
    expect(rows[0].shopsAcquired).toBe(1);
    expect(rows[1].shopsAcquired).toBe(0);
  });
});
