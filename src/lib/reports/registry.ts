import { supabase } from "@/integrations/supabase/client";
import type { ReportDef, ReportParams, ReportRow, ReportSection } from "./types";

/** Money that reached us: kept, still to give back, or already given back (that leaves as its own "money out" line). */
const MONEY_RECEIVED = ["posted", "refund_due", "refunded"];
const istDate = (ts: string) => new Date(new Date(ts).getTime() + 330 * 60000).toISOString().slice(0, 10);
import { r2, sumBy } from "./format";

/* Reports read straight from the database (company rules apply), page by page,
   so a year of bills never depends on what happens to be loaded in the app. */

const PAGE = 1000;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchAll<T = any>(build: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>): Promise<T[]> {
  const out: T[] = [];
  for (let i = 0; i < 200; i++) {
    const { data, error } = await build(i * PAGE, i * PAGE + PAGE - 1);
    if (error) throw error;
    out.push(...(data ?? []));
    if (!data || data.length < PAGE) break;
  }
  return out;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;
const one = (rows: ReportRow[], name = "Data"): ReportSection[] => [{ name, rows }];
const istStart = (k: string) => `${k}T00:00:00+05:30`;
const istEnd = (k: string) => `${k}T23:59:59.999+05:30`;
const n = (v: unknown) => Number(v) || 0;

function groupSum(rows: ReportRow[], key: string, sums: string[], extra?: (r: ReportRow) => ReportRow): ReportRow[] {
  const m = new Map<string, ReportRow>();
  for (const r of rows) {
    const k = String(r[key] ?? "—");
    let g = m.get(k);
    if (!g) { g = { [key]: k, count: 0, ...(extra ? extra(r) : {}) }; for (const s of sums) g[s] = 0; m.set(k, g); }
    g.count = n(g.count) + 1;
    for (const s of sums) g[s] = r2(n(g[s]) + n(r[s]));
  }
  return [...m.values()].sort((a, b) => n(b[sums[0]]) - n(a[sums[0]]));
}

async function liveOrders(p: ReportParams, cancelled: boolean) {
  const rows = await fetchAll((a, b) => {
    let q = db.from("orders")
      .select("id,order_number,date,distributor_name,salesperson_name,total,scheme_savings,payment_status,delivery_status,cancelled_at,cancel_reason")
      .gte("date", p.from).lte("date", p.to).order("date").order("order_number").range(a, b);
    q = cancelled ? q.not("cancelled_at", "is", null) : q.is("cancelled_at", null);
    return q;
  });
  // orders.total is before offers; offers are subtracted once here.
  return rows.map((o: any) => ({
    order_number: o.order_number, date: o.date, dealer: o.distributor_name, salesperson: o.salesperson_name,
    gross: r2(o.total), offers: r2(o.scheme_savings), net: r2(n(o.total) - n(o.scheme_savings)),
    payment: o.payment_status, delivery: o.delivery_status, reason: o.cancel_reason || "",
  }));
}

const statusWord: Record<string, string> = { pending: "Waiting", dispatched: "Sent", delivered: "Delivered", paid: "Paid", partial: "Part paid" };
const modeWord: Record<string, string> = { cash: "Cash", upi: "UPI", bank_transfer: "Bank", cheque: "Cheque" };

export const REPORTS: ReportDef[] = [
  // ───────── Sales
  {
    id: "orders", group: "Sales", title: "Orders list", capability: "see_money", usesDates: true,
    description: "Every order taken in these dates, with value after offers.",
    columns: [
      { key: "order_number", header: "Order no.", weight: 1.6 }, { key: "date", header: "Date", type: "date" },
      { key: "dealer", header: "Dealer", weight: 2 }, { key: "salesperson", header: "Taken by" },
      { key: "net", header: "Value", type: "money", total: true },
      { key: "payment", header: "Payment" }, { key: "delivery", header: "Delivery" },
    ],
    fetch: async p => one((await liveOrders(p, false)).map(r => ({ ...r, payment: statusWord[r.payment] ?? r.payment, delivery: statusWord[r.delivery] ?? r.delivery }))),
    summary: rows => [
      { label: "Orders", value: rows.length, kind: "number" },
      { label: "Total value", value: sumBy(rows, "net"), kind: "money" },
      { label: "Average order", value: rows.length ? Math.round(sumBy(rows, "net") / rows.length) : 0, kind: "money" },
    ],
  },
  {
    id: "sales_by_dealer", group: "Sales", title: "Sales by dealer", capability: "see_money", usesDates: true,
    description: "How much each dealer ordered, biggest first.",
    columns: [
      { key: "dealer", header: "Dealer", weight: 3 }, { key: "count", header: "Orders", type: "number", total: true },
      { key: "offers", header: "Offers given", type: "money", total: true }, { key: "net", header: "Value", type: "money", total: true },
    ],
    fetch: async p => one(groupSum(await liveOrders(p, false), "dealer", ["net", "offers"])),
    summary: rows => [
      { label: "Dealers who ordered", value: rows.length, kind: "number" },
      { label: "Total value", value: sumBy(rows, "net"), kind: "money" },
    ],
    note: rows => rows.length ? `Top dealer: ${rows[0].dealer}.` : null,
  },
  {
    id: "sales_by_salesperson", group: "Sales", title: "Sales by salesperson", capability: "see_money", usesDates: true,
    description: "Orders and value brought in by each person.",
    columns: [
      { key: "salesperson", header: "Salesperson", weight: 3 }, { key: "count", header: "Orders", type: "number", total: true },
      { key: "net", header: "Value", type: "money", total: true },
    ],
    fetch: async p => one(groupSum(await liveOrders(p, false), "salesperson", ["net"])),
  },
  {
    id: "sales_by_product", group: "Sales", title: "Sales by product", capability: "see_money", usesDates: true,
    description: "Quantity ordered of each product (free pieces shown separately).",
    columns: [
      { key: "product", header: "Product", weight: 3 }, { key: "qty", header: "Qty", type: "number", total: true },
      { key: "free", header: "Free qty", type: "number", total: true }, { key: "value", header: "Value before offers", type: "money", total: true },
    ],
    fetch: async p => {
      const lines = await fetchAll((a, b) => db.from("order_lines")
        .select("product_name,quantity,free_quantity,line_total,orders!inner(date,cancelled_at)")
        .gte("orders.date", p.from).lte("orders.date", p.to).is("orders.cancelled_at", null).range(a, b));
      const rows = lines.map((l: any) => ({ product: l.product_name, qty: n(l.quantity), free: n(l.free_quantity), value: r2(l.line_total) }));
      return one(groupSum(rows, "product", ["value", "qty", "free"]).map(({ count: _c, ...r }) => r));
    },
  },
  {
    id: "cancelled_orders", group: "Sales", title: "Cancelled orders", capability: "see_money", usesDates: true,
    description: "Orders that were cancelled, with the reason given.",
    columns: [
      { key: "order_number", header: "Order no.", weight: 1.6 }, { key: "date", header: "Date", type: "date" },
      { key: "dealer", header: "Dealer", weight: 2 }, { key: "net", header: "Value", type: "money", total: true },
      { key: "reason", header: "Reason", weight: 2 },
    ],
    fetch: async p => one(await liveOrders(p, true)),
  },

  // ───────── Money
  {
    id: "money_to_collect", group: "Money", title: "Money to collect", capability: "see_money", usesDates: false, filters: ["area"],
    description: "Every dealer who owes you money today, biggest first.",
    columns: [
      { key: "dealer", header: "Dealer", weight: 2 }, { key: "area", header: "Area" }, { key: "phone", header: "Phone" },
      { key: "limit", header: "Credit limit", type: "money" }, { key: "unpaid", header: "Unpaid", type: "money", total: true },
    ],
    fetch: async p => {
      const [ev, d] = await Promise.all([
        dealerEvents(p.area),
        fetchAll((a, b) => db.from("distributors").select("id,location,contact,credit_limit").range(a, b)),
      ]);
      const info = new Map(d.map((x: any) => [x.id, x]));
      const m = new Map<string, ReportRow>();
      for (const e of ev) {
        const x: any = info.get(e.dealerId);
        const r = m.get(e.dealerId) ?? { dealer: e.dealer, area: x?.location ?? "", phone: x?.contact ?? "", limit: r2(x?.credit_limit), unpaid: 0 };
        r.unpaid = r2(n(r.unpaid) + e.dr - e.cr); m.set(e.dealerId, r);
      }
      return one([...m.values()].filter(r => n(r.unpaid) > 0).sort((a, b) => n(b.unpaid) - n(a.unpaid)));
    },
    summary: rows => [
      { label: "Dealers who owe", value: rows.length, kind: "number" },
      { label: "Total unpaid", value: sumBy(rows, "unpaid"), kind: "money" },
    ],
    note: rows => {
      const over = rows.filter(r => n(r.limit) > 0 && n(r.unpaid) > n(r.limit)).length;
      return rows.length ? `${rows.length} dealers owe ${"₹" + new Intl.NumberFormat("en-IN").format(Math.round(sumBy(rows, "unpaid")))}${over ? `; ${over} are over their credit limit` : ""}.` : null;
    },
  },
  {
    id: "payments_received", group: "Money", title: "Payments received", capability: "see_money", usesDates: true,
    description: "Money dealers paid you, by date and mode.",
    columns: [
      { key: "date", header: "Date", type: "date" }, { key: "dealer", header: "Dealer", weight: 2 },
      { key: "mode", header: "Mode" }, { key: "reference", header: "Reference" }, { key: "amount", header: "Amount", type: "money", total: true },
    ],
    fetch: async p => {
      const rows = await fetchAll((a, b) => db.from("invoice_payments").select("paid_on,amount,mode,reference,distributors(name)").in("status", MONEY_RECEIVED).gte("paid_on", p.from).lte("paid_on", p.to).order("paid_on").range(a, b));
      return one(rows.map((x: any) => ({ date: x.paid_on, dealer: x.distributors?.name ?? "", mode: modeWord[x.mode] ?? x.mode, reference: x.reference, amount: r2(x.amount) })));
    },
    summary: rows => [
      { label: "Payments", value: rows.length, kind: "number" },
      { label: "Collected", value: sumBy(rows, "amount"), kind: "money" },
      { label: "In cash", value: sumBy(rows.filter(r => r.mode === "Cash"), "amount"), kind: "money" },
    ],
  },
  {
    id: "credit_notes", group: "Money", title: "Credit notes", capability: "see_money", usesDates: true,
    description: "Goods returned by dealers and the money taken off their bills.",
    columns: [
      { key: "number", header: "Credit note", weight: 1.6 }, { key: "date", header: "Date", type: "date" }, { key: "dealer", header: "Dealer", weight: 2 },
      { key: "reason", header: "Reason", weight: 2 }, { key: "taxable", header: "Before GST", type: "money", total: true },
      { key: "tax", header: "GST", type: "money", total: true }, { key: "total", header: "Total", type: "money", total: true },
    ],
    fetch: async p => {
      const rows = await fetchAll((a, b) => db.from("credit_notes").select("credit_note_number,note_date,reason,subtotal,total_tax,grand_total,distributors(name)").gte("note_date", p.from).lte("note_date", p.to).order("note_date").range(a, b));
      return one(rows.map((x: any) => ({ number: x.credit_note_number, date: x.note_date, dealer: x.distributors?.name ?? "", reason: x.reason, taxable: r2(x.subtotal), tax: r2(x.total_tax), total: r2(x.grand_total) })));
    },
  },
  {
    id: "money_by_age", group: "Money", title: "Money to collect by age", capability: "see_money", usesDates: false, filters: ["area"],
    description: "How long each dealer's unpaid bills have been waiting: 0–30, 31–60, 61–90, 90+ days.",
    columns: [
      { key: "dealer", header: "Dealer", weight: 2.2 }, { key: "b0", header: "0–30 days", type: "money", total: true },
      { key: "b31", header: "31–60 days", type: "money", total: true }, { key: "b61", header: "61–90 days", type: "money", total: true },
      { key: "b90", header: "90+ days", type: "money", total: true }, { key: "unpaid", header: "Unpaid", type: "money", total: true },
    ],
    fetch: async p => {
      const today = Date.parse(TODAY() + "T00:00:00+05:30");
      const bills = await billLedger(p.area);
      const m = new Map<string, ReportRow>();
      for (const x of bills) {
        if (x.due <= 0) continue;
        const r = m.get(x.dealerId) ?? { dealer: x.dealer, b0: 0, b31: 0, b61: 0, b90: 0, unpaid: 0 };
        const age = Math.floor((today - Date.parse(x.date + "T00:00:00+05:30")) / 86400000);
        const k = age > 90 ? "b90" : age > 60 ? "b61" : age > 30 ? "b31" : "b0";
        r[k] = r2(n(r[k]) + x.due); r.unpaid = r2(n(r.unpaid) + x.due); m.set(x.dealerId, r);
      }
      // Advances / payments not linked to a bill settle the oldest money first,
      // so the total matches each dealer's real balance (and the dashboard).
      const bal = new Map((await fetchAll((a, b) => db.from("distributors").select("id,outstanding_amount").range(a, b))).map((d: any) => [d.id, n(d.outstanding_amount)]));
      for (const [id, r] of m) {
        let spare = r2(n(r.unpaid) - Math.max(0, bal.get(id) ?? n(r.unpaid)));
        for (const k of ["b90", "b61", "b31", "b0"]) {
          if (spare <= 0) break;
          const take = Math.min(n(r[k]), spare); r[k] = r2(n(r[k]) - take); r.unpaid = r2(n(r.unpaid) - take); spare = r2(spare - take);
        }
      }
      return one([...m.values()].filter(r => n(r.unpaid) > 0).sort((a, b) => n(b.unpaid) - n(a.unpaid)));
    },
    summary: rows => [
      { label: "Total unpaid", value: sumBy(rows, "unpaid"), kind: "money" },
      { label: "Over 90 days", value: sumBy(rows, "b90"), kind: "money" },
      { label: "Dealers over 90 days", value: rows.filter(r => n(r.b90) > 0).length, kind: "number" },
    ],
    note: rows => { const c = rows.filter(r => n(r.b90) > 0).length; return c ? `${c} dealer${c === 1 ? "" : "s"} have bills waiting over 90 days. Call them first.` : null; },
  },
  {
    id: "dealer_accounts", group: "Money", title: "Dealer account summary", capability: "see_money", usesDates: true, filters: ["area"],
    description: "For each dealer: billed, paid and returned in these dates, and what they owe on bills today.",
    columns: [
      { key: "dealer", header: "Dealer", weight: 2.4 }, { key: "billed", header: "Billed", type: "money", total: true },
      { key: "paid", header: "Paid", type: "money", total: true }, { key: "returned", header: "Returned", type: "money", total: true },
      { key: "unpaid", header: "Owes today", type: "money", total: true },
    ],
    fetch: async p => {
      const ev = await dealerEvents(p.area);
      const m = new Map<string, ReportRow>();
      const get = (id: string, name: string) => { let r = m.get(id); if (!r) { r = { dealer: name, billed: 0, paid: 0, returned: 0, unpaid: 0 }; m.set(id, r); } return r; };
      for (const e of ev) {
        const r = get(e.dealerId, e.dealer);
        r.unpaid = r2(n(r.unpaid) + e.dr - e.cr);
        if (e.date < p.from || e.date > p.to) continue;
        if (e.kind === "bill") r.billed = r2(n(r.billed) + e.dr);
        else if (e.kind === "payment") r.paid = r2(n(r.paid) + e.cr);
        else r.returned = r2(n(r.returned) + e.cr);
      }
      return one([...m.values()].map((r): ReportRow => ({ ...r, unpaid: r2(Math.max(0, n(r.unpaid))) }))
        .filter(r => r.billed || r.paid || r.returned || r.unpaid).sort((a, b) => String(a.dealer).localeCompare(String(b.dealer))));
    },
  },
  {
    id: "dealer_statement", group: "Money", title: "Dealer statement", capability: "see_money", usesDates: true, filters: ["dealer"],
    description: "One dealer's bills, payments and returns with a running balance. Send it to them.",
    columns: [
      { key: "date", header: "Date", type: "date" }, { key: "what", header: "What", weight: 1.4 }, { key: "ref", header: "No.", weight: 1.6 },
      { key: "dr", header: "Bill (+)", type: "money", total: true }, { key: "cr", header: "Paid / returned (−)", type: "money", total: true },
      { key: "balance", header: "Balance", type: "money" },
    ],
    fetch: async p => {
      if (!p.dealerId) return one([]);
      const ev = (await dealerEvents(undefined, p.dealerId)).sort((a, b) => a.date.localeCompare(b.date) || a.order - b.order);
      let bal = 0; const rows: ReportRow[] = [];
      for (const e of ev) { if (e.date < p.from) bal += e.dr - e.cr; }
      rows.push({ date: p.from, what: "Opening balance", ref: "", dr: null, cr: null, balance: r2(bal) });
      for (const e of ev) {
        if (e.date < p.from || e.date > p.to) continue;
        bal += e.dr - e.cr;
        rows.push({ date: e.date, what: e.what, ref: e.ref, dr: e.dr || null, cr: e.cr || null, balance: r2(bal) });
      }
      rows.push({ date: p.to, what: "Closing balance", ref: "", dr: null, cr: null, balance: r2(bal) });
      return one(rows);
    },
    summary: rows => {
      const last = rows[rows.length - 1];
      return [
        { label: "Opening", value: n(rows[0]?.balance), kind: "money" },
        { label: "Billed", value: sumBy(rows, "dr"), kind: "money" },
        { label: "Paid / returned", value: sumBy(rows, "cr"), kind: "money" },
        { label: "Closing", value: n(last?.balance), kind: "money" },
      ];
    },
  },
  {
    id: "day_book", group: "Money", title: "Day book", capability: "see_money", usesDates: true,
    description: "Everything that moved money, day by day: bills, payments in and out, returns.",
    columns: [
      { key: "date", header: "Date", type: "date" }, { key: "type", header: "What", weight: 1.4 }, { key: "ref", header: "No.", weight: 1.6 },
      { key: "party", header: "Dealer / supplier", weight: 2 }, { key: "in", header: "Money in", type: "money", total: true },
      { key: "out", header: "Money out", type: "money", total: true }, { key: "billed", header: "Bill value", type: "money", total: true },
    ],
    fetch: async p => {
      const [bills, pay, back, cn, pb, sp] = await Promise.all([
        salesBills(p),
        fetchAll((a, b) => db.from("invoice_payments").select("paid_on,amount,mode,distributors(name)").in("status", MONEY_RECEIVED).gte("paid_on", p.from).lte("paid_on", p.to).range(a, b)),
        fetchAll((a, b) => db.from("invoice_payments").select("refunded_at,amount,distributors(name)").eq("status", "refunded").gte("refunded_at", `${p.from}T00:00:00+05:30`).lte("refunded_at", `${p.to}T23:59:59.999+05:30`).range(a, b)),
        fetchAll((a, b) => db.from("credit_notes").select("credit_note_number,note_date,grand_total,distributors(name)").gte("note_date", p.from).lte("note_date", p.to).range(a, b)),
        fetchAll((a, b) => db.from("purchase_bills").select("bill_date,supplier_name,supplier_bill_no,grand_total").neq("status", "cancelled").gte("bill_date", p.from).lte("bill_date", p.to).range(a, b)),
        fetchAll((a, b) => db.from("supplier_payments").select("paid_on,amount,mode,suppliers(name)").eq("status", "posted").gte("paid_on", p.from).lte("paid_on", p.to).range(a, b)),
      ]);
      const rows: ReportRow[] = [
        ...bills.map((x: any) => ({ date: x.invoice_date, type: "Sales bill", ref: x.invoice_number, party: x.buyer_name, in: null, out: null, billed: r2(x.grand_total) })),
        ...pay.map((x: any) => ({ date: x.paid_on, type: `Payment in (${modeWord[x.mode] ?? x.mode})`, ref: "", party: x.distributors?.name ?? "", in: r2(x.amount), out: null, billed: null })),
        ...back.map((x: any) => ({ date: istDate(x.refunded_at), type: "Money given back", ref: "", party: x.distributors?.name ?? "", in: null, out: r2(x.amount), billed: null })),
        ...cn.map((x: any) => ({ date: x.note_date, type: "Credit note", ref: x.credit_note_number, party: x.distributors?.name ?? "", in: null, out: null, billed: -r2(x.grand_total) })),
        ...pb.map((x: any) => ({ date: x.bill_date, type: "Purchase bill", ref: x.supplier_bill_no, party: x.supplier_name, in: null, out: null, billed: null })),
        ...sp.map((x: any) => ({ date: x.paid_on, type: `Paid supplier (${modeWord[x.mode] ?? x.mode})`, ref: "", party: x.suppliers?.name ?? "", in: null, out: r2(x.amount), billed: null })),
      ].sort((a, b) => String(a.date).localeCompare(String(b.date)));
      return one(rows);
    },
    summary: rows => [
      { label: "Money in", value: sumBy(rows, "in"), kind: "money" },
      { label: "Money out", value: sumBy(rows, "out"), kind: "money" },
      { label: "Net", value: r2(sumBy(rows, "in") - sumBy(rows, "out")), kind: "money" },
    ],
  },
  {
    id: "cancelled_payments", group: "Money", title: "Cancelled payments", capability: "see_money", usesDates: true,
    description: "Payments that were entered by mistake and cancelled, with the reason.",
    columns: [
      { key: "date", header: "Paid on", type: "date" }, { key: "dealer", header: "Dealer", weight: 2 }, { key: "amount", header: "Amount", type: "money", total: true },
      { key: "reason", header: "Why cancelled", weight: 2 },
    ],
    fetch: async p => {
      const rows = await fetchAll((a, b) => db.from("invoice_payments").select("paid_on,amount,void_reason,distributors(name)").eq("status", "voided").gte("paid_on", p.from).lte("paid_on", p.to).order("paid_on").range(a, b));
      return one(rows.map((x: any) => ({ date: x.paid_on, dealer: x.distributors?.name ?? "", amount: r2(x.amount), reason: x.void_reason })));
    },
  },

  // ───────── Stock
  {
    id: "stock_now", group: "Stock", title: "Stock now", capability: null, usesDates: false,
    description: "How much of each item is in each godown today, and what it is worth.",
    columns: [
      { key: "product", header: "Item", weight: 3 }, { key: "code", header: "Product code" }, { key: "godown", header: "Godown" },
      { key: "qty", header: "In stock", type: "number", total: true }, { key: "unit", header: "Unit" },
      { key: "value", header: "Value (avg cost)", type: "money", total: true },
    ],
    fetch: async () => one(await stockRows()),
    summary: rows => [
      { label: "Items", value: rows.length, kind: "number" },
      { label: "Stock value", value: sumBy(rows, "value"), kind: "money" },
      { label: "Low or empty", value: rows.filter(r => r.low === "Yes").length, kind: "number" },
    ],
  },
  {
    id: "low_stock", group: "Stock", title: "Low stock", capability: null, usesDates: false,
    description: "Items at or below their low-stock level. Time to reorder.",
    columns: [
      { key: "product", header: "Item", weight: 3 }, { key: "godown", header: "Godown" },
      { key: "qty", header: "In stock", type: "number" }, { key: "threshold", header: "Low level", type: "number" }, { key: "unit", header: "Unit" },
    ],
    fetch: async () => one((await stockRows()).filter(r => r.low === "Yes").sort((a, b) => n(a.qty) - n(b.qty))),
  },
  {
    id: "stock_movements", group: "Stock", title: "Stock in and out", capability: null, usesDates: true,
    description: "Every time stock went up or down: sent to dealers, bought, returned, adjusted.",
    columns: [
      { key: "date", header: "Date", type: "date" }, { key: "product", header: "Item", weight: 2 }, { key: "godown", header: "Godown" },
      { key: "type", header: "What happened" }, { key: "change", header: "Change", type: "number" }, { key: "note", header: "Note", weight: 2 },
    ],
    fetch: async p => {
      const rows = await fetchAll((a, b) => db.from("stock_movements").select("created_at,delta,movement_type,note,products(name),godowns(name)").gte("created_at", istStart(p.from)).lte("created_at", istEnd(p.to)).order("created_at").range(a, b));
      const word: Record<string, string> = { dispatch: "Sent to dealer", purchase: "Bought", purchase_return: "Returned to supplier", return_restock: "Returned by dealer", manual_adjust: "Adjusted", adjustment: "Adjusted", opening: "Opening stock", dispatch_reversal: "Sending undone", purchase_cancel: "Bill cancelled" };
      return one(rows.map((x: any) => ({ date: new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date(x.created_at)), product: x.products?.name ?? "", godown: x.godowns?.name ?? "", type: word[x.movement_type] ?? x.movement_type, change: n(x.delta), note: x.note })));
    },
  },

  {
    id: "slow_moving", group: "Stock", title: "Slow-moving stock", capability: null, usesDates: false,
    description: "Items in stock that haven't been sent to any dealer in the last 60 days.",
    columns: [
      { key: "product", header: "Item", weight: 3 }, { key: "godown", header: "Godown" }, { key: "qty", header: "In stock", type: "number", total: true },
      { key: "last", header: "Last sent", type: "date" }, { key: "value", header: "Value", type: "money", total: true },
    ],
    fetch: async () => {
      const since = new Date(Date.now() - 60 * 86400000).toISOString();
      const [items, mv] = await Promise.all([
        fetchAll((a, b) => db.from("stock_items").select("product_id,godown_id,quantity,products(name,avg_cost,base_price,item_kind),godowns(name)").gt("quantity", 0).range(a, b)),
        fetchAll((a, b) => db.from("stock_movements").select("product_id,godown_id,created_at").eq("movement_type", "dispatch").order("created_at", { ascending: false }).range(a, b)),
      ]);
      const last = new Map<string, string>();
      for (const m of mv) { const k = m.product_id + "|" + m.godown_id; if (!last.has(k)) last.set(k, m.created_at); }
      return one(items.filter((x: any) => x.products?.item_kind !== "raw_material").map((x: any) => ({ x, l: last.get(x.product_id + "|" + x.godown_id) }))
        .filter(({ l }) => !l || l < since)
        .map(({ x, l }) => ({ product: x.products?.name ?? "", godown: x.godowns?.name ?? "", qty: n(x.quantity), last: l ? new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date(l)) : null, value: r2(n(x.quantity) * (n(x.products?.avg_cost) || n(x.products?.base_price))) }))
        .sort((a, b) => b.value - a.value));
    },
    summary: rows => [
      { label: "Slow items", value: rows.length, kind: "number" },
      { label: "Money stuck in them", value: sumBy(rows, "value"), kind: "money" },
    ],
  },

  // ───────── Buying
  {
    id: "purchase_bills", group: "Buying", title: "Purchase bills", capability: "manage_buying", usesDates: true,
    description: "Bills from your suppliers. Cancelled bills are marked and not added up.",
    columns: [
      { key: "date", header: "Date", type: "date" }, { key: "supplier", header: "Supplier", weight: 2 }, { key: "bill_no", header: "Bill no.", weight: 1.6 },
      { key: "taxable", header: "Before GST", type: "money", total: true }, { key: "tax", header: "GST", type: "money", total: true },
      { key: "total", header: "Total", type: "money", total: true }, { key: "status", header: "Status" },
    ],
    fetch: async p => {
      const rows = await fetchAll((a, b) => db.from("purchase_bills").select("bill_date,supplier_name,supplier_bill_no,subtotal,total_tax,grand_total,status").gte("bill_date", p.from).lte("bill_date", p.to).order("bill_date").range(a, b));
      return one(rows.map((x: any) => {
        const live = x.status !== "cancelled";
        return { date: x.bill_date, supplier: x.supplier_name, bill_no: x.supplier_bill_no, taxable: live ? r2(x.subtotal) : 0, tax: live ? r2(x.total_tax) : 0, total: live ? r2(x.grand_total) : 0, status: live ? "Saved" : "Cancelled" };
      }));
    },
  },
  {
    id: "supplier_payments", group: "Buying", title: "Supplier payments", capability: "manage_buying", usesDates: true,
    description: "Money you paid to suppliers.",
    columns: [
      { key: "date", header: "Date", type: "date" }, { key: "supplier", header: "Supplier", weight: 2 }, { key: "mode", header: "Mode" },
      { key: "reference", header: "Reference" }, { key: "amount", header: "Amount", type: "money", total: true },
    ],
    fetch: async p => {
      const rows = await fetchAll((a, b) => db.from("supplier_payments").select("paid_on,amount,mode,reference,suppliers(name)").eq("status", "posted").gte("paid_on", p.from).lte("paid_on", p.to).order("paid_on").range(a, b));
      return one(rows.map((x: any) => ({ date: x.paid_on, supplier: x.suppliers?.name ?? "", mode: modeWord[x.mode] ?? x.mode, reference: x.reference, amount: r2(x.amount) })));
    },
  },
  {
    id: "supplier_balances", group: "Buying", title: "Money you owe suppliers", capability: "manage_buying", usesDates: false,
    description: "What you owe each supplier today.",
    columns: [
      { key: "supplier", header: "Supplier", weight: 3 }, { key: "phone", header: "Phone" }, { key: "owed", header: "You owe", type: "money", total: true },
    ],
    fetch: async () => {
      const s = await fetchAll((a, b) => db.from("suppliers").select("id,name,phone").order("name").range(a, b));
      const bal = await Promise.all(s.map(async (x: any) => { const { data } = await db.rpc("supplier_balance", { p_supplier: x.id }); return n(data); }));
      return one(s.map((x: any, i: number) => ({ supplier: x.name, phone: x.phone, owed: r2(bal[i]) })).filter(r => r.owed !== 0).sort((a, b) => b.owed - a.owed));
    },
  },

  // ───────── GST
  {
    id: "gst_sales_register", group: "GST", title: "GST sales register", capability: "see_money", usesDates: true,
    description: "Every GST bill, split into B2B (buyer has GSTIN) and B2C. For GSTR-1.",
    columns: [
      { key: "number", header: "Bill no.", weight: 1.6 }, { key: "date", header: "Date", type: "date" }, { key: "buyer", header: "Buyer", weight: 2 },
      { key: "gstin", header: "GSTIN", weight: 1.5 }, { key: "pos", header: "State" },
      { key: "taxable", header: "Before GST", type: "money", total: true }, { key: "cgst", header: "CGST", type: "money", total: true },
      { key: "sgst", header: "SGST", type: "money", total: true }, { key: "igst", header: "IGST", type: "money", total: true },
      { key: "total", header: "Bill total", type: "money", total: true },
    ],
    fetch: async p => {
      const rows = (await salesBills(p)).map(x => ({ number: x.invoice_number, date: x.invoice_date, buyer: x.buyer_name, gstin: x.buyer_gstin, pos: x.place_of_supply_state_code || x.buyer_state_code, taxable: r2(x.subtotal), cgst: r2(x.cgst_amount), sgst: r2(x.sgst_amount), igst: r2(x.igst_amount), total: r2(x.grand_total) }));
      return [{ name: "B2B", rows: rows.filter(r => r.gstin) }, { name: "B2C", rows: rows.filter(r => !r.gstin) }];
    },
    summary: rows => [
      { label: "Bills", value: rows.length, kind: "number" },
      { label: "Before GST", value: sumBy(rows, "taxable"), kind: "money" },
      { label: "GST collected", value: r2(sumBy(rows, "cgst") + sumBy(rows, "sgst") + sumBy(rows, "igst")), kind: "money" },
    ],
  },
  {
    id: "gst_hsn", group: "GST", title: "HSN summary", capability: "see_money", usesDates: true,
    description: "Sales added up by HSN code and GST rate. For GSTR-1 table 12.",
    columns: [
      { key: "hsn", header: "HSN" }, { key: "rate", header: "GST %", type: "number" }, { key: "qty", header: "Qty", type: "number", total: true },
      { key: "taxable", header: "Before GST", type: "money", total: true }, { key: "cgst", header: "CGST", type: "money", total: true },
      { key: "sgst", header: "SGST", type: "money", total: true }, { key: "igst", header: "IGST", type: "money", total: true },
    ],
    fetch: async p => {
      const lines = await fetchAll((a, b) => db.from("invoice_lines").select("hsn_code,gst_rate,quantity,taxable_value,cgst_amount,sgst_amount,igst_amount,invoices!inner(invoice_date,doc_type,status)").eq("invoices.doc_type", "gst_invoice").neq("invoices.status", "draft").gte("invoices.invoice_date", p.from).lte("invoices.invoice_date", p.to).range(a, b));
      const m = new Map<string, ReportRow>();
      for (const l of lines as any[]) {
        const k = `${l.hsn_code || "—"}|${n(l.gst_rate)}`;
        const g = m.get(k) ?? { hsn: l.hsn_code || "—", rate: n(l.gst_rate), qty: 0, taxable: 0, cgst: 0, sgst: 0, igst: 0 };
        g.qty = n(g.qty) + n(l.quantity); g.taxable = r2(n(g.taxable) + n(l.taxable_value));
        g.cgst = r2(n(g.cgst) + n(l.cgst_amount)); g.sgst = r2(n(g.sgst) + n(l.sgst_amount)); g.igst = r2(n(g.igst) + n(l.igst_amount));
        m.set(k, g);
      }
      return one([...m.values()].sort((a, b) => String(a.hsn).localeCompare(String(b.hsn)) || n(a.rate) - n(b.rate)));
    },
  },
  {
    id: "gst_purchase_register", group: "GST", title: "GST purchase register", capability: "manage_buying", usesDates: true,
    description: "GST on your purchase bills (cancelled bills left out). Check with your accountant before claiming.",
    columns: [
      { key: "date", header: "Date", type: "date" }, { key: "supplier", header: "Supplier", weight: 2 }, { key: "gstin", header: "GSTIN", weight: 1.5 },
      { key: "bill_no", header: "Bill no.", weight: 1.6 }, { key: "taxable", header: "Before GST", type: "money", total: true },
      { key: "cgst", header: "CGST", type: "money", total: true }, { key: "sgst", header: "SGST", type: "money", total: true },
      { key: "igst", header: "IGST", type: "money", total: true }, { key: "total", header: "Total", type: "money", total: true },
    ],
    fetch: async p => {
      const rows = await fetchAll((a, b) => db.from("purchase_bills").select("bill_date,supplier_name,supplier_bill_no,subtotal,cgst_amount,sgst_amount,igst_amount,grand_total,suppliers(gstin)").neq("status", "cancelled").gte("bill_date", p.from).lte("bill_date", p.to).order("bill_date").range(a, b));
      return one(rows.map((x: any) => ({ date: x.bill_date, supplier: x.supplier_name, gstin: x.suppliers?.gstin ?? "", bill_no: x.supplier_bill_no, taxable: r2(x.subtotal), cgst: r2(x.cgst_amount), sgst: r2(x.sgst_amount), igst: r2(x.igst_amount), total: r2(x.grand_total) })));
    },
  },
  {
    id: "gst_summary", group: "GST", title: "GST summary", capability: "see_money", usesDates: true,
    description: "GST on sales minus GST on purchases for these dates. Like GSTR-3B. An estimate for your accountant.",
    columns: [
      { key: "line", header: "", weight: 3 }, { key: "taxable", header: "Before GST", type: "money" },
      { key: "cgst", header: "CGST", type: "money" }, { key: "sgst", header: "SGST", type: "money" }, { key: "igst", header: "IGST", type: "money" },
    ],
    fetch: async p => {
      const sales = await salesBills(p);
      const cns = await fetchAll((a, b) => db.from("credit_notes").select("subtotal,cgst_amount,sgst_amount,igst_amount").gte("note_date", p.from).lte("note_date", p.to).range(a, b));
      const buys = await fetchAll((a, b) => db.from("purchase_bills").select("subtotal,cgst_amount,sgst_amount,igst_amount").neq("status", "cancelled").gte("bill_date", p.from).lte("bill_date", p.to).range(a, b));
      const add = (rs: any[]) => ({ taxable: r2(rs.reduce((s, x) => s + n(x.subtotal), 0)), cgst: r2(rs.reduce((s, x) => s + n(x.cgst_amount), 0)), sgst: r2(rs.reduce((s, x) => s + n(x.sgst_amount), 0)), igst: r2(rs.reduce((s, x) => s + n(x.igst_amount), 0)) });
      const S = add(sales), C = add(cns), B = add(buys);
      const net = { taxable: 0, cgst: r2(S.cgst - C.cgst - B.cgst), sgst: r2(S.sgst - C.sgst - B.sgst), igst: r2(S.igst - C.igst - B.igst) };
      return one([
        { line: "GST on sales", ...S },
        { line: "Less: credit notes", ...C },
        { line: "Less: GST on purchases", ...B },
        { line: "GST to pay (estimate)", ...net, taxable: null },
      ]);
    },
    note: () => "Purchase GST is shown as recorded; your accountant decides what can be claimed.",
  },

  // ───────── Team
  {
    id: "shop_visits", group: "Team", title: "Shop visits", capability: null, usesDates: true,
    description: "Every shop visit your team logged, with what happened.",
    columns: [
      { key: "date", header: "Date", type: "date" }, { key: "dealer", header: "Shop", weight: 2 }, { key: "by", header: "Visited by" },
      { key: "outcome", header: "What happened", weight: 1.5 }, { key: "promise", header: "Promised", type: "money", total: true },
      { key: "status", header: "Promise kept?" }, { key: "note", header: "Note", weight: 2 },
    ],
    fetch: async p => {
      const rows = await fetchAll((a, b) => db.from("shop_visits").select("created_at,outcome,promise_amount,promise_status,note,created_by_name,distributors(name)").gte("created_at", istStart(p.from)).lte("created_at", istEnd(p.to)).order("created_at").range(a, b));
      const ow: Record<string, string> = { gave_order: "Gave order", paid: "Paid", enough_stock: "Has enough stock", owner_away: "Owner away", shop_closed: "Shop closed", promised_payment: "Promised to pay", promised_order: "Promised to order", other: "Other" };
      const ps: Record<string, string> = { open: "Waiting", kept: "Kept", broken: "Didn't happen", none: "" };
      return one(rows.map((x: any) => ({ date: new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date(x.created_at)), dealer: x.distributors?.name ?? "", by: x.created_by_name, outcome: ow[x.outcome] ?? x.outcome, promise: x.promise_amount == null ? null : r2(x.promise_amount), status: ps[x.promise_status] ?? x.promise_status, note: x.note })));
    },
    summary: rows => [
      { label: "Visits", value: rows.length, kind: "number" },
      { label: "Promises kept", value: rows.filter(r => r.status === "Kept").length, kind: "number" },
      { label: "Promises broken", value: rows.filter(r => r.status === "Didn't happen").length, kind: "number" },
    ],
  },
  {
    id: "salesperson_targets", group: "Team", title: "Salesperson vs target", capability: "see_money", usesDates: true,
    description: "Monthly sales target for each salesperson against what they actually sold.",
    columns: [
      { key: "month", header: "Month" }, { key: "salesperson", header: "Salesperson", weight: 2 },
      { key: "target", header: "Target", type: "money", total: true }, { key: "actual", header: "Sold", type: "money", total: true },
      { key: "pct", header: "% done", type: "number" },
    ],
    fetch: async p => {
      const mFrom = p.from.slice(0, 7) + "-01";
      const t = await fetchAll((a, b) => db.from("targets").select("entity_id,entity_name,period_start,target_revenue").eq("entity_type", "salesperson").eq("period_type", "monthly").gte("period_start", mFrom).lte("period_start", p.to).order("period_start").range(a, b));
      const last = (k: string) => { const [y, m] = k.split("-").map(Number); return new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10); };
      const ord = t.length ? await liveOrdersRaw({ from: mFrom, to: last(t[t.length - 1].period_start.slice(0, 10)) }) : [];
      const sold = new Map<string, number>();
      ord.forEach((o: any) => { const k = o.salesperson_id + "|" + String(o.date).slice(0, 7); sold.set(k, (sold.get(k) ?? 0) + n(o.total) - n(o.scheme_savings)); });
      return one(t.map((x: any) => {
        const month = String(x.period_start).slice(0, 7); const actual = r2(sold.get(x.entity_id + "|" + month) ?? 0);
        const [y, m] = month.split("-").map(Number);
        return { month: new Date(Date.UTC(y, m - 1, 1)).toLocaleString("en-IN", { month: "short", year: "numeric", timeZone: "UTC" }), salesperson: x.entity_name, target: r2(x.target_revenue), actual, pct: n(x.target_revenue) ? Math.round(actual / n(x.target_revenue) * 100) : 0 };
      }));
    },
    summary: rows => [
      { label: "Target", value: sumBy(rows, "target"), kind: "money" },
      { label: "Sold", value: sumBy(rows, "actual"), kind: "money" },
      { label: "Met target", value: rows.filter(r => n(r.pct) >= 100).length, kind: "number" },
    ],
  },
];

