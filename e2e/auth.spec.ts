import { test, expect } from "../playwright-fixture";

const TEST_EMAIL = `test-e2e-${Date.now()}@example.com`;
const TEST_PASSWORD = "TestPass123!";
const TEST_NAME = "E2E Tester";
const TEST_COMPANY = "E2E Test Co";

test.describe("Authentication", () => {
  test("signup creates account and redirects to dashboard", async ({ page }) => {
    await page.goto("/signup");
    await page.waitForSelector('input[id="fullName"]', { timeout: 10000 });

    await page.fill('input[id="fullName"]', TEST_NAME);
    await page.fill('input[id="companyName"]', TEST_COMPANY);
    await page.fill('input[id="email"]', TEST_EMAIL);
    await page.fill('input[id="password"]', TEST_PASSWORD);
    await page.fill('input[id="confirmPassword"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');

    // Should either redirect to dashboard or show email verification message
    await expect(
      page.locator('text=Dashboard').or(page.locator('text=verify').or(page.locator('text=confirmation')))
    ).toBeVisible({ timeout: 15000 });
  });

  test("login with invalid credentials shows error", async ({ page }) => {
    await page.goto("/login");
    await page.waitForSelector('input[id="email"]', { timeout: 10000 });

    await page.fill('input[id="email"]', "nonexistent@example.com");
    await page.fill('input[id="password"]', "WrongPassword123!");
    await page.click('button[type="submit"]');

    // Should show an error toast or message
    await expect(
      page.locator('[data-sonner-toast]').or(page.locator('text=Invalid'))
    ).toBeVisible({ timeout: 10000 });
  });

  test("login page renders with email and password fields", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator('input[id="email"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input[id="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("signup page has link to login", async ({ page }) => {
    await page.goto("/signup");
    const loginLink = page.locator('a[href="/login"]');
    await expect(loginLink).toBeVisible({ timeout: 10000 });
  });

  test("unauthenticated user accessing dashboard redirects to login", async ({ page }) => {
    await page.goto("/dashboard");
    // Should redirect to login
    await page.waitForURL("**/login", { timeout: 10000 });
    await expect(page.locator('input[id="email"]')).toBeVisible();
  });
});
