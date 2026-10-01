import { supabase } from "@/integrations/supabase/client";
import { fetchAllRows } from "./registry";
import type { ReportParams } from "./types";
import { DEFAULT_LEDGERS, STATE_BY_CODE, type ItemMaster, type MoneyDoc, type PartyMaster, type TallyInput, type TallyLedgers, type TaxDoc } from "./tally";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;
const n = (v: unknown) => Number(v) || 0;

export interface TallyChoice {
  sales: boolean; creditNotes: boolean; receipts: boolean; purchases: boolean; supplierPayments: boolean; masters: boolean;
  onlyNew: boolean;
}

export async function loadLedgers(companyId: string): Promise<TallyLedgers> {
  const { data } = await db.from("tally_settings").select("ledgers").eq("company_id", companyId).maybeSingle();
  return { ...DEFAULT_LEDGERS, ...(data?.ledgers ?? {}) };
}

export async function saveLedgers(companyId: string, userId: string, ledgers: TallyLedgers) {
  const { error } = await db.from("tally_settings").upsert({ company_id: companyId, ledgers, updated_by: userId, updated_at: new Date().toISOString() });
  if (error) throw error;
}

async function alreadySent(): Promise<Set<string>> {
  const rows = await fetchAllRows((a, b) => db.from("export_log").select("document_ids").eq("report_id", "tally").range(a, b));
  return new Set(rows.flatMap((r: any) => r.document_ids ?? []));
}

function byRateFromLines(lines: any[], key: string, taxableKey = "taxable_value") {
  const m = new Map<string, Map<number, number>>();
  for (const l of lines) {
    const id = l[key]; const r = n(l.gst_rate);
    const g = m.get(id) ?? new Map<number, number>();
    g.set(r, (g.get(r) ?? 0) + n(l[taxableKey]));
    m.set(id, g);
  }
  return (id: string, fallbackRate: number, fallbackTaxable: number) => {
    const g = m.get(id);
    if (!g || g.size === 0) return [{ rate: fallbackRate, taxable: fallbackTaxable }];
    return [...g.entries()].map(([rate, taxable]) => ({ rate, taxable: Math.round(taxable * 100) / 100 }));
  };
}

const impliedRate = (x: any) => { const t = n(x.subtotal); return t > 0 ? Math.round(((n(x.cgst_amount) + n(x.sgst_amount)) || n(x.igst_amount)) / t * 100) : 0; };

export interface TallyBundle { input: TallyInput; ids: string[]; counts: Record<string, number> }