async function liveOrdersRaw(p: ReportParams): Promise<any[]> {
  return fetchAll((a, b) => db.from("orders").select("distributor_id,salesperson_id,date,total,scheme_savings").is("cancelled_at", null).gte("date", p.from).lte("date", p.to).range(a, b));
}
type BillDue = { id: string; dealerId: string; dealer: string; date: string; number: string; total: number; due: number };
/** GST bills with what's still due on each: bill − posted receipts − credit notes (same rule as the app). */
async function billLedger(area?: string, dealerId?: string): Promise<BillDue[]> {
  const [inv, pay, cn, ord, dist] = await Promise.all([
    fetchAll((a, b) => db.from("invoices").select("id,invoice_number,invoice_date,grand_total,status,source_order_id,buyer_name").eq("doc_type", "gst_invoice").neq("status", "draft").range(a, b)),
    fetchAll((a, b) => db.from("invoice_payments").select("invoice_id,amount").eq("status", "posted").not("invoice_id", "is", null).range(a, b)),
    fetchAll((a, b) => db.from("credit_notes").select("invoice_id,grand_total").range(a, b)),
    fetchAll((a, b) => db.from("orders").select("id,distributor_id").range(a, b)),
    fetchAll((a, b) => db.from("distributors").select("id,name,location").range(a, b)),
  ]);
  const add = (m: Map<string, number>, k: string, v: number) => m.set(k, (m.get(k) ?? 0) + v);
  const rec = new Map<string, number>(), cr = new Map<string, number>();
  pay.forEach((x: any) => add(rec, x.invoice_id, n(x.amount)));
  cn.forEach((x: any) => x.invoice_id && add(cr, x.invoice_id, n(x.grand_total)));
  const o2d = new Map(ord.map((o: any) => [o.id, o.distributor_id]));
  const dm = new Map(dist.map((d: any) => [d.id, d]));
  return inv.map((x: any) => {
    const did = o2d.get(x.source_order_id) ?? ""; const d: any = dm.get(did);
    return { id: x.id, dealerId: did, dealer: d?.name ?? x.buyer_name, area: d?.location ?? "", date: x.invoice_date, number: x.invoice_number, total: r2(x.grand_total), due: r2(Math.max(0, n(x.grand_total) - (rec.get(x.id) ?? 0) - (cr.get(x.id) ?? 0))) };
  }).filter(x => (!area || x.area === area) && (!dealerId || x.dealerId === dealerId));
}

