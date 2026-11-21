import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const navigate = vi.fn();
const fetchInvite = vi.fn();
let auth: any = {};

vi.mock("react-router-dom", async (orig) => ({ ...(await orig<any>()), useNavigate: () => navigate }));
vi.mock("@/components/onboarding/NoCompanyGuard", () => ({ fetchMyPendingInvite: () => fetchInvite() }));
vi.mock("@/context/AuthContext", () => ({ useAuth: () => auth }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: {} , rpc: vi.fn() } }));
vi.mock("@/integrations/lovable", () => ({ lovable: { auth: {} } }));

import Auth from "./Auth";

const base = { refreshProfile: vi.fn(), user: { id: "u" }, authReady: true, profileLoaded: true };
const go = (url = "/auth?verified=1") => render(<MemoryRouter initialEntries={[url]}><Auth /></MemoryRouter>);

describe("Auth signed-in redirect", () => {
  beforeEach(() => { navigate.mockReset(); fetchInvite.mockReset(); sessionStorage.clear(); });

  it("pending invite goes straight to /invite/:token, never /welcome", async () => {
    auth = { ...base, companyId: null }; fetchInvite.mockResolvedValue("tok");
    go();
    await waitFor(() => expect(navigate).toHaveBeenCalledWith("/invite/tok", { replace: true }));
    expect(navigate).not.toHaveBeenCalledWith("/welcome", expect.anything());
  });
  it("no invite goes to /welcome", async () => {
    auth = { ...base, companyId: null }; fetchInvite.mockResolvedValue(null);
    go();
    await waitFor(() => expect(navigate).toHaveBeenCalledWith("/welcome", { replace: true }));
  });
  it("existing member goes to /dashboard without invite check", async () => {
    auth = { ...base, companyId: "c" };
    go();
    await waitFor(() => expect(navigate).toHaveBeenCalledWith("/dashboard", { replace: true }));
    expect(fetchInvite).not.toHaveBeenCalled();
  });
  it("explicit redirect still wins", async () => {
    auth = { ...base, companyId: null };
    go("/auth?redirect=/invite/abc");
    await waitFor(() => expect(navigate).toHaveBeenCalledWith("/invite/abc", { replace: true }));
    expect(fetchInvite).not.toHaveBeenCalled();
  });
  it("re-renders navigate once", async () => {
    auth = { ...base, companyId: null }; fetchInvite.mockResolvedValue("tok");
    const r = go();
    auth = { ...auth }; r.rerender(<MemoryRouter initialEntries={["/auth"]}><Auth /></MemoryRouter>);
    await waitFor(() => expect(navigate).toHaveBeenCalled());
    await new Promise((res) => setTimeout(res, 20));
    expect(navigate).toHaveBeenCalledTimes(1);
  });
});
