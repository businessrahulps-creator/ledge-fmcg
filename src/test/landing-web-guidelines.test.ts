import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

function walk(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, acc);
    else if (full.endsWith(".tsx") || full.endsWith(".ts")) acc.push(full);
  }
  return acc;
}

const landingFiles = walk(join(ROOT, "src/components/landing"));
const css = readFileSync(join(ROOT, "src/index.css"), "utf8");
const html = readFileSync(join(ROOT, "index.html"), "utf8");

describe("landing — web interface guidelines", () => {
  it("viewport allows pinch zoom", () => {
    const viewport = html.match(/<meta name="viewport"[^>]*>/)?.[0] ?? "";
    expect(viewport).not.toMatch(/user-scalable\s*=\s*no/);
    expect(viewport).not.toMatch(/maximum-scale\s*=\s*1/);
  });

  it("no transition-all on landing components", () => {
    const offenders = landingFiles.filter((f) =>
      /transition-all|transition:\s*all/.test(readFileSync(f, "utf8")),
    );
    expect(offenders).toEqual([]);
  });

  it("no transition: all in the stylesheet", () => {
    expect(css).not.toMatch(/transition:\s*all/);
  });

  it("no straight apostrophes inside words in landing copy", () => {
    const offenders = landingFiles.filter((f) =>
      /[A-Za-z]'[A-Za-z]/.test(readFileSync(f, "utf8")),
    );
    expect(offenders).toEqual([]);
  });

  it("skip link and anchor scroll offset exist", () => {
    expect(css).toContain(".lp-skip-link");
    expect(css).toMatch(/\.lp-theme section\[id\]\s*\{\s*scroll-margin-top/);
    const index = readFileSync(join(ROOT, "src/pages/Index.tsx"), "utf8");
    expect(index).toContain('href="#main-content"');
    expect(index).toContain('id="main-content"');
  });
});

describe("landing — taste pass guardrails", () => {
  it("no em dashes in landing copy", () => {
    const offenders = landingFiles.filter((f) => /\u2014/.test(readFileSync(f, "utf8")));
    expect(offenders).toEqual([]);
  });

  it("eyebrow labels stay rationed to at most four sections", () => {
    const withEyebrow = landingFiles.filter((f) =>
      /className="[^"]*\blp-eyebrow\b/.test(readFileSync(f, "utf8")),
    );
    expect(withEyebrow.length).toBeLessThanOrEqual(4);
  });

  it("the eyebrow chip carries no decorative dot", () => {
    expect(css).not.toMatch(/\.lp-eyebrow[^{]*\{[^}]*content:\s*""/);
  });

  it("live dots are used at most once", () => {
    const count = landingFiles.reduce(
      (n, f) => n + (readFileSync(f, "utf8").match(/lp-live-dot/g)?.length ?? 0),
      0,
    );
    expect(count).toBeLessThanOrEqual(1);
  });

  it("primary trial CTA uses one wording everywhere", () => {
    const offenders = landingFiles.filter((f) => /Start free\b|Start 30-Day Free Trial/.test(readFileSync(f, "utf8")));
    expect(offenders).toEqual([]);
  });

  it("no warm brown tints remain in the landing palette", () => {
    expect(css).not.toMatch(/hsl\(3[0-9] /);
    expect(css).not.toMatch(/hsl\(244 /);
  });
});