export async function loadTallyBundle(p: ReportParams, choice: TallyChoice, companyName: string, ledgers: TallyLedgers): Promise<TallyBundle> {
  const sent = choice.onlyNew ? await alreadySent() : new Set<string>();
  const fresh = <T extends { id: string }>(xs: T[]) => xs.filter(x => !sent.has(x.id));
  const input: TallyInput = { companyName, ledgers };

  if (choice.sales) {
    const inv = await fetchAllRows((a, b) => db.from("invoices").select("id,invoice_number,invoice_date,buyer_name,subtotal,cgst_amount,sgst_amount,igst_amount,round_off,grand_total,gst_rate").eq("doc_type", "gst_invoice").neq("status", "draft").gte("invoice_date", p.from).lte("invoice_date", p.to).order("invoice_date").range(a, b));
    const lines = await fetchAllRows((a, b) => db.from("invoice_lines").select("invoice_id,gst_rate,taxable_value,invoices!inner(invoice_date,doc_type,status)").eq("invoices.doc_type", "gst_invoice").neq("invoices.status", "draft").gte("invoices.invoice_date", p.from).lte("invoices.invoice_date", p.to).range(a, b));
    const rates = byRateFromLines(lines, "invoice_id");
    input.sales = fresh(inv.map((x: any): TaxDoc => ({ id: x.id, number: x.invoice_number, date: x.invoice_date, party: x.buyer_name, byRate: rates(x.id, n(x.gst_rate), n(x.subtotal)), cgst: n(x.cgst_amount), sgst: n(x.sgst_amount), igst: n(x.igst_amount), roundOff: n(x.round_off), total: n(x.grand_total) })));
  }
  if (choice.creditNotes) {
    const cn = await fetchAllRows((a, b) => db.from("credit_notes").select("id,credit_note_number,note_date,reason,subtotal,cgst_amount,sgst_amount,igst_amount,round_off,grand_total,distributors(name)").gte("note_date", p.from).lte("note_date", p.to).order("note_date").range(a, b));
    const lines = await fetchAllRows((a, b) => db.from("credit_note_lines").select("credit_note_id,gst_rate,taxable_value,credit_notes!inner(note_date)").gte("credit_notes.note_date", p.from).lte("credit_notes.note_date", p.to).range(a, b));
    const rates = byRateFromLines(lines, "credit_note_id");
    input.creditNotes = fresh(cn.map((x: any): TaxDoc => ({ id: x.id, number: x.credit_note_number, date: x.note_date, party: x.distributors?.name ?? "", byRate: rates(x.id, impliedRate(x), n(x.subtotal)), cgst: n(x.cgst_amount), sgst: n(x.sgst_amount), igst: n(x.igst_amount), roundOff: n(x.round_off), total: n(x.grand_total), narration: x.reason })));
  }
  if (choice.receipts) {
    const r = await fetchAllRows((a, b) => db.from("invoice_payments").select("id,paid_on,amount,mode,reference,distributors(name)").eq("status", "posted").gte("paid_on", p.from).lte("paid_on", p.to).order("paid_on").range(a, b));
    input.receipts = fresh(r.map((x: any): MoneyDoc => ({ id: x.id, date: x.paid_on, party: x.distributors?.name ?? "", amount: n(x.amount), mode: x.mode, reference: x.reference })));
  }
  if (choice.purchases) {
    const pb = await fetchAllRows((a, b) => db.from("purchase_bills").select("id,supplier_bill_no,bill_date,supplier_name,subtotal,cgst_amount,sgst_amount,igst_amount,grand_total,notes").neq("status", "cancelled").gte("bill_date", p.from).lte("bill_date", p.to).order("bill_date").range(a, b));
    const lines = await fetchAllRows((a, b) => db.from("purchase_bill_lines").select("bill_id,gst_rate,taxable_value,purchase_bills!inner(bill_date)").gte("purchase_bills.bill_date", p.from).lte("purchase_bills.bill_date", p.to).range(a, b));
    const rates = byRateFromLines(lines, "bill_id");
    input.purchases = fresh(pb.map((x: any): TaxDoc => ({ id: x.id, number: x.supplier_bill_no, date: x.bill_date, party: x.supplier_name, byRate: rates(x.id, impliedRate(x), n(x.subtotal)), cgst: n(x.cgst_amount), sgst: n(x.sgst_amount), igst: n(x.igst_amount), roundOff: 0, total: n(x.grand_total), narration: x.notes })));
  }
  if (choice.supplierPayments) {
    const sp = await fetchAllRows((a, b) => db.from("supplier_payments").select("id,paid_on,amount,mode,reference,suppliers(name)").eq("status", "posted").gte("paid_on", p.from).lte("paid_on", p.to).order("paid_on").range(a, b));
    input.supplierPayments = fresh(sp.map((x: any): MoneyDoc => ({ id: x.id, date: x.paid_on, party: x.suppliers?.name ?? "", amount: n(x.amount), mode: x.mode, reference: x.reference })));
  }
  if (choice.masters) {
    const [d, s, pr] = await Promise.all([
      fetchAllRows((a, b) => db.from("distributors").select("name,gstin,state_code,address").order("name").range(a, b)),
      fetchAllRows((a, b) => db.from("suppliers").select("name,gstin,state_code,address").order("name").range(a, b)),
      fetchAllRows((a, b) => db.from("products").select("name,unit,hsn_code,gst_rate").order("name").range(a, b)),
    ]);
    const party = (kind: "dealer" | "supplier") => (x: any): PartyMaster => ({ name: x.name, kind, gstin: x.gstin || undefined, stateName: STATE_BY_CODE[x.state_code || (x.gstin || "").slice(0, 2)] || undefined, address: x.address || undefined });
    input.parties = [...d.map(party("dealer")), ...s.map(party("supplier"))];
    input.items = pr.map((x: any): ItemMaster => ({ name: x.name, unit: x.unit, hsn: x.hsn_code || undefined, gstRate: x.gst_rate == null ? null : n(x.gst_rate) }));
  }

  const docs = [...(input.sales ?? []), ...(input.creditNotes ?? []), ...(input.receipts ?? []), ...(input.purchases ?? []), ...(input.supplierPayments ?? [])];
  return {
    input,
    ids: docs.map(x => x.id),
    counts: {
      "Sales bills": input.sales?.length ?? 0, "Credit notes": input.creditNotes?.length ?? 0, "Payments received": input.receipts?.length ?? 0,
      "Purchase bills": input.purchases?.length ?? 0, "Supplier payments": input.supplierPayments?.length ?? 0,
      "Parties": input.parties?.length ?? 0, "Items": input.items?.length ?? 0,
    },
  };
}

export async function logExport(row: { company_id: string; user_name: string; report_id: string; format: string; params: object; row_count: number; document_ids?: string[] }) {
  const { error } = await db.from("export_log").insert({ ...row, document_ids: row.document_ids ?? [] });
  if (error) console.warn("export log", error.message);
}

export async function recentTallyExports() {
  const { data } = await db.from("export_log").select("created_at,user_name,format,row_count,params").eq("report_id", "tally").order("created_at", { ascending: false }).limit(5);
  return (data ?? []) as { created_at: string; user_name: string; format: string; row_count: number; params: any }[];
}
