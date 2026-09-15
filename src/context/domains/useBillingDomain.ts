import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Order } from "@/data/mock-data";
import { sanitizeInput } from "@/utils/sanitize";
import type { DomainDeps, Invoice, Claim } from "@/context/data-types";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { handleSupabaseError } from "@/utils/handleSupabaseError";
import { fetchAllChunked } from "@/context/data-utils";

type InvoiceRow = Database["public"]["Tables"]["invoices"]["Row"] & {
  invoice_lines?: Database["public"]["Tables"]["invoice_lines"]["Row"][] | null;
};
type ClaimRow = Database["public"]["Tables"]["claims"]["Row"] & {
  claim_lines?: Database["public"]["Tables"]["claim_lines"]["Row"][] | null;
};

/** Map a Supabase `invoices` row (with joined lines) to the in-app Invoice shape. */
export function mapInvoiceRow(inv: InvoiceRow): Invoice {
  return {
    id: inv.id,
    invoiceNumber: inv.invoice_number,
    invoiceDate: inv.invoice_date,
    docType: inv.doc_type as Invoice["docType"],
    sourceOrderId: inv.source_order_id ?? undefined,
    buyerName: inv.buyer_name,
    buyerAddress: inv.buyer_address,
    buyerGstin: inv.buyer_gstin,
    buyerStateCode: inv.buyer_state_code,
    sellerName: inv.seller_name,
    sellerAddress: inv.seller_address,
    sellerGstin: inv.seller_gstin,
    sellerPan: inv.seller_pan,
    sellerStateCode: inv.seller_state_code,
    sellerPhone: inv.seller_phone,
    sellerEmail: inv.seller_email,
    sellerBankName: inv.seller_bank_name,
    sellerBankAccount: inv.seller_bank_account,
    sellerBankIfsc: inv.seller_bank_ifsc,
    sellerBankAccountName: inv.seller_bank_account_name,
    sellerLogoUrl: inv.seller_logo_url,
    supplyType: inv.supply_type as Invoice["supplyType"],
    gstRate: inv.gst_rate,
    subtotal: inv.subtotal,
    cgstAmount: inv.cgst_amount,
    sgstAmount: inv.sgst_amount,
    igstAmount: inv.igst_amount,
    totalTax: inv.total_tax,
    grandTotal: inv.grand_total,
    roundOff: inv.round_off,
    amountInWords: inv.amount_in_words,
    notes: inv.notes,
    status: inv.status as Invoice["status"],
    vehicle: inv.vehicle || "",
    driverName: inv.driver_name || "",
    createdAt: inv.created_at,
    lines: (inv.invoice_lines || []).map(l => ({
      id: l.id,
      productName: l.product_name,
      hsnCode: l.hsn_code,
      quantity: l.quantity,
      unit: l.unit,
      unitPrice: l.unit_price,
      taxableValue: l.taxable_value,
      gstRate: l.gst_rate,
      lineTotal: l.line_total,
    })),
  } as Invoice;
}

/** Map a Supabase `claims` row (with joined lines) to the in-app Claim shape. */
function mapClaimRow(c: ClaimRow): Claim {
  return {
    id: c.id,
    orderId: c.order_id,
    orderNumber: c.order_number,
    distributorId: c.distributor_id,
    distributorName: c.distributor_name,
    claimType: c.claim_type as Claim["claimType"],
    reason: c.reason,
    status: c.status as Claim["status"],
    totalClaimValue: c.total_claim_value,
    restoreStock: c.restore_stock,
    resolutionNotes: c.resolution_notes,
    resolvedAt: c.resolved_at,
    createdAt: c.created_at,
    lines: (c.claim_lines || []).map(l => ({
      id: l.id,
      productId: l.product_id,
      productName: l.product_name,
      quantity: l.quantity,
      unitPrice: l.unit_price,
      lineTotal: l.line_total,
    })),
  } as Claim;
}

interface BillingDeps extends DomainDeps {
  getOrders: () => Order[];
  safeRefetchStockItems: () => Promise<void>;
}

