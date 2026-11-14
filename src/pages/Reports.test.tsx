import { act, fireEvent, render, screen, waitFor, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Reports from "./Reports";

const mocks = vi.hoisted(() => ({ fetch: vi.fn(), csv: vi.fn(), log: vi.fn() }));
vi.mock("@/components/layout/AppLayout", () => ({ AppLayout: ({ children }: any) => children }));
vi.mock("@/hooks/useCan", () => ({ useCan: () => true }));
vi.mock("@/context/AuthContext", () => ({ useAuth: () => ({ profile: { full_name: "Tester" }, companyId: "company-1" }) }));
vi.mock("@/context/DataContext", () => ({ useData: () => ({ companyInfo: { name: "Business" }, distributors: [] }) }));
vi.mock("@/components/reports/TallyExportPanel", () => ({ TallyExportPanel: () => null }));
vi.mock("@/lib/reports/tallyData", () => ({ logExport: mocks.log }));
vi.mock("@/lib/reports/exporters", () => ({ exportCsv: mocks.csv, exportExcel: vi.fn(), exportPdf: vi.fn(), sharePdf: vi.fn(), runExport: async (_: string, fn: () => unknown) => fn() }));
vi.mock("@/lib/reports/registry", () => {
  const def = { id: "orders", title: "Orders list", description: "Orders", group: "Sales", capability: "see_money", usesDates: true, columns: [{ key: "net", header: "Value", type: "money", total: true }], fetch: mocks.fetch, summary: (rows: any[]) => [{ label: "Total value", kind: "money", value: rows.reduce((s, r) => s + r.net, 0) }] };
  return { REPORTS: [def], GROUPS: ["Sales"], reportById: () => def };
});

beforeEach(() => {
  vi.clearAllMocks(); localStorage.clear();
  vi.useFakeTimers({ toFake: ["Date"] }); vi.setSystemTime(new Date("2026-11-14T05:48:00Z"));
  mocks.fetch.mockResolvedValue([{ name: "Data", rows: [] }]); mocks.csv.mockReturnValue(1);
});
afterEach(() => { cleanup(); vi.useRealTimers(); });
const open = async () => {
  render(<MemoryRouter initialEntries={["/reports?r=orders"]}><Reports /></MemoryRouter>);
  await waitFor(() => expect(screen.getByRole("button", { name: "CSV" })).toBeEnabled());
  fireEvent.click(screen.getByRole("button", { name: "Pick dates" }));
};

describe("Reports date selection", () => {
  it("allows a future period and exports the same rows and summary after loading", async () => {
    await open();
    fireEvent.change(screen.getByLabelText("To date"), { target: { value: "2027-02-20" } });
    fireEvent.change(screen.getByLabelText("From date"), { target: { value: "2027-02-10" } });
    await waitFor(() => expect(mocks.fetch).toHaveBeenLastCalledWith(expect.objectContaining({ from: "2027-02-10", to: "2027-02-20" })));
    await waitFor(() => expect(screen.getByRole("button", { name: "CSV" })).toBeEnabled());
    expect(screen.getByText(/Nothing between/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "CSV" }));
    await waitFor(() => expect(mocks.csv).toHaveBeenCalled());
    const ctx = mocks.csv.mock.calls[0][0];
    expect(ctx.sections).toEqual([{ name: "Data", rows: [] }]);
    expect(ctx.summary[0].value).toBe(0);
    expect(ctx.periodLabel).toBe("10 Feb 2027 – 20 Feb 2027");
    expect(mocks.log).toHaveBeenCalledWith(expect.objectContaining({ params: { from: "2027-02-10", to: "2027-02-20" } }));
  });

  it("rejects reversed dates without fetching an invalid range", async () => {
    await open(); const calls = mocks.fetch.mock.calls.length;
    fireEvent.change(screen.getByLabelText("To date"), { target: { value: "2026-10-31" } });
    fireEvent.change(screen.getByLabelText("From date"), { target: { value: "2026-11-15" } });
    expect(mocks.fetch).toHaveBeenCalledTimes(calls);
    expect(screen.getByLabelText("From date")).toHaveValue("2026-11-01");
    expect(screen.getByLabelText("To date")).toHaveValue("2026-11-14");
  });

  it("cannot export old rows while a new date range is loading", async () => {
    await open(); let resolve: (value: unknown) => void = () => {};
    mocks.fetch.mockImplementationOnce(() => new Promise(r => { resolve = r; }));
    fireEvent.change(screen.getByLabelText("To date"), { target: { value: "2027-02-20" } });
    expect(screen.getByRole("button", { name: "CSV" })).toBeDisabled();
    await act(async () => resolve([{ name: "Data", rows: [{ net: 500 }] }]));
    fireEvent.click(screen.getByRole("button", { name: "CSV" }));
    await waitFor(() => expect(mocks.csv).toHaveBeenCalled());
    expect(mocks.csv.mock.calls[0][0].summary[0].value).toBe(500);
    expect(mocks.csv.mock.calls[0][0].sections[0].rows).toEqual([{ net: 500 }]);
  });

  it("keeps every preset and historical filtering unchanged", async () => {
    await open();
    const presets = [
      ["Today", "2026-11-14", "2026-11-14"], ["This week", "2026-11-09", "2026-11-14"],
      ["This month", "2026-11-01", "2026-11-14"], ["Last month", "2026-10-01", "2026-10-31"],
      ["This year", "2026-04-01", "2026-11-14"],
    ];
    for (const [name, from, to] of presets) {
      fireEvent.click(screen.getByRole("button", { name }));
      await waitFor(() => expect(mocks.fetch).toHaveBeenLastCalledWith(expect.objectContaining({ from, to })));
    }
    fireEvent.click(screen.getByRole("button", { name: "Pick dates" }));
    fireEvent.change(screen.getByLabelText("From date"), { target: { value: "2026-01-01" } });
    fireEvent.change(screen.getByLabelText("To date"), { target: { value: "2026-01-31" } });
    await waitFor(() => expect(mocks.fetch).toHaveBeenLastCalledWith(expect.objectContaining({ from: "2026-01-01", to: "2026-01-31" })));
  });
});