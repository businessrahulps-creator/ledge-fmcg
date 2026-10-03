import { test } from "@e2e-dev/web";
import { expect } from "e2e";
import { readFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";

/**
 * Signs in as the demo owner without typing a password: restores a session
 * minted by `lovable auth-session` (or the preview's injected session).
 * The session is a bearer token — never logged, never committed.
 */
function loadSession(): { key: string; value: string } {
  const key = process.env.LOVABLE_BROWSER_SUPABASE_STORAGE_KEY;
  const value = process.env.LOVABLE_BROWSER_SUPABASE_SESSION_JSON;
  if (key && value) return { key, value };
  const file = `${homedir()}/.cache/lovable-auth/session.json`;
  if (!existsSync(file)) throw new Error("No test sign-in. Run `lovable auth-session --json` first.");
  const minted = JSON.parse(readFileSync(file, "utf8"));
  return { key: minted.storage_key, value: JSON.stringify(minted.session) };
}

test.setup("sign in as owner", { sessions: ["owner"] }, async ({ app, browser, screen, session }) => {
  const { key, value } = loadSession();
  await app.open("/");
  await browser.evaluate(
    ([k, v]) => {
      window.localStorage.setItem(k, v);
      return true;
    },
    [key, value],
  );
  await app.open("/dashboard");
  await expect(browser).toHaveURL(/\/dashboard/);
  await expect(screen.getByRole("heading", { name: /Dashboard/i }).first()).toBeVisible();
  await session.save("owner");
});
