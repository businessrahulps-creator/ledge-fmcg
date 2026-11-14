import { beforeEach, describe, expect, it, vi } from "vitest";
import { REPORTS } from "../registry";
import { allRows } from "../format";
import { loadTallyBundle } from "../tallyData";
import { DEFAULT_LEDGERS } from "../tally";

const state = vi.hoisted(() => ({ queries: [] as { table: string; filters: [string, string, unknown][] }[], data: {} as Record<string, Record<string, any>[]> }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: {
  from: (table: string) => {
    const query = { table, filters: [] as [string, string, unknown][] };
    state.queries.push(query);
    const chain: Record<string, any> = {};
    for (const method of ["select", "order", "range", "eq", "neq", "is", "not", "in", "gte", "lte", "lt"]) {
      chain[method] = (...args: any[]) => { query.filters.push([method, args[0], args[1]]); return chain; };
    }
    chain.then = (resolve: (v: unknown) => unknown) => Promise.resolve({ data: (state.data[table] ?? []).filter(row => query.filters.every(([op, key, value]) => {
      const actual = key.split(".").reduce((obj, part) => obj?.[part], row);
      if (op === "gte") return actual >= value;
      if (op === "lte") return actual <= value;
      if (op === "lt") return actual < value;
      if (op === "eq") return actual === value;
      if (op === "neq") return actual !== value;
      if (op === "is") return (actual ?? null) === value;
      if (op === "in") return (value as unknown[]).includes(actual);
      return true;
    })), error: null }).then(resolve);
    return chain;
  },
} }));

const future = { from: "2027-02-10", to: "2027-02-20", dealerId: "dealer-1" };
beforeEach(() => { state.queries = []; state.data = {}; });

describe("report future boundaries", () => {
  for (const def of REPORTS.filter(r => r.usesDates && !["dealer_accounts", "dealer_statement"].includes(r.id))) {
    it(`${def.id} passes future boundaries without capping today`, async () => {
      await def.fetch(future);
      const bounded = state.queries.filter(q => q.filters.some(([op]) => op === "gte"));
      expect(bounded.length).toBeGreaterThan(0);
      for (const query of bounded) {
        const start = query.filters.find(([op]) => op === "gte")?.[2];
        const end = query.filters.find(([op]) => op === "lte" || op === "lt")?.[2];
        expect(start).toBe(def.id === "salesperson_targets" ? "2027-02-01" : String(start).includes("T") ? "2027-02-10T00:00:00+05:30" : future.from);
        expect(end).toBe(query.filters.some(([op]) => op === "lt") ? "2027-02-21T00:00:00+05:30" : String(end).includes("T") ? "2027-02-20T23:59:59.999+05:30" : future.to);
      }
      const rows = allRows(await def.fetch(future));
      if (def.id === "gst_summary") expect(rows).toHaveLength(4);
      else expect(rows).toEqual([]);
      for (const item of def.summary?.(rows) ?? []) expect(item.value).toBe(0);
    });
  }

  it("dealer reports keep carry-forward balances but exclude out-of-range activity", async () => {
    state.data.distributors = [{ id: "dealer-1", name: "Dealer", location: "Area" }];
    state.data.invoice_payments = [
      { distributor_id: "dealer-1", paid_on: "2027-02-09", amount: 10, status: "posted", mode: "cash" },
      { distributor_id: "dealer-1", paid_on: future.from, amount: 20, status: "posted", mode: "cash" },
      { distributor_id: "dealer-1", paid_on: future.to, amount: 30, status: "posted", mode: "cash" },
      { distributor_id: "dealer-1", paid_on: "2027-02-21", amount: 40, status: "posted", mode: "cash" },
    ];
    const statement = REPORTS.find(r => r.id === "dealer_statement");
    const accounts = REPORTS.find(r => r.id === "dealer_accounts");
    expect(statement).toBeDefined(); expect(accounts).toBeDefined();
    if (!statement || !accounts) throw new Error("Missing dealer reports");
    const rows = allRows(await statement.fetch(future));
    expect(rows.map(r => r.date)).toEqual([future.from, future.from, future.to, future.to]);
    expect(statement.summary?.(rows).map(s => s.value)).toEqual([-10, 0, 50, -60]);
    expect(allRows(await accounts.fetch(future))[0].paid).toBe(50);
  });

  it("includes both boundary days, excludes neighbours and totals only selected payments", async () => {
    state.data.invoice_payments = ["2027-02-09", future.from, future.to, "2027-02-21"].map((paid_on, i) => ({ paid_on, amount: (i + 1) * 100, status: "posted", mode: "cash" }));
    const def = REPORTS.find(r => r.id === "payments_received");
    if (!def) throw new Error("Missing payments report");
    const rows = allRows(await def.fetch(future));
    expect(rows.map(r => r.date)).toEqual([future.from, future.to]);
    expect(def.summary?.(rows).map(s => s.value)).toEqual([2, 500, 500]);
  });

  it("Tally uses the identical future range for every document and line query", async () => {
    const bundle = await loadTallyBundle(future, { sales: true, creditNotes: true, receipts: true, purchases: true, supplierPayments: true, masters: false, onlyNew: false }, "Business", DEFAULT_LEDGERS);
    expect(state.queries).toHaveLength(8);
    for (const query of state.queries) {
      expect(query.filters.find(([op]) => op === "gte")?.[2]).toBe(future.from);
      expect(query.filters.find(([op]) => op === "lte")?.[2]).toBe(future.to);
    }
    expect(Object.values(bundle.counts).every(count => count === 0)).toBe(true);
    expect(bundle.ids).toEqual([]);
  });
});