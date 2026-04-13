import { test, expect } from "../playwright-fixture";

// These tests require an authenticated session.
// In a real CI setup, you'd use storageState from a global setup.
// For now, they demonstrate the test structure.

test.describe("Order Lifecycle", () => {
  test.skip(true, "Requires authenticated session — run manually after login");

  test("create order page loads with form fields", async ({ page }) => {
    await page.goto("/orders/new");
    await expect(page.locator('text=New Order').or(page.locator('text=Create Order'))).toBeVisible({ timeout: 10000 });
  });

  test("orders list page loads", async ({ page }) => {
    await page.goto("/orders");
    await expect(page.locator('text=Orders')).toBeVisible({ timeout: 10000 });
  });

  test("order detail page shows order info", async ({ page }) => {
    await page.goto("/orders");
    // Click first order if exists
    const firstRow = page.locator("table tbody tr").first();
    if (await firstRow.isVisible()) {
      await firstRow.click();
      await expect(page.locator('text=Order Details').or(page.locator('text=ORD-'))).toBeVisible({ timeout: 10000 });
    }
  });
});