type DealerEvent = { dealerId: string; dealer: string; date: string; kind: "bill" | "payment" | "credit"; what: string; ref: string; dr: number; cr: number; order: number };
/** Every bill (+), posted payment (−) and credit note (−) per dealer. Sum = what they owe on bills. */
async function dealerEvents(area?: string, dealerId?: string): Promise<DealerEvent[]> {
  let dq = db.from("distributors").select("id,name,location");
  if (dealerId) dq = dq.eq("id", dealerId); else if (area) dq = dq.eq("location", area);
  const dist = await fetchAll((a, b) => dq.range(a, b));
  const ids = new Set(dist.map((d: any) => d.id)); const name = new Map(dist.map((d: any) => [d.id, d.name]));
  const [bills, pay, cn] = await Promise.all([
    billLedger(area, dealerId),
    fetchAll((a, b) => { let q = db.from("invoice_payments").select("distributor_id,paid_on,amount,mode,reference").eq("status", "posted"); if (dealerId) q = q.eq("distributor_id", dealerId); return q.range(a, b); }),
    fetchAll((a, b) => { let q = db.from("credit_notes").select("distributor_id,note_date,credit_note_number,grand_total"); if (dealerId) q = q.eq("distributor_id", dealerId); return q.range(a, b); }),
  ]);
  const ev: DealerEvent[] = [];
  for (const x of bills) if (ids.has(x.dealerId)) ev.push({ dealerId: x.dealerId, dealer: x.dealer, date: x.date, kind: "bill", what: "Bill", ref: x.number, dr: x.total, cr: 0, order: 0 });
  for (const x of pay as any[]) if (ids.has(x.distributor_id)) ev.push({ dealerId: x.distributor_id, dealer: name.get(x.distributor_id) as string, date: x.paid_on, kind: "payment", what: `Paid (${modeWord[x.mode] ?? x.mode})`, ref: x.reference || "", dr: 0, cr: r2(x.amount), order: 1 });
  for (const x of cn as any[]) if (ids.has(x.distributor_id)) ev.push({ dealerId: x.distributor_id, dealer: name.get(x.distributor_id) as string, date: x.note_date, kind: "credit", what: "Credit note (return)", ref: x.credit_note_number, dr: 0, cr: r2(x.grand_total), order: 2 });
  return ev;
}

