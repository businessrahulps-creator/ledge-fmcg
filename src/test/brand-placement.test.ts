import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Brand-placement regression tests — Ledge V3 landing palette.
 *
 * Palette: Electric (#1B57F5) / Ink (#1B2130) / Lime (#C8F250) / Mist (#E5E4F0).
 * These guard the tinted-block placements across landing sections. They are a
 * lightweight stand-in for pixel-snapshot regression: they fail loudly when
 * someone removes, swaps, or duplicates a brand surface.
 *
 * Rules encoded (see mem://style/landing-palette-v3):
 *   - Each section uses exactly ONE tinted block as its hero accent.
 *   - Section → tint mapping:
 *       Problem        → ink
 *       WhyLedge       → electric
 *       Features       → electric (dealers) + ink (claims)
 *       Outcome        → electric
 *       Pricing        → ink (recommended tier)
 *       Testimonials   → mist (featured quote)
 *   - Brand tokens and their `.lp-*` variants stay defined in index.css.
 *   - No warm V2 tint (forest / terracotta / bone / midnight) survives on the
 *     landing page.
 */

const root = resolve(__dirname, "../..");
const read = (p: string) => readFileSync(resolve(root, p), "utf8");

const sectionFile = (name: string) =>
  read(`src/components/landing/sections/${name}.tsx`);

const countMatches = (haystack: string, needle: string) =>
  haystack.split(needle).length - 1;

const RETIRED = ["lp-card-midnight", "lp-card-forest", "lp-card-terracotta", "lp-card-bone"];

describe("Brand token contract (index.css)", () => {
  const css = read("src/index.css");

  it.each([
    "--brand-electric",
    "--brand-ink",
    "--brand-lime",
    "--brand-mist",
  ])("defines %s token", (token) => {
    expect(css).toContain(token);
  });

  it.each([
    ".lp-card-electric",
    ".lp-card-ink",
    ".lp-card-mist",
    ".lp-vcard--electric",
    ".lp-vcard--ink",
    ".lp-vcard--mist",
  ])("defines %s variant", (selector) => {
    expect(css).toContain(selector);
  });

  it("scopes the V3 palette to the landing theme", () => {
    expect(css).toContain(".lp-theme");
  });
});

describe("Landing section brand placements", () => {
  it("Problem section: ink on the featured card only", () => {
    const src = sectionFile("Problem");
    expect(countMatches(src, "lp-card-ink")).toBe(1);
    expect(src).not.toContain("lp-card-electric");
  });

  it("WhyLedge section: electric on the hero card only", () => {
    const src = sectionFile("WhyLedge");
    expect(countMatches(src, "lp-card-electric")).toBe(1);
    expect(src).not.toContain("lp-card-ink");
  });

  it("Features section: electric (dealers) + ink (claims)", () => {
    // Features uses the LandingCard visual-first primitive, so tints are
    // declared as variant names rather than lp-card-* classes.
    const src = sectionFile("Features");
    expect(countMatches(src, 'variant: "electric"')).toBe(1);
    expect(countMatches(src, 'variant: "ink"')).toBe(1);
  });

  it("Outcome section: electric on the hero card only", () => {
    const src = sectionFile("Outcome");
    expect(countMatches(src, "lp-card-electric")).toBe(1);
    expect(src).not.toContain("lp-card-ink");
  });

  it("Pricing section: ink on the recommended tier only", () => {
    const src = sectionFile("Pricing");
    expect(countMatches(src, "lp-card-ink")).toBe(1);
    expect(src).not.toContain("lp-card-electric");
  });

  it("Testimonials section: mist on the featured quote only", () => {
    const src = sectionFile("Testimonials");
    expect(countMatches(src, "lp-card-mist")).toBe(1);
  });
});

describe("Retired V2 tints are gone from the landing page", () => {
  const sections = [
    "Problem",
    "WhyLedge",
    "Features",
    "Outcome",
    "Pricing",
    "Testimonials",
    "Hero",
    "FinalCTA",
  ];

  it.each(sections)("%s uses no retired tint class", (name) => {
    const src = sectionFile(name);
    for (const cls of RETIRED) {
      expect(src, `${name} still uses ${cls}`).not.toContain(cls);
    }
  });

  it("no landing section uses more than 2 tinted blocks", () => {
    for (const name of sections) {
      const src = sectionFile(name);
      const total =
        countMatches(src, "lp-card-electric") +
        countMatches(src, "lp-card-ink") +
        countMatches(src, "lp-card-mist");
      expect(total, `${name} uses too many tinted cards`).toBeLessThanOrEqual(2);
    }
  });
});
