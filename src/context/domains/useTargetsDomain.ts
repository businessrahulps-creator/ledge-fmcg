import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { sanitizeInput } from "@/utils/sanitize";
import type { DomainDeps, SecondarySale, Target } from "@/context/data-types";
import type { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { enqueueMutation } from "@/lib/offline-store";
import { handleSupabaseError } from "@/utils/handleSupabaseError";
import { fetchAllChunked } from "@/context/data-utils";

type TargetRow = Tables<"targets">;
type SecondarySaleRow = Tables<"secondary_sales">;

export function useTargetsDomain(deps: DomainDeps) {
  const [targets, setTargets] = useState<Target[]>([]);
  const [secondarySales, setSecondarySales] = useState<SecondarySale[]>([]);

  const addTarget = useCallback(async (target: Target) => {
    if (!deps.companyId) return;

    const dbRow = {
      company_id: deps.companyId, entity_type: target.entityType, entity_id: target.entityId,
      entity_name: sanitizeInput(target.entityName), period_type: target.periodType,
      period_start: target.periodStart, target_revenue: target.targetRevenue, target_orders: target.targetOrders,
    };

    if (!navigator.onLine) {
      const tempId = crypto.randomUUID();
      const mapped: Target = { ...target, id: tempId };
      setTargets(prev => [mapped, ...prev]);
      await enqueueMutation({ type: "insert", table: "targets", clientTempId: tempId, payload: dbRow });
      toast("Saved offline — will sync when back online", { duration: 3000 });
      return;
    }

    const { data, error } = await supabase.from("targets").insert(dbRow).select().single();
    if (error) { handleSupabaseError(error, { source: "crud:targets.add", title: "Failed to save target" }); return; }
    if (data) {
      const mapped: Target = {
        id: data.id, entityType: target.entityType, entityId: target.entityId,
        entityName: target.entityName, periodType: target.periodType, periodStart: target.periodStart,
        targetRevenue: target.targetRevenue, targetOrders: target.targetOrders,
      };
      setTargets(prev => [mapped, ...prev]);
    }
  }, [deps.companyId]);

  const updateTarget = useCallback(async (target: Target) => {
    const dbUpdates = {
      target_revenue: target.targetRevenue, target_orders: target.targetOrders,
      entity_name: sanitizeInput(target.entityName),
    };

    if (!navigator.onLine) {
      setTargets(prev => prev.map(t => t.id === target.id ? target : t));
      await enqueueMutation({ type: "update", table: "targets", payload: { id: target.id, ...dbUpdates } });
      toast("Saved offline — will sync when back online", { duration: 3000 });
      return;
    }

    const { error } = await supabase.from("targets").update(dbUpdates).eq("id", target.id);
    if (error) { handleSupabaseError(error, { source: "crud:targets.update", title: "Failed to update target", context: { id: target.id } }); return; }
    setTargets(prev => prev.map(t => t.id === target.id ? target : t));
  }, []);

  const deleteTarget = useCallback(async (id: string): Promise<boolean> => {
    if (!navigator.onLine) {
      setTargets(prev => prev.filter(t => t.id !== id));
      await enqueueMutation({ type: "delete", table: "targets", payload: { id } });
      toast("Saved offline — will sync when back online", { duration: 3000 });
      return true;
    }

    const { error } = await supabase.from("targets").delete().eq("id", id);
    if (error) { handleSupabaseError(error, { source: "crud:targets.delete", title: "Failed to delete target", context: { id } }); return false; }
    setTargets(prev => prev.filter(t => t.id !== id));
    return true;
  }, []);

  const addSecondarySale = useCallback(async (sale: SecondarySale) => {
    if (!deps.companyId) return;

    const dbRow = {
      company_id: deps.companyId, distributor_id: sale.distributorId, product_id: sale.productId,
      product_name: sanitizeInput(sale.productName), retailer_name: sanitizeInput(sale.retailerName),
      quantity: sale.quantity, date: sale.date, remarks: sanitizeInput(sale.remarks),
    };

    if (!navigator.onLine) {
      const tempId = crypto.randomUUID();
      const mapped: SecondarySale = { ...sale, id: tempId };
      setSecondarySales(prev => [mapped, ...prev]);
      await enqueueMutation({ type: "insert", table: "secondary_sales", clientTempId: tempId, payload: dbRow });
      toast("Saved offline — will sync when back online", { duration: 3000 });
      return;
    }

    const { data, error } = await supabase.from("secondary_sales").insert(dbRow).select().single();
    if (error) { handleSupabaseError(error, { source: "crud:secondary_sales.add", title: "Failed to record secondary sale" }); return; }
    if (data) {
      const mapped: SecondarySale = {
        id: data.id, distributorId: sale.distributorId, productId: sale.productId,
        productName: sale.productName, retailerName: sale.retailerName,
        quantity: sale.quantity, date: sale.date, remarks: sale.remarks,
      };
      setSecondarySales(prev => [mapped, ...prev]);
    }
  }, [deps.companyId]);

  const deleteSecondarySale = useCallback(async (id: string): Promise<boolean> => {
    if (!navigator.onLine) {
      setSecondarySales(prev => prev.filter(s => s.id !== id));
      await enqueueMutation({ type: "delete", table: "secondary_sales", payload: { id } });
      toast("Saved offline — will sync when back online", { duration: 3000 });
      return true;
    }

    const { error } = await supabase.from("secondary_sales").delete().eq("id", id);
    if (error) { handleSupabaseError(error, { source: "crud:secondary_sales.delete", title: "Failed to delete secondary sale", context: { id } }); return false; }
    setSecondarySales(prev => prev.filter(s => s.id !== id));
    return true;
  }, []);

  const safeRefetchTargets = useCallback(async () => {
    if (!deps.companyId || !navigator.onLine) return;
    const data = await fetchAllChunked<TargetRow>(
      () => supabase.from("targets").select("*").eq("company_id", deps.companyId).order("created_at", { ascending: false }),
      1000, 200, "targets",
    );
    setTargets(data.map((t) => ({ id: t.id, entityType: t.entity_type, entityId: t.entity_id, entityName: t.entity_name, periodType: t.period_type, periodStart: t.period_start, targetRevenue: Number(t.target_revenue), targetOrders: t.target_orders })));
  }, [deps.companyId]);

  const safeRefetchSecondarySales = useCallback(async () => {
    if (!deps.companyId || !navigator.onLine) return;
    const data = await fetchAllChunked<SecondarySaleRow>(
      () => supabase.from("secondary_sales").select("*").eq("company_id", deps.companyId).order("created_at", { ascending: false }),
      1000, 200, "secondary_sales",
    );
    setSecondarySales(data.map((s) => ({ id: s.id, distributorId: s.distributor_id, productId: s.product_id, productName: s.product_name, retailerName: s.retailer_name, quantity: s.quantity, date: s.date, remarks: s.remarks })));
  }, [deps.companyId]);

  return {
    targets, setTargets, secondarySales, setSecondarySales,
    addTarget, updateTarget, deleteTarget, addSecondarySale, deleteSecondarySale,
    safeRefetchTargets, safeRefetchSecondarySales,
  };
}
