import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Order } from "@/data/mock-data";
import { sanitizeInput } from "@/utils/sanitize";
import type { DomainDeps, Invoice, Claim } from "@/context/data-types";
import { toast } from "sonner";
import { enqueueMutation } from "@/lib/offline-store";
import { logError } from "@/utils/errorLog";
import { handleSupabaseError } from "@/utils/handleSupabaseError";

interface BillingDeps extends DomainDeps {
  getOrders: () => Order[];
  safeRefetchStockItems: () => Promise<void>;
}

export function useBillingDomain(deps: BillingDeps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);

  const addInvoice = useCallback(async (invoice: Omit<Invoice, "id" | "invoiceNumber" | "createdAt">): Promise<Invoice | null> => {
    if (!deps.companyId) return null;

    // Block offline — invoice numbers require server-side sequence
    if (!navigator.onLine) {
      toast.error("Cannot create documents offline", { description: "Invoice numbering requires a server connection." });
      return null;
    }

    try {
      const { data: seqData, error: seqErr } = await supabase.rpc("get_next_invoice_number", { target_company_id: deps.companyId });
      if (seqErr) throw seqErr;
      const seq = Array.isArray(seqData) ? seqData[0] : seqData;
      const invoiceNumber = `${seq.prefix}-${new Date().getFullYear()}-${String(seq.seq).padStart(4, "0")}`;

      const { data, error } = await supabase.from("invoices" as any).insert({
        company_id: deps.companyId, doc_type: invoice.docType, invoice_number: invoiceNumber,
        invoice_date: invoice.invoiceDate, source_order_id: invoice.sourceOrderId || null,
        buyer_name: sanitizeInput(invoice.buyerName), buyer_address: sanitizeInput(invoice.buyerAddress),
        buyer_gstin: sanitizeInput(invoice.buyerGstin), buyer_state_code: sanitizeInput(invoice.buyerStateCode),
        seller_name: sanitizeInput(invoice.sellerName), seller_address: sanitizeInput(invoice.sellerAddress),
        seller_gstin: sanitizeInput(invoice.sellerGstin), seller_pan: sanitizeInput(invoice.sellerPan),
        seller_state_code: sanitizeInput(invoice.sellerStateCode), seller_phone: sanitizeInput(invoice.sellerPhone),
        seller_email: sanitizeInput(invoice.sellerEmail), seller_bank_name: sanitizeInput(invoice.sellerBankName),
        seller_bank_account_name: sanitizeInput(invoice.sellerBankAccountName),
        seller_bank_account: sanitizeInput(invoice.sellerBankAccount),
        seller_bank_ifsc: sanitizeInput(invoice.sellerBankIfsc), seller_logo_url: invoice.sellerLogoUrl || "",
        supply_type: invoice.supplyType, gst_rate: invoice.gstRate, subtotal: invoice.subtotal,
        cgst_amount: invoice.cgstAmount, sgst_amount: invoice.sgstAmount, igst_amount: invoice.igstAmount,
        total_tax: invoice.totalTax, grand_total: invoice.grandTotal, round_off: invoice.roundOff,
        amount_in_words: invoice.amountInWords, notes: sanitizeInput(invoice.notes), status: invoice.status,
        vehicle: invoice.vehicle || "", driver_name: invoice.driverName || "",
      }).select().single();
      if (error) throw error;
      const invId = (data as any).id;

      if (invoice.lines.length > 0) {
        const { error: lErr } = await supabase.from("invoice_lines" as any).insert(
          invoice.lines.map(l => ({
            invoice_id: invId, product_name: sanitizeInput(l.productName), hsn_code: sanitizeInput(l.hsnCode),
            quantity: l.quantity, unit: l.unit, unit_price: l.unitPrice, taxable_value: l.taxableValue,
          }))
        );
        if (lErr) throw lErr;
      }

      const newInvoice: Invoice = { ...invoice, id: invId, invoiceNumber, createdAt: new Date().toISOString() };
      setInvoices(prev => [newInvoice, ...prev]);
      return newInvoice;
    } catch (err: any) {
      handleSupabaseError(err, { source: "crud:invoices.add", title: "Failed to create document", context: { docType: invoice.docType } });
      return null;
    }
  }, [deps.companyId]);

  const updateInvoice = useCallback(async (id: string, updates: Partial<Invoice>) => {
    const dbUpdates: Record<string, any> = {};
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.notes !== undefined) dbUpdates.notes = sanitizeInput(updates.notes);
    if (updates.vehicle !== undefined) dbUpdates.vehicle = updates.vehicle;
    if (updates.driverName !== undefined) dbUpdates.driver_name = updates.driverName;

    if (!navigator.onLine) {
      setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, ...updates } : inv));
      await enqueueMutation({ type: "update", table: "invoices", payload: { id, ...dbUpdates } });
      toast("Saved offline — will sync when back online", { duration: 3000 });
      return;
    }

    const { error } = await supabase.from("invoices" as any).update(dbUpdates).eq("id", id);
    if (error) { handleSupabaseError(error, { source: "crud:invoices.update", title: "Failed to update document", context: { id } }); return; }
    setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, ...updates } : inv));
  }, []);

  const deleteInvoice = useCallback(async (id: string): Promise<boolean> => {
    const inv = invoices.find(i => i.id === id);
    if (inv?.status === "final") { toast.error("Cannot delete finalized document"); return false; }

    // Block offline — deleting financial documents should only happen with server confirmation
    if (!navigator.onLine) {
      toast.error("Cannot delete documents offline", { description: "Please reconnect to delete." });
      return false;
    }

    const { error } = await supabase.from("invoices" as any).delete().eq("id", id);
    if (error) { handleSupabaseError(error, { source: "crud:invoices.delete", title: "Failed to delete document", context: { id } }); return false; }
    setInvoices(prev => prev.filter(i => i.id !== id));
    return true;
  }, [invoices]);

  const addClaim = useCallback(async (claim: Claim): Promise<boolean> => {
    if (!deps.companyId) return false;

    // Block offline — claims involve stock restoration which needs server state
    if (!navigator.onLine) {
      toast.error("Cannot record claims offline", { description: "Stock restoration requires a server connection." });
      return false;
    }

    try {
      const { data, error } = await supabase.from("claims" as any).insert({
        company_id: deps.companyId, order_id: claim.orderId, order_number: claim.orderNumber,
        distributor_id: claim.distributorId, distributor_name: sanitizeInput(claim.distributorName),
        claim_type: claim.claimType, status: "open", reason: sanitizeInput(claim.reason),
        restore_stock: claim.restoreStock, total_claim_value: claim.totalClaimValue,
      }).select().single();
      if (error) throw error;
      const claimId = (data as any).id;

      if (claim.lines.length > 0) {
        const { error: linesErr } = await supabase.from("claim_lines" as any).insert(
          claim.lines.map(l => ({
            claim_id: claimId, product_id: l.productId, product_name: sanitizeInput(l.productName),
            quantity: l.quantity, unit_price: l.unitPrice, line_total: l.lineTotal,
          }))
        );
        if (linesErr) throw linesErr;
      }

      if (claim.restoreStock) {
        const order = deps.getOrders().find(o => o.id === claim.orderId);
        const godownId = order?.godownId;
        if (godownId) {
          for (const line of claim.lines) {
            const { data: siData } = await supabase.from("stock_items").select("*")
              .eq("company_id", deps.companyId).eq("product_id", line.productId).eq("godown_id", godownId).single();
            if (siData) {
              await supabase.from("stock_items").update({ quantity: siData.quantity + line.quantity } as any).eq("id", siData.id);
            }
          }
          await deps.safeRefetchStockItems();
        }
      }

      const newClaim: Claim = { ...claim, id: claimId, status: "open", createdAt: new Date().toISOString(), resolvedAt: null };
      setClaims(prev => [newClaim, ...prev]);
      return true;
    } catch (err: any) {
      handleSupabaseError(err, { source: "crud:claims.add", title: "Failed to record claim", context: { orderId: claim.orderId } });
      return false;
    }
  }, [deps.companyId, deps.getOrders, deps.safeRefetchStockItems]);

  const updateClaim = useCallback(async (id: string, updates: Partial<Claim>) => {
    const dbUpdates: Record<string, any> = {};
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.resolutionNotes !== undefined) dbUpdates.resolution_notes = sanitizeInput(updates.resolutionNotes);
    if (updates.status === "resolved") dbUpdates.resolved_at = new Date().toISOString();

    if (!navigator.onLine) {
      setClaims(prev => prev.map(c => c.id === id ? { ...c, ...updates, resolvedAt: updates.status === "resolved" ? new Date().toISOString() : c.resolvedAt } : c));
      await enqueueMutation({ type: "update", table: "claims", payload: { id, ...dbUpdates } });
      toast("Saved offline — will sync when back online", { duration: 3000 });
      return;
    }

    const { error } = await supabase.from("claims" as any).update(dbUpdates).eq("id", id);
    if (error) { handleSupabaseError(error, { source: "crud:claims.update", title: "Failed to update claim", context: { id } }); return; }
    setClaims(prev => prev.map(c => c.id === id ? { ...c, ...updates, resolvedAt: updates.status === "resolved" ? new Date().toISOString() : c.resolvedAt } : c));
  }, []);

  const safeRefetchInvoices = useCallback(async () => {
    if (!deps.companyId || !navigator.onLine) return;
    const { data } = await supabase.from("invoices").select("*, invoice_lines(*)").eq("company_id", deps.companyId).order("created_at", { ascending: false });
    if (data) setInvoices((data as any[]).map((inv: any) => ({ id: inv.id, invoiceNumber: inv.invoice_number, invoiceDate: inv.invoice_date, docType: inv.doc_type, sourceOrderId: inv.source_order_id, buyerName: inv.buyer_name, buyerAddress: inv.buyer_address, buyerGstin: inv.buyer_gstin, buyerStateCode: inv.buyer_state_code, sellerName: inv.seller_name, sellerAddress: inv.seller_address, sellerGstin: inv.seller_gstin, sellerPan: inv.seller_pan, sellerStateCode: inv.seller_state_code, sellerPhone: inv.seller_phone, sellerEmail: inv.seller_email, sellerBankName: inv.seller_bank_name, sellerBankAccount: inv.seller_bank_account, sellerBankIfsc: inv.seller_bank_ifsc, sellerBankAccountName: inv.seller_bank_account_name, sellerLogoUrl: inv.seller_logo_url, supplyType: inv.supply_type, gstRate: inv.gst_rate, subtotal: inv.subtotal, cgstAmount: inv.cgst_amount, sgstAmount: inv.sgst_amount, igstAmount: inv.igst_amount, totalTax: inv.total_tax, grandTotal: inv.grand_total, roundOff: inv.round_off, amountInWords: inv.amount_in_words, notes: inv.notes, status: inv.status, vehicle: inv.vehicle || "", driverName: inv.driver_name || "", createdAt: inv.created_at, lines: (inv.invoice_lines || []).map((l: any) => ({ id: l.id, productName: l.product_name, hsnCode: l.hsn_code, quantity: l.quantity, unit: l.unit, unitPrice: l.unit_price, taxableValue: l.taxable_value })) })));
  }, [deps.companyId]);

  const safeRefetchClaims = useCallback(async () => {
    if (!deps.companyId || !navigator.onLine) return;
    const { data } = await supabase.from("claims" as any).select("*, claim_lines(*)").eq("company_id", deps.companyId).order("created_at", { ascending: false });
    if (data) setClaims((data as any[]).map((c: any) => ({ id: c.id, orderId: c.order_id, orderNumber: c.order_number, distributorId: c.distributor_id, distributorName: c.distributor_name, claimType: c.claim_type, reason: c.reason, status: c.status, totalClaimValue: c.total_claim_value, restoreStock: c.restore_stock, resolutionNotes: c.resolution_notes, resolvedAt: c.resolved_at, createdAt: c.created_at, lines: (c.claim_lines || []).map((l: any) => ({ id: l.id, productId: l.product_id, productName: l.product_name, quantity: l.quantity, unitPrice: l.unit_price, lineTotal: l.line_total })) })));
  }, [deps.companyId]);

  return {
    invoices, setInvoices, claims, setClaims,
    addInvoice, updateInvoice, deleteInvoice, addClaim, updateClaim,
    safeRefetchInvoices, safeRefetchClaims,
  };
}
