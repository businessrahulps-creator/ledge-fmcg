import { supabase } from "@/integrations/supabase/client";
import type { Invoice, InvoiceLine } from "@/context/data-types";

/**
 * Bill line items are NOT loaded with the app-wide invoice list — a distributor
 * with thousands of bills would pay for every line on every sign-in. Lines are
 * only needed when a single bill is opened (PDF, WhatsApp summary, return form),
 * so they are fetched on demand here and cached for the session.
 */
const cache = new Map<string, InvoiceLine[]>();

export async function fetchInvoiceLines(invoiceId: string): Promise<InvoiceLine[]> {
  const hit = cache.get(invoiceId);
  if (hit) return hit;
  const { data, error } = await supabase
    .from("invoice_lines")
    .select("*")
    .eq("invoice_id", invoiceId)
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  const lines: InvoiceLine[] = data.map((l: any) => ({
    id: l.id,
    productName: l.product_name || "",
    hsnCode: l.hsn_code || "",
    quantity: l.quantity || 0,
    unit: l.unit || "Pack",
    unitPrice: Number(l.unit_price || 0),
    taxableValue: Number(l.taxable_value || 0),
    gstRate: l.gst_rate != null ? Number(l.gst_rate) : null,
    lineTotal: l.line_total != null ? Number(l.line_total) : null,
  }));
  cache.set(invoiceId, lines);
  return lines;
}

/** Same bill, guaranteed to carry its line items. */
export async function withInvoiceLines(inv: Invoice): Promise<Invoice> {
  if (inv.lines && inv.lines.length > 0) return inv;
  return { ...inv, lines: await fetchInvoiceLines(inv.id) };
}

/** Drop a bill from the line cache — used after a credit note changes it. */
export function forgetInvoiceLines(invoiceId: string): void {
  cache.delete(invoiceId);
}
