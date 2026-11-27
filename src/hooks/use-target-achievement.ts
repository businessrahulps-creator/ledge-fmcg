import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { canonicalStart, type TargetPeriodType } from "@/lib/target-achievement";

/** One row per business / salesperson / dealer. Money fields are null without money access (set by the server). */
export interface AchievementRow {
  entityType: "company" | "salesperson" | "dealer";
  entityId: string | null;
  gross: number | null;
  returnsDeducted: number | null;
  returnsOnEarlierOrders: number | null;
  net: number | null;
  deliveredCount: number;
  fullyReturnedCount: number;
}

const num = (v: unknown) => (v === null || v === undefined ? null : Number(v));

/** Read-only: never writes targets. */
export function useTargetAchievement(periodType: TargetPeriodType, periodStart: string) {
  const start = canonicalStart(periodType, periodStart);
  return useQuery({
    queryKey: ["target-achievement", periodType, start],
    staleTime: 30_000,
    queryFn: async (): Promise<AchievementRow[]> => {
      const { data, error } = await supabase.rpc("target_achievement_summary", { p_period_type: periodType, p_period_start: start });
      if (error) throw error;
      return (data ?? []).map((r) => ({
        entityType: r.entity_type as AchievementRow["entityType"],
        entityId: r.entity_id,
        gross: num(r.gross), returnsDeducted: num(r.returns_deducted), returnsOnEarlierOrders: num(r.returns_on_earlier_orders), net: num(r.net),
        deliveredCount: r.delivered_count ?? 0, fullyReturnedCount: r.fully_returned_count ?? 0,
      }));
    },
  });
}

export function pickRow(rows: AchievementRow[] | undefined, entityType: AchievementRow["entityType"], entityId: string | null): AchievementRow | undefined {
  return rows?.find(r => r.entityType === entityType && (entityType === "company" || r.entityId === entityId));
}
