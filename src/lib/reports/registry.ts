import { supabase } from "@/integrations/supabase/client";
import type { ReportDef, ReportParams, ReportRow, ReportSection } from "./types";
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
    id: "money_to_collect", group: "Money", title: "Money to collect", capability: "see_money", usesDates: false,
    description: "Every dealer who owes you money today, biggest first.",
    columns: [
      { key: "dealer", header: "Dealer", weight: 2 }, { key: "area", header: "Area" }, { key: "phone", header: "Phone" },
      { key: "limit", header: "Credit limit", type: "money" }, { key: "unpaid", header: "Unpaid", type: "money", total: true },
    ],
    fetch: async () => {
      const d = await fetchAll((a, b) => db.from("distributors").select("name,location,contact,credit_limit,outstanding_amount").gt("outstanding_amount", 0).order("outstanding_amount", { ascending: false }).range(a, b));
      return one(d.map((x: any) => ({ dealer: x.name, area: x.location, phone: x.contact, limit: r2(x.credit_limit), unpaid: r2(x.outstanding_amount) })));
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
      const rows = await fetchAll((a, b) => db.from("invoice_payments").select("paid_on,amount,mode,reference,distributors(name)").eq("status", "posted").gte("paid_on", p.from).lte("paid_on", p.to).order("paid_on").range(a, b));
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

  // ───────── Buying
  {
    id: "purchase_bills", group: "Buying", title: "Purchase bills", capability: "see_money", usesDates: true,
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
    id: "supplier_payments", group: "Buying", title: "Supplier payments", capability: "see_money", usesDates: true,
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
    id: "supplier_balances", group: "Buying", title: "Money you owe suppliers", capability: "see_money", usesDates: false,
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
      const lines = await fetchAll((a, b) => db.from("invoice_lines").select("hsn_code,gst_rate,quantity,taxable_value,cgst_amount,sgst_amount,igst_amount,invoices!inner(invoice_date)").gte("invoices.invoice_date", p.from).lte("invoices.invoice_date", p.to).range(a, b));
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
    id: "gst_purchase_register", group: "GST", title: "GST purchase register", capability: "see_money", usesDates: true,
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
];

async function stockRows(): Promise<ReportRow[]> {
  const rows = await fetchAll((a, b) => db.from("stock_items").select("quantity,threshold,products(name,sku,unit,avg_cost,base_price),godowns(name)").range(a, b));
  return rows.map((x: any) => {
    const cost = n(x.products?.avg_cost) || 0;
    return { product: x.products?.name ?? "", code: x.products?.sku ?? "", godown: x.godowns?.name ?? "", qty: n(x.quantity), unit: x.products?.unit ?? "", threshold: n(x.threshold), value: r2(n(x.quantity) * cost), low: n(x.quantity) <= n(x.threshold) ? "Yes" : "No" };
  }).sort((a, b) => String(a.product).localeCompare(String(b.product)));
}

export async function salesBills(p: ReportParams) {
  return fetchAll((a, b) => db.from("invoices").select("id,invoice_number,invoice_date,buyer_name,buyer_gstin,buyer_state_code,place_of_supply_state_code,subtotal,cgst_amount,sgst_amount,igst_amount,round_off,grand_total").eq("doc_type", "gst_invoice").gte("invoice_date", p.from).lte("invoice_date", p.to).order("invoice_date").order("invoice_number").range(a, b)) as Promise<any[]>;
}

export { fetchAll as fetchAllRows };
export const reportById = (id: string) => REPORTS.find(r => r.id === id);
export const GROUPS = ["Sales", "Money", "Stock", "Buying", "GST", "Team"] as const;
