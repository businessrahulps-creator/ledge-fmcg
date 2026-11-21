import { describe, it, expect, vi, beforeEach } from "vitest";
const rpc = vi.fn();
vi.mock("@/integrations/supabase/client", () => ({ supabase: { rpc: (...a: any[]) => rpc(...a) } }));
import { noCompanyDestination } from "./NoCompanyGuard";

describe("noCompanyDestination", () => {
  beforeEach(() => rpc.mockReset());
  it("pending invite goes to /invite/:token", async () => {
    rpc.mockResolvedValue({ data: "tok123", error: null });
    expect(await noCompanyDestination()).toBe("/invite/tok123");
  });
  it("no invite goes to /welcome", async () => {
    rpc.mockResolvedValue({ data: null, error: null });
    expect(await noCompanyDestination()).toBe("/welcome");
  });
  it("invite check failure falls back to /welcome", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "x" } });
    expect(await noCompanyDestination()).toBe("/welcome");
  });
});
