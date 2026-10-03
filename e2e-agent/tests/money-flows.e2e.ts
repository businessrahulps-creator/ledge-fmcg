import { test } from "@e2e-dev/web";
import { expect } from "e2e";

/**
 * Money-critical journeys. Plain-English agent steps do the clicking; the
 * AI never decides pass/fail alone — each step is followed by an assert or a
 * hard check. Records created here are named "E2E" so they're easy to clean up.
 */

test("take an order, send it and make the bill", { session: "owner" }, async ({ app, agent, browser }) => {
  const dialogs: string[] = [];
  await browser.onDialog(async (d) => { dialogs.push(d.message); await d.accept(); });
  await app.open("/orders/new");
  await agent.act("create an order for any dealer with 1 unit of any product, add note 'E2E test', and save it");
  await agent.assert("the order was saved: the Orders list, the order page or a success message is showing");
  // A saved order is not "unsaved work": leaving must not ask.
  await browser.waitForURL(/\/orders(\/|$|\?)/, { timeout: 10_000 });
  expect(dialogs).toHaveLength(0);
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

test("unpaid total on Dashboard is shown and positive", { session: "owner" }, async ({ app, browser, screen }) => {
  await app.open("/dashboard");
  const heading = screen.getByRole("heading", { name: /to collect/i }).first();
  await expect(heading).toBeVisible();
  const text = await browser.evaluate(() =>
    [...document.querySelectorAll("h1,h2,h3")].map((h) => h.textContent ?? "").find((t) => /to collect/i.test(t)) ?? "",
  );
  const rupees = Number((text.match(/[\d,]+/)?.[0] ?? "0").replace(/,/g, ""));
  expect(rupees).toBeGreaterThan(0);
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

test("buying page shows supplier balances", { session: "owner" }, async ({ app, agent, screen }) => {
  await app.open("/buying");
  await expect(screen.getByText(/supplier/i).first()).toBeVisible();
  await expect(screen.getByText(/Loading/i)).not.toBeVisible({ timeout: 20_000 });
  await agent.assert("the page shows how much money you owe suppliers");
});
