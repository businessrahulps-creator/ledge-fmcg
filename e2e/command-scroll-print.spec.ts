import { test, expect } from "../playwright-fixture";

/**
 * Guards two regressions on /command:
 *  1. Vertical scrolling must not be blocked by a leaked Radix scroll-lock
 *     (WhatsAppBlastSheet / KeyboardCheatSheet exit cleanup).
 *  2. The print stylesheet must paginate into multiple A4 pages instead of
 *     rendering as a single screenshot-of-the-website page.
 *
 * /command requires an authenticated session. We follow the same opt-in
 * pattern as order-lifecycle.spec.ts — the suite is skipped unless
 * E2E_AUTH_STATE is set (CI wires storageState via playwright-fixture).
 */
test.describe("Command page — scroll & print", () => {
  test.skip(
    !process.env.E2E_AUTH_STATE,
    "Requires authenticated session — set E2E_AUTH_STATE=1 and wire storageState to run",
  );

  test("scrolling works after opening and closing sheets (no scroll-lock leak)", async ({
    page,
  }) => {
    await page.goto("/command");
    await expect(page.getByRole("heading", { name: /my business/i })).toBeVisible({
      timeout: 15000,
    });

    // Page must actually be taller than the viewport for the assertion to mean something.
    const overflowsViewport = await page.evaluate(
      () => document.documentElement.scrollHeight > window.innerHeight + 400,
    );
    expect(overflowsViewport, "Command page should overflow viewport for a real scroll test").toBe(
      true,
    );

    const initialScrollY = await page.evaluate(() => window.scrollY);

    // Open + close keyboard cheat sheet (?  -> Esc).
    await page.keyboard.press("Shift+/");
    await page.waitForTimeout(150);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(400); // let Radix exit animation + body-style cleanup finish

    // Body styles must be clean (no leaked overflow:hidden / pointer-events:none).
    const bodyStyles = await page.evaluate(() => ({
      overflow: document.body.style.overflow,
      pointerEvents: document.body.style.pointerEvents,
    }));
    expect(bodyStyles.overflow).not.toBe("hidden");
    expect(bodyStyles.pointerEvents).not.toBe("none");

    // Wheel scroll must actually move the page.
    await page.mouse.move(400, 400);
    await page.mouse.wheel(0, 2000);
    await page.waitForFunction(
      ([y0]) => window.scrollY > y0 + 200,
      [initialScrollY] as const,
      { timeout: 5000 },
    );
  });

  test("print emulation produces a multi-page A4 PDF", async ({ page }, testInfo) => {
    await page.goto("/command");
    await expect(page.getByRole("heading", { name: /my business/i })).toBeVisible({
      timeout: 15000,
    });

    await page.emulateMedia({ media: "print" });

    // Print stylesheet must neutralize the app-shell overflow lock so content can paginate.
    const shell = await page.evaluate(() => {
      const el = document.querySelector("[data-app-shell]") as HTMLElement | null;
      if (!el) return null;
      const cs = getComputedStyle(el);
      return { overflow: cs.overflow, height: cs.height };
    });
    expect(shell, "[data-app-shell] root must exist for print sanity check").not.toBeNull();
    expect(shell!.overflow).not.toBe("hidden");

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: false,
    });

    await testInfo.attach("command-print.pdf", {
      body: pdf,
      contentType: "application/pdf",
    });

    // Count /Type /Page objects (not /Pages) in the raw PDF.
    const text = pdf.toString("latin1");
    const pageCount = (text.match(/\/Type\s*\/Page[^s]/g) || []).length;
    expect(pageCount, `Expected multi-page PDF, got ${pageCount}`).toBeGreaterThanOrEqual(2);

    await page.emulateMedia({ media: null });
  });
});
