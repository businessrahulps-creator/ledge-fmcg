import { supabase } from "@/integrations/supabase/client";
import { logError } from "@/utils/errorLog";

interface LogActivityParams {
  companyId: string;
  userId: string;
  userName: string;
  entityType: string;
  entityId: string;
  action: string;
  summary: string;
  metadata?: Record<string, any>;
}

/**
 * Successful changes are now recorded by the database itself, in the same
 * step as the change (see tg_audit_row). Kept as a no-op so existing callers
 * don't double-log and can't forge history.
 */
export async function logActivity(_params: LogActivityParams) {
  return;
}

/** Saves that can be refused — mapped from the error source to a plain label. */
const TRACKED: { match: string; entity: string; action: string; label: string }[] = [
  { match: "book_order_atomic", entity: "order", action: "create", label: "Order not saved" },
  { match: "dispatch_and_bill_order_atomic", entity: "order", action: "dispatch", label: "Order not sent" },
  { match: "cancel_order_atomic", entity: "order", action: "cancel", label: "Order not cancelled" },
  { match: "mark_order_delivered_atomic", entity: "order", action: "deliver", label: "Order not marked delivered" },
  { match: "record_invoice_payment_atomic", entity: "payment", action: "create", label: "Payment not saved" },
  { match: "record_order_payment_atomic", entity: "payment", action: "create", label: "Advance payment not saved" },
  { match: "void_invoice_payment_atomic", entity: "payment", action: "cancel", label: "Payment not cancelled" },
  { match: "record_return_and_credit_atomic", entity: "claim", action: "create", label: "Return not saved" },
  { match: "record_purchase_bill_atomic", entity: "purchase_bill", action: "create", label: "Purchase bill not saved" },
  { match: "record_supplier_payment_atomic", entity: "supplier_payment", action: "create", label: "Supplier payment not saved" },
];

export function trackedFailure(source: string) {
  return TRACKED.find(t => source.includes(t.match)) ?? null;
}

/** Network drops may still have saved on the server — call those "unknown", not "failed". */
export function isUncertain(error: unknown): boolean {
  const msg = String((error as any)?.message || "").toLowerCase();
  return (typeof navigator !== "undefined" && !navigator.onLine)
    || msg.includes("failed to fetch") || msg.includes("networkerror") || msg.includes("timeout") || msg.includes("abort");
}

/** Best-effort: record a refused save in the business's activity history. */
export function logFailedAttempt(source: string, error: unknown, reason: string, context?: Record<string, any>) {
  const t = trackedFailure(source);
  if (!t) return;
  const entityId = typeof context?.orderId === "string" ? context.orderId
    : typeof context?.invoiceId === "string" ? context.invoiceId : null;
  void Promise.resolve((supabase.rpc as any)("log_failed_attempt", {
    p_entity_type: t.entity,
    p_action: t.action,
    p_summary: t.label,
    p_outcome: isUncertain(error) ? "unknown" : "failed",
    p_reason: reason.slice(0, 300),
    p_entity_id: entityId,
    p_amount: null,
  })).then(({ error: e }: { error: unknown }) => {
    if (e) logError({ source: "audit:log_failed_attempt", error: e, severity: "warning" });
  });
}

/** Format ₹ amount for summaries */
export function fmtAmount(n: number): string {
  return `₹${n.toLocaleString("en-IN")}`;
}
