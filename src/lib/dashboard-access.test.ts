import { describe, expect, it } from "vitest";
import { dashboardAccess, indiaGreeting } from "./dashboard-access";

describe("Dashboard access", () => {
  it("hides money and setup from the sales rep and viewer", () => {
    expect(dashboardAccess(false, false)).toEqual({ money: false, setup: false });
  });
  it("allows manager/accountant money without owner setup", () => {
    expect(dashboardAccess(true, false)).toEqual({ money: true, setup: false });
  });
  it("allows business managers the setup guide", () => {
    expect(dashboardAccess(true, true)).toEqual({ money: true, setup: true });
  });
});

describe("India greeting boundaries", () => {
  it("morning ends at noon IST regardless of device timezone", () => {
    expect(indiaGreeting(new Date("2026-11-19T06:29:00Z"))).toBe("Good Morning");
    expect(indiaGreeting(new Date("2026-11-19T06:30:00Z"))).toBe("Good Afternoon");
  });
  it("afternoon ends at 5pm IST", () => {
    expect(indiaGreeting(new Date("2026-11-19T11:29:00Z"))).toBe("Good Afternoon");
    expect(indiaGreeting(new Date("2026-11-19T11:30:00Z"))).toBe("Good Evening");
  });
  it("uses morning after India midnight", () => {
    expect(indiaGreeting(new Date("2026-11-19T18:30:00Z"))).toBe("Good Morning");
  });
});