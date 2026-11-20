import { describe, it, expect } from "vitest";
import { salesTeamExport, topPerformer } from "./sales-team-money";

const rows = [
  { name: "A", phone: "1", email: "a@x", region: "N", totalOrders: 5, totalValue: 100 },
  { name: "B", phone: "2", email: "b@x", region: "S", totalOrders: 2, totalValue: 900 },
];
const fmt = (n: number) => `₹${n}`;

describe("sales team export", () => {
  it("includes Total Value for money users", () => {
    const e = salesTeamExport(rows, true, fmt);
    expect(e.headers).toContain("Total Value");
    expect(e.rows[1][5]).toBe("₹900");
  });
  it("drops all rupee values for non-money users", () => {
    const e = salesTeamExport(rows, false, fmt);
    expect(e.headers).not.toContain("Total Value");
    expect(e.rows.flat().some((c) => c.includes("₹"))).toBe(false);
  });
});

describe("top performer", () => {
  it("ranks by revenue with money access", () => expect(topPerformer(rows, true)?.name).toBe("B"));
  it("ranks by orders without money access", () => expect(topPerformer(rows, false)?.name).toBe("A"));
});
