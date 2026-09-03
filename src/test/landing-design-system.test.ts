import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Landing design-system guardrails (v4).
 *
 * Encodes the audit outcome so the palette / shape / rhythm system cannot
 * silently drift again:
 *   - no raw Tailwind palette colours in landing code (tokens only)
 *   - no hand-typed pixel radii — use the lp shape scale
 *   - section vertical rhythm uses the two rhythm classes only
 *   - retired card classes stay retired
 *   - status colours stay independent of the brand accent
 */

const root = resolve(__dirname, "../..");
const read = (p: string) => readFileSync(resolve(root, p), "utf8");

const LANDING_DIRS = [
  "src/components/landing",
  "src/components/landing/sections",
  "src/components/landing/visuals",
];

/** Device chrome legitimately uses concentric hardware radii. */
const RADIUS_ALLOWLIST = ["DeviceFrames.tsx"];

const landingFiles = LANDING_DIRS.flatMap((dir) =>
  readdirSync(resolve(root, dir))
    .filter((f) => f.endsWith(".tsx"))
    .map((f) => ({ path: `${dir}/${f}`, name: f, source: read(`${dir}/${f}`) })),
);

const SECTION_FILES = readdirSync(resolve(root, "src/components/landing/sections"))
  .filter((f) => f.endsWith(".tsx"))
  .map((f) => ({ name: f, source: read(`src/components/landing/sections/${f}`) }));

const TAILWIND_PALETTE =
  /\b(?:bg|text|border|ring|from|to|via)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b/;

describe("Landing design system — colour", () => {
  it.each(landingFiles.map((f) => [f.name, f.source] as const))(
    "%s uses design tokens, not raw Tailwind palette colours",
    (_name, source) => {
      expect(source.match(TAILWIND_PALETTE)?.[0] ?? null).toBeNull();
    },
  );

  it("keeps status colours independent of the brand accent", () => {
    const css = read("src/index.css");
    const theme = css.slice(css.indexOf(".lp-theme {"));
    expect(theme).not.toContain("--success: var(--brand-electric)");
    expect(theme).not.toContain("--warning: var(--brand-lime)");
  });

  it("no longer defines the retired warm aliases", () => {
    const css = read("src/index.css");
    for (const dead of [
      "--brand-purple",
      "--brand-coral",
      ".lp-card-midnight",
      ".lp-card-forest",
      ".lp-card-terracotta",
      ".lp-card-bone",
      ".lp-card-dark",
      ".lp-chip-warm",
      ".lp-mesh-soft-warm",
    ]) {
      expect(css).not.toContain(dead);
    }
  });
});

describe("Landing design system — shape", () => {
  it("defines the full shape scale", () => {
    const css = read("src/index.css");
    for (const token of ["--lp-r-xs", "--lp-r-sm", "--lp-r-md", "--lp-r-lg", "--lp-r-xl"]) {
      expect(css).toContain(token);
    }
  });

  it.each(
    landingFiles
      .filter((f) => !RADIUS_ALLOWLIST.includes(f.name))
      .map((f) => [f.name, f.source] as const),
  )("%s uses the shape scale, not hand-typed pixel radii", (_name, source) => {
    expect(source.match(/rounded(?:-[a-z]+)?-\[\d+px\]/)?.[0] ?? null).toBeNull();
  });
});

describe("Landing design system — rhythm and surfaces", () => {
  it("defines the two rhythm steps and three section grounds", () => {
    const css = read("src/index.css");
    for (const cls of [
      ".lp-rhythm",
      ".lp-rhythm-lg",
      ".lp-section-paper",
      ".lp-section-soft",
      ".lp-section-ink",
    ]) {
      expect(css).toContain(cls);
    }
  });

  it.each(SECTION_FILES.map((f) => [f.name, f.source] as const))(
    "%s does not hand-roll section padding",
    (name, source) => {
      if (name === "Navbar.tsx" || name === "Footer.tsx") return; // chrome, not a section
      const sectionTag = source.match(/<(?:section|footer)[^>]*>/)?.[0] ?? "";
      expect(sectionTag).not.toMatch(/\bpy-\d/);
    },
  );

  it("defines the surface roles", () => {
    const css = read("src/index.css");
    for (const token of [
      "--lp-surface:",
      "--lp-surface-sunken:",
      "--lp-surface-ink:",
      "--lp-surface-accent:",
    ]) {
      expect(css).toContain(token);
    }
  });
});
