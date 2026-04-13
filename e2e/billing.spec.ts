import { test, expect } from "../playwright-fixture";

test.describe("Billing", () => {
  test.skip(true, "Requires authenticated session — run manually after login");

  test("billing page loads with invoices and claims tabs", async ({ page }) => {
    await page.goto("/billing");
    await expect(page.locator('text=Billing').or(page.locator('text=Invoices'))).toBeVisible({ timeout: 10000 });
  });

  test("claims page loads", async ({ page }) => {
    await page.goto("/claims");
    await expect(page.locator('text=Claims').or(page.locator('text=Returns'))).toBeVisible({ timeout: 10000 });
  });
});
