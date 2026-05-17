import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Brand-placement regression tests.
 *
 * These guard the Midnight / Forest / Terracotta / Bone tinted-card placements
 * across landing sections. They are a lightweight stand-in for full
 * pixel-snapshot visual regression: they fail loudly when someone removes,
 * swaps, or duplicates a brand surface in a way that breaks the documented
 * Ledge V2 hierarchy.
 *
 * Rules encoded (see mem://style/landing-tinted-cards):
 *   - Each section uses exactly ONE tinted card variant as its hero accent.
 *   - The mapping between section and tint is fixed:
 *       Problem        → terracotta
 *       WhyLedge       → midnight
 *       Features       → forest (first card) + terracotta (returns/claims)
 *       Outcome        → forest
 *       Pricing        → midnight (recommended tier)
 *       Testimonials   → bone (featured quote)
 *   - The four brand tokens (--ledge-midnight/forest/terracotta/bone) and
 *     their corresponding `.lp-card-*` variants stay defined in index.css.
 */

const root = resolve(__dirname, "../..");
const read = (p: string) => readFileSync(resolve(root, p), "utf8");

const sectionFile = (name: string) =>
  read(`src/components/landing/sections/${name}.tsx`);

const countMatches = (haystack: string, needle: string) =>
  haystack.split(needle).length - 1;

describe("Brand token contract (index.css)", () => {
  const css = read("src/index.css");

  it.each([
    "--ledge-midnight",
    "--ledge-forest",
    "--ledge-terracotta",
    "--ledge-bone",
  ])("defines %s token", (token) => {
    expect(css).toContain(token);
  });

  it.each([
    ".lp-card-midnight",
    ".lp-card-forest",
    ".lp-card-terracotta",
    ".lp-card-bone",
  ])("defines %s variant", (selector) => {
    expect(css).toContain(selector);
  });
});

describe("Landing section brand placements", () => {
  it("Problem section: terracotta on the featured card only", () => {
    const src = sectionFile("Problem");
    expect(src).toContain("lp-card-terracotta");
    expect(countMatches(src, "lp-card-terracotta")).toBe(1);
    expect(src).not.toContain("lp-card-midnight");
    expect(src).not.toContain("lp-card-forest");
    expect(src).not.toContain("lp-card-bone");
  });

  it("WhyLedge section: midnight on the hero card only", () => {
    const src = sectionFile("WhyLedge");
    expect(src).toContain("lp-card-midnight");
    expect(countMatches(src, "lp-card-midnight")).toBe(1);
    expect(src).not.toContain("lp-card-forest");
    expect(src).not.toContain("lp-card-terracotta");
    expect(src).not.toContain("lp-card-bone");
  });

  it("Features section: forest (growth) + terracotta (recovery), no others", () => {
    const src = sectionFile("Features");
    expect(src).toContain("lp-card-forest");
    expect(src).toContain("lp-card-terracotta");
    expect(countMatches(src, "lp-card-forest")).toBe(1);
    expect(countMatches(src, "lp-card-terracotta")).toBe(1);
    expect(src).not.toContain("lp-card-midnight");
    expect(src).not.toContain("lp-card-bone");
  });

  it("Outcome section: forest on the hero card only", () => {
    const src = sectionFile("Outcome");
    expect(src).toContain("lp-card-forest");
    expect(countMatches(src, "lp-card-forest")).toBe(1);
    expect(src).not.toContain("lp-card-midnight");
    expect(src).not.toContain("lp-card-terracotta");
    expect(src).not.toContain("lp-card-bone");
  });

  it("Pricing section: midnight on the recommended tier only", () => {
    const src = sectionFile("Pricing");
    expect(src).toContain("lp-card-midnight");
    expect(countMatches(src, "lp-card-midnight")).toBe(1);
    expect(src).not.toContain("lp-card-forest");
    expect(src).not.toContain("lp-card-terracotta");
    expect(src).not.toContain("lp-card-bone");
  });

  it("Testimonials section: bone on the featured quote only", () => {
    const src = sectionFile("Testimonials");
    expect(src).toContain("lp-card-bone");
    expect(countMatches(src, "lp-card-bone")).toBe(1);
    expect(src).not.toContain("lp-card-midnight");
    expect(src).not.toContain("lp-card-forest");
    expect(src).not.toContain("lp-card-terracotta");
  });
});

describe("Tinted-card rationing (one tint per section)", () => {
  const sections = [
    "Problem",
    "WhyLedge",
    "Features",
    "Outcome",
    "Pricing",
    "Testimonials",
  ];

  it("no landing section uses more than 2 tinted variants combined", () => {
    for (const name of sections) {
      const src = sectionFile(name);
      const total =
        countMatches(src, "lp-card-midnight") +
        countMatches(src, "lp-card-forest") +
        countMatches(src, "lp-card-terracotta") +
        countMatches(src, "lp-card-bone");
      expect(total, `${name} uses too many tinted cards`).toBeLessThanOrEqual(2);
    }
  });
});
