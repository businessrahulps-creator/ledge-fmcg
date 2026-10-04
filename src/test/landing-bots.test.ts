import { describe, it, expect } from "vitest";
import { LANDING_BOTS } from "@/components/landing/bots";

describe("landing bots", () => {
  it("never repeats a bot shape and never uses the in-app role bots", () => {
    const types = Object.values(LANDING_BOTS).map((b) => b.type);
    expect(new Set(types).size).toBe(types.length);
    for (const r of ["square", "circle", "triangle", "drop", "pebble"]) expect(types).not.toContain(r);
  });
});
