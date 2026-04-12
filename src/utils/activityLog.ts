import { supabase } from "@/integrations/supabase/client";

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
 * Append an entry to the activity_log table.
 * Fire-and-forget — errors are logged but never block the caller.
 */
export async function logActivity(params: LogActivityParams) {
  try {
    await supabase.from("activity_log" as any).insert({
      company_id: params.companyId,
      user_id: params.userId,
      user_name: params.userName,
      entity_type: params.entityType,
      entity_id: params.entityId,
      action: params.action,
      summary: params.summary,
      metadata: params.metadata || {},
    });
  } catch (err) {
    console.warn("Activity log insert failed:", err);
  }
}

/** Format ₹ amount for summaries */
export function fmtAmount(n: number): string {
  return `₹${n.toLocaleString("en-IN")}`;
}
