import { test } from "@e2e-dev/web";
import { expect } from "e2e";

// No AI steps here — these run free and fast on every publish.
const PAGES: [string, RegExp][] = [
  ["/dashboard", /Dashboard/i],
  ["/today", /Today/i],
  ["/orders", /Orders/i],
  ["/visits", /Shop visits/i],
  ["/billing", /Money/i],
  ["/claims", /Returns/i],
  ["/buying", /Buying/i],
  ["/stock", /Stock/i],
  ["/schemes", /Offers/i],
  ["/targets", /Targets/i],
  ["/distributors", /Dealers/i],
  ["/salespersons", /Sales Team/i],
  ["/command", /My Business/i],
  ["/reports", /Reports/i],
];

test("every menu page opens without sideways scrolling", { session: "owner" }, async ({ app, browser, screen }) => {
  for (const [path, title] of PAGES) {
    await app.open(path);
    await expect(browser).toHaveURL(new RegExp(path));
    await expect(screen.getByText(title).first()).toBeVisible();
    await expect(screen.getByText(/Something went wrong|Couldn't load/i)).not.toBeVisible();
    const overflow = await browser.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  }
});

test("a new page opens at the top after scrolling a long list", { session: "owner" }, async ({ app, browser, screen }) => {
  await app.open("/orders");
  await expect(screen.getByText(/Orders/i).first()).toBeVisible();
  await browser.evaluate(() => {
    document.querySelectorAll("main, [class*='overflow-y-auto']").forEach((el) => ((el as HTMLElement).scrollTop = 2000));
    window.scrollTo(0, 2000);
    return true;
  });
  await browser.goto("/dashboard");
  await expect(browser).toHaveURL(/\/dashboard/);
  const top = await browser.evaluate(() => {
    const scrolled = [...document.querySelectorAll("main, [class*='overflow-y-auto']")].map((el) => el.scrollTop);
    return Math.max(window.scrollY, ...scrolled, 0);
  });
  expect(top).toBe(0);
});

test("leaving a half-filled order asks first; opening Menu does not", { session: "owner" }, async ({ app, browser, agent }) => {
  const dialogs: string[] = [];
  await browser.onDialog(async (d) => {
    dialogs.push(d.message());
    await d.dismiss();
  });
  await app.open("/orders/new");
  await agent.act("pick any dealer in the new order form");
  expect(dialogs).toHaveLength(0);
  await agent.act("go to the Dashboard page using the menu");
  await agent.assert("the app asked before leaving, or we are still on the new order form");
});
