import { addDaysToKey } from "@/utils/dateKey";

export interface ActivityRow {
  id: string;
  created_at: string;
  user_name: string;
  entity_type: string;
  entity_id: string;
  action: string;
  summary: string;
  outcome: "ok" | "failed" | "unknown";
  money_direction: "in" | "out" | null;
  amount: number | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  changed_fields: string[];
  metadata: Record<string, any>;
}

export const ACTIVITY_GROUPS: Record<string, { label: string; types: string[] }> = {
  orders: { label: "Orders", types: ["order", "invoice"] },
  money: { label: "Money", types: ["payment", "credit_note", "claim", "supplier_payment"] },
  stock: { label: "Stock", types: ["stock", "product", "warehouse", "stock_item"] },
  buying: { label: "Buying", types: ["purchase_bill", "purchase_return", "supplier", "supplier_payment"] },
  people: { label: "Dealers & visits", types: ["dealer", "distributor", "visit", "prospect", "salesperson", "target"] },
  team: { label: "Team & settings", types: ["team", "company", "scheme"] },
};

export function groupOf(entityType: string): string {
  for (const [k, g] of Object.entries(ACTIVITY_GROUPS)) if (g.types.includes(entityType)) return k;
  return "team";
}

export type Period = "today" | "yesterday" | "week" | "month" | "custom";

/** Inclusive IST date range for a period, given today's IST date key. */
export function periodRange(p: Period, today: string, customFrom: string, customTo: string): { from: string; to: string } {
  switch (p) {
    case "today": return { from: today, to: today };
    case "yesterday": { const y = addDaysToKey(today, -1); return { from: y, to: y }; }
    case "week": return { from: addDaysToKey(today, -6), to: today };
    case "month": return { from: `${today.slice(0, 8)}01`, to: today };
    default: return customFrom <= customTo ? { from: customFrom, to: customTo } : { from: customTo, to: customFrom };
  }
}

const FIELD_LABELS: Record<string, string> = {
  name: "Name", credit_limit: "Credit limit", credit_mode: "Credit rule", base_price: "Price", gst_rate: "GST rate",
  hsn_code: "HSN code", unit: "Unit", sku: "Product code", total: "Order total", delivery_status: "Sending status",
  payment_status: "Payment status", status: "Status", cancelled_at: "Cancelled", cancel_reason: "Cancel reason",
  dispatch_date: "Send date", vehicle: "Vehicle", driver_name: "Driver", dispatch_remarks: "Send note",
  contact: "Phone", location: "Area", address: "Address", gstin: "GSTIN", email: "Email", phone: "Phone",
  is_active: "Active", discount_percent: "Discount %", valid_until: "Valid until", valid_from: "Valid from",
  quantity: "Quantity", threshold: "Low-stock level", target_revenue: "Target sales", target_orders: "Target orders",
  role: "Job", granted: "Allowed", void_reason: "Cancel reason", region: "Region", outcome: "Visit result",
  stage: "Stage", order_prefix: "Order number start", invoice_prefix: "Bill number start", delivered_at: "Delivered",
  scheme_savings: "Offer savings", godown_id: "Godown", payment_mode: "Payment mode",
};
const HIDDEN = new Set(["id", "company_id", "booked_at", "posted_at", "posted_by", "voided_by", "cancelled_by", "idempotency_key"]);

function show(v: unknown): string {
  if (v === null || v === undefined || v === "") return "empty";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}T/.test(v)) return new Date(v).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" });
  if (typeof v === "object") return JSON.stringify(v).slice(0, 80);
  return String(v);
}

/** Before → after pairs in everyday words, for edits only. */
export function describeChanges(r: Pick<ActivityRow, "before" | "after" | "changed_fields">): { field: string; from: string; to: string }[] {
  if (!r.after || !r.changed_fields?.length) return [];
  return r.changed_fields
    .filter(f => !HIDDEN.has(f) && !f.endsWith("_id"))
    .map(f => ({
      field: FIELD_LABELS[f] ?? f.replace(/_/g, " ").replace(/^./, c => c.toUpperCase()),
      from: show(r.before?.[f]),
      to: show(r.after?.[f]),
    }));
}

/** Signed effect on cash: + came in, − went out (a cancelled receipt is −). Null when not a cash entry. */
export function cashImpact(r: Pick<ActivityRow, "money_direction" | "amount">): number | null {
  if (!r.money_direction || r.amount == null) return null;
  const n = Number(r.amount);
  return r.money_direction === "out" ? -n : n;
}

/** Where tapping an entry should go, or null when there's no page for it. */
export function activityLink(r: Pick<ActivityRow, "entity_type" | "entity_id" | "action" | "metadata">): string | null {
  if (r.action === "deleted") return null;
  const z = "00000000-0000-0000-0000-000000000000";
  switch (r.entity_type) {
    case "order": return r.entity_id && r.entity_id !== z ? `/orders/${r.entity_id}` : null;
    case "invoice": return r.metadata?.order_id ? `/orders/${r.metadata.order_id}` : "/billing";
    case "payment": return r.metadata?.order_id ? `/orders/${r.metadata.order_id}` : "/billing";
    case "credit_note": case "claim": return "/claims";
    case "dealer": return `/distributors/${r.entity_id}`;
    case "salesperson": return `/salespersons/${r.entity_id}`;
    case "purchase_bill": return `/buying/bills/${r.entity_id}`;
    case "supplier": return `/buying/suppliers/${r.entity_id}`;
    case "supplier_payment": case "purchase_return": return "/buying";
    case "product": case "stock": case "warehouse": return "/stock";
    case "scheme": return "/schemes";
    case "target": return "/targets";
    case "visit": case "prospect": return "/visits";
    case "team": return "/settings";
    case "company": return "/company";
    default: return null;
  }
}
