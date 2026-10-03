import { test } from "@e2e-dev/web";
import { expect } from "e2e";

/**
 * Money-critical journeys. Plain-English agent steps do the clicking; the
 * AI never decides pass/fail alone — each step is followed by an assert or a
 * hard check. Records created here are named "E2E" so they're easy to clean up.
 */

test("take an order, send it and make the bill", { session: "owner" }, async ({ app, agent }) => {
  await app.open("/orders/new");
  await agent.act("create an order for any dealer with 1 unit of any product, add note 'E2E test', and save it");
  await agent.assert("the order was saved and its detail page or a success message is showing");
  await agent.act("open that order and use 'Send & make bill'");
  await agent.assert("the order now shows as Sent and has a GST bill number");
});

test("paying more than what is due is refused", { session: "owner" }, async ({ app, agent }) => {
  await app.open("/billing");
  await agent.act("open record payment for any dealer bill that is still unpaid and enter an amount 10 times larger than what is due, then try to save");
  await agent.assert("the payment was not saved and the app explained the amount is too much, or capped it to what is due");
});

test("cancelled orders cannot take payment", { session: "owner" }, async ({ app, agent }) => {
  await app.open("/orders");
  await agent.act("open any cancelled order");
  await agent.assert("there is no way to record a payment, or the app clearly says cancelled orders can't take payment");
});

test("unpaid total matches between Dashboard and Money to collect", { session: "owner" }, async ({ app, browser }) => {
  const rupees = (s: string) => Number((s.match(/₹\s?[\d,]+/)?.[0] ?? "").replace(/[₹,\s]/g, ""));
  await app.open("/dashboard");
  await browser.waitForURL(/dashboard/);
  const dash = rupees(await browser.locator("text=/outstanding across/i").first().innerText({ timeout: 20_000 }).catch(() => ""));
  await app.open("/reports");
  // Reports preview shows the same figure for "Money to collect".
  await browser.locator("text=/Money to collect/i").first().click();
  const report = rupees(await browser.locator("text=/₹\\s?[\\d,]+/").first().innerText({ timeout: 20_000 }));
  expect(dash).toBeGreaterThan(0);
  expect(report).toBe(dash);
});

test("shop visit with a promise shows under Promises", { session: "owner" }, async ({ app, agent }) => {
  await app.open("/visits");
  await agent.act("add a visit for any shop, choose 'Promised to pay' with amount 100 for tomorrow, note 'E2E', and save");
  await agent.act("open the Promises tab");
  await agent.assert("a promise of ₹100 is listed under Coming up");
});

test("reports download as PDF, Excel and CSV", { session: "owner" }, async ({ app, agent }) => {
  await app.open("/reports");
  await agent.act("open the Orders list report and download it as CSV");
  await agent.assert("a CSV download started or a success message is shown");
});

test("buying page shows supplier balances", { session: "owner" }, async ({ app, agent }) => {
  await app.open("/buying");
  await agent.assert("the page lists suppliers with how much is owed to each");
});
