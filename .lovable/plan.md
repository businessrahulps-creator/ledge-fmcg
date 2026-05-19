## Goal
A reliable Playwright spec that guards the two bugs we just fixed on `/command`: vertical scrolling must work (no Radix scroll-lock leak), and the print stylesheet must paginate into multiple A4 pages (not a one-page "screenshot of the website").

## File
`e2e/command-scroll-print.spec.ts` — new spec, follows the existing `e2e/*.spec.ts` pattern with `playwright-fixture`.

Because `/command` requires an authenticated session and the current `order-lifecycle.spec.ts` is `test.skip(true, ...)` for that reason, the new file will follow the same convention: a top-level `test.skip(!process.env.E2E_AUTH_STATE, "...")` so it runs locally / in CI when an auth storageState is wired, and no-ops otherwise. The body is real, not a stub.

## Test 1 — Scrolling is not blocked

Reproduces the WhatsAppBlastSheet / KeyboardCheatSheet leak.

1. `page.goto("/command")`, wait for the "My Business" H1.
2. Capture `initialScrollY = await page.evaluate(() => window.scrollY)`.
3. Open and close a sheet that previously leaked scroll-lock:
   - Press `?` to open KeyboardCheatSheet → press `Escape`.
   - Click a "Send WhatsApp" trigger (or dispatch the same way the Credit at Risk card does) → press `Escape`.
4. Assert body styles are clean:
   ```ts
   const { overflow, pointerEvents } = await page.evaluate(() => ({
     overflow: document.body.style.overflow,
     pointerEvents: document.body.style.pointerEvents,
   }));
   expect(overflow).not.toBe("hidden");
   expect(pointerEvents).not.toBe("none");
   ```
5. Programmatic scroll + wheel scroll both move the page:
   ```ts
   await page.mouse.wheel(0, 2000);
   await page.waitForFunction((y0) => window.scrollY > y0 + 200, initialScrollY);
   ```
6. Assert the page is actually taller than the viewport (`scrollHeight > innerHeight + 400`) so the assertion is meaningful even if seed data shrinks.

## Test 2 — Print produces multiple paginated pages

Uses Chromium's `page.pdf()` against the same `@media print` stylesheet `window.print()` triggers — this is the most reliable way to assert pagination in headless Playwright.

1. `page.goto("/command")`, wait for content (KPI strip + Aging strip + Pipeline).
2. `await page.emulateMedia({ media: "print" });`
3. Sanity-check that the print stylesheet neutralized the shell:
   ```ts
   const shell = await page.evaluate(() => {
     const el = document.querySelector("[data-app-shell]") ?? document.body;
     const cs = getComputedStyle(el);
     return { overflow: cs.overflow, height: cs.height };
   });
   expect(shell.overflow).not.toBe("hidden");
   ```
   (If `[data-app-shell]` isn't present yet, the spec will add the attribute to `AppLayout`'s root — single-line, presentation-only — so the test has a stable hook. No logic change.)
4. Generate a PDF with A4 + print background:
   ```ts
   const pdf = await page.pdf({ format: "A4", printBackground: true, preferCSSPageSize: false });
   ```
5. Parse page count from the PDF bytes without adding a dependency:
   ```ts
   const text = pdf.toString("latin1");
   const pageCount = (text.match(/\/Type\s*\/Page[^s]/g) || []).length;
   expect(pageCount).toBeGreaterThanOrEqual(2);
   ```
6. Save the artifact to `test-results/command-print.pdf` via `testInfo.attach` so failures are debuggable.
7. Restore: `await page.emulateMedia({ media: null });`

## Auth strategy (technical note)

Two acceptable paths — I'll implement (a) and document (b):

(a) **Skip-by-default, opt-in via env.** Mirrors `order-lifecycle.spec.ts`. CI sets `E2E_AUTH_STATE=1` and a `storageState` once auth fixtures land. Zero infra change today.

(b) **Reuse storage state from a `global.setup.ts`** that signs in once with a seeded test user. Out of scope for this PR but the spec is written so flipping to (b) is a one-line change in `playwright-fixture`.

## Out of scope
- Visual-regression screenshots of print preview (Chromium's PDF rasterization is flaky across CI runners).
- Asserting exact page count (depends on seed data volume); `>= 2` is the contract that catches the regression.
- Wiring CI auth state — separate task.