const TODAY = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());

async function stockRows(): Promise<ReportRow[]> {
  const rows = await fetchAll((a, b) => db.from("stock_items").select("quantity,threshold,products(name,sku,unit,avg_cost,base_price),godowns(name)").range(a, b));
  return rows.map((x: any) => {
    const cost = n(x.products?.avg_cost) || n(x.products?.base_price);
    return { product: x.products?.name ?? "", code: x.products?.sku ?? "", godown: x.godowns?.name ?? "", qty: n(x.quantity), unit: x.products?.unit ?? "", threshold: n(x.threshold), value: r2(n(x.quantity) * cost), low: n(x.quantity) <= n(x.threshold) ? "Yes" : "No" };
  }).sort((a, b) => String(a.product).localeCompare(String(b.product)));
}

export async function salesBills(p: ReportParams) {
  return fetchAll((a, b) => db.from("invoices").select("id,invoice_number,invoice_date,buyer_name,buyer_gstin,buyer_state_code,place_of_supply_state_code,subtotal,cgst_amount,sgst_amount,igst_amount,round_off,grand_total").eq("doc_type", "gst_invoice").neq("status", "draft").gte("invoice_date", p.from).lte("invoice_date", p.to).order("invoice_date").order("invoice_number").range(a, b)) as Promise<any[]>;
}

export { fetchAll as fetchAllRows };
export const reportById = (id: string) => REPORTS.find(r => r.id === id);
export const GROUPS = ["Sales", "Money", "Stock", "Buying", "GST", "Team"] as const;