export function useBillingDomain(deps: BillingDeps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);


  const safeRefetchInvoices = useCallback(async () => {
    if (!deps.companyId || !navigator.onLine) return;
    const data = await fetchAllChunked<InvoiceRow>(() =>
      supabase.from("invoices").select("*, invoice_lines(*)").eq("company_id", deps.companyId).order("created_at", { ascending: false })
    );
    setInvoices(data.map(mapInvoiceRow));
  }, [deps.companyId]);

  /** Refresh one bill in place — realtime uses this instead of reloading every bill. */
  const refetchInvoiceById = useCallback(async (invoiceId: string) => {
    if (!deps.companyId || !navigator.onLine) return;
    const { data, error } = await supabase
      .from("invoices").select("*, invoice_lines(*)")
      .eq("id", invoiceId).eq("company_id", deps.companyId).maybeSingle();
    if (error) return;
    if (!data) { setInvoices(prev => prev.filter(i => i.id !== invoiceId)); return; }
    const mapped = mapInvoiceRow(data as InvoiceRow);
    setInvoices(prev => {
      const idx = prev.findIndex(i => i.id === invoiceId);
      if (idx === -1) return [mapped, ...prev];
      const next = prev.slice();
      next[idx] = mapped;
      return next;
    });
  }, [deps.companyId]);

  const safeRefetchClaims = useCallback(async () => {
    if (!deps.companyId || !navigator.onLine) return;
    const data = await fetchAllChunked<ClaimRow>(() =>
      supabase.from("claims").select("*, claim_lines(*)").eq("company_id", deps.companyId).order("created_at", { ascending: false })
    );
    setClaims(data.map(mapClaimRow));
  }, [deps.companyId]);

  const recordReturn = useCallback(async (
    orderId: string,
    lines: { invoiceLineId: string; goodQty: number; damagedQty: number }[],
    reason: string,
    godownId?: string | null,
  ): Promise<{ creditNoteNumber: string; grandTotal: number; restocked: boolean } | null> => {
    if (!navigator.onLine) {
      toast.error("Cannot record returns offline", { description: "Please reconnect and try again." });
      return null;
    }
    try {
      const { data, error } = await supabase.rpc("record_return_and_credit_atomic", {
        p_order_id: orderId,
        p_lines: lines
          .filter(l => (l.goodQty || 0) + (l.damagedQty || 0) > 0)
          .map(l => ({ invoice_line_id: l.invoiceLineId, good_qty: l.goodQty || 0, damaged_qty: l.damagedQty || 0 })),
        p_reason: sanitizeInput(reason || ""),
        p_godown_id: godownId || null,
      });
      if (error) throw error;
      const res = data as { credit_note_number: string; grand_total: number; restocked: boolean };
      await Promise.all([safeRefetchClaims(), safeRefetchInvoices(), deps.safeRefetchStockItems()]);
      return { creditNoteNumber: res.credit_note_number, grandTotal: Number(res.grand_total), restocked: !!res.restocked };
    } catch (err: any) {
      handleSupabaseError(err, { source: "rpc:record_return_and_credit_atomic", title: "Could not record this return", context: { orderId } });
      return null;
    }
  }, [deps.safeRefetchStockItems]);

  /** Close an open return/claim with a note. Server-side, audited, one-way. */
  const resolveClaim = useCallback(async (claimId: string, notes: string): Promise<boolean> => {
    if (!navigator.onLine) {
      toast.error("Cannot close a return offline", { description: "Please reconnect and try again." });
      return false;
    }
    try {
      const { error } = await supabase.rpc("resolve_claim_atomic", {
        p_claim_id: claimId,
        p_notes: sanitizeInput(notes || ""),
      });
      if (error) throw error;
      await safeRefetchClaims();
      return true;
    } catch (err: any) {
      handleSupabaseError(err, { source: "rpc:resolve_claim_atomic", title: "Could not close this return", context: { claimId } });
      return false;
    }
  }, [safeRefetchClaims]);

  return {
    invoices, setInvoices, claims, setClaims,
    recordReturn, resolveClaim,
    safeRefetchInvoices, safeRefetchClaims, refetchInvoiceById,
  };
}

