// src/lib/rpc.ts
// Single source of truth for Supabase RPC names. Import RPC.* instead of
// passing bare strings to supabase.rpc(...).
export const RPC = {
  SETUP_NEW_COMPANY: "setup_new_company",
  INSERT_ORDER_ATOMIC: "insert_order_atomic",
  DISPATCH_ORDER_ATOMIC: "dispatch_order_atomic",
  REVERSE_DISPATCH_FOR_ORDER: "reverse_dispatch_for_order",
  PREVIEW_DISPATCH_IMPACT: "preview_dispatch_impact",
  GET_NEXT_ORDER_NUMBER: "get_next_order_number",
  GET_NEXT_INVOICE_NUMBER: "get_next_invoice_number",
} as const;

export type RpcName = (typeof RPC)[keyof typeof RPC];
