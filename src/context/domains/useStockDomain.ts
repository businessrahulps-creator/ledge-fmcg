import { useState, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { GodownLocation, StockItem } from "@/data/godown-data";
import type { OrderLine } from "@/data/mock-data";
import { cacheData, enqueueMutation } from "@/lib/offline-store";
import { sanitizeInput } from "@/utils/sanitize";
import { makeOfflineCrud, mapGodown, mapProduct } from "@/context/data-utils";
import type { DomainDeps } from "@/context/data-types";
import { toast } from "sonner";
import { handleSupabaseError } from "@/utils/handleSupabaseError";

export function useStockDomain(deps: DomainDeps) {
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [locations, setLocations] = useState<GodownLocation[]>([]);

  const locCrud = useMemo(() => makeOfflineCrud<GodownLocation>(
    deps, "godowns", setLocations, "locations",
    l => ({ name: sanitizeInput(l.name), address: sanitizeInput(l.address), is_active: l.isActive }),
    "stock_item", l => l.name,
  ), [deps.companyId, deps.persistEntityToCache, deps.log]);

  // Stock Items — custom upsert logic
  const addStockItem = useCallback(async (si: StockItem) => {
    if (!deps.companyId) return;
    if (!navigator.onLine) {
      const tempId = crypto.randomUUID();
      setStockItems(prev => {
        const updated = [...prev, { ...si, id: tempId }];
        deps.persistEntityToCache("stockItems", updated);
        return updated;
      });
      await enqueueMutation({
        type: "upsert", table: "stock_items", clientTempId: tempId,
        payload: {
          _onConflict: "company_id,product_id,godown_id",
          company_id: deps.companyId, product_id: si.productId, godown_id: si.godownId,
          quantity: si.quantity, threshold: si.threshold, last_deducted_date: si.lastDeductedDate,
        },
      });
      toast("Saved offline — will sync when back online", { duration: 3000 });
      return;
    }
    const { data, error } = await supabase.from("stock_items").upsert({
      company_id: deps.companyId, product_id: si.productId, godown_id: si.godownId,
      quantity: si.quantity, threshold: si.threshold, last_deducted_date: si.lastDeductedDate,
    }, { onConflict: "company_id,product_id,godown_id" }).select().single();
    if (error) { handleSupabaseError(error, { source: "crud:stock_items.add", title: "Failed to add stock item" }); return; }
    if (data) {
      setStockItems(prev => {
        const exists = prev.some(x => x.id === data.id);
        if (exists) return prev.map(x => x.id === data.id ? { ...si, id: data.id } : x);
        return [...prev, { ...si, id: data.id }];
      });
    }
  }, [deps.companyId, deps.persistEntityToCache]);

  const updateStockItem = useCallback(async (si: StockItem) => {
    if (!navigator.onLine) {
      setStockItems(prev => {
        const updated = prev.map(x => x.id === si.id ? si : x);
        deps.persistEntityToCache("stockItems", updated);
        return updated;
      });
      await enqueueMutation({
        type: "update", table: "stock_items",
        payload: { id: si.id, quantity: si.quantity, threshold: si.threshold, last_deducted_date: si.lastDeductedDate },
      });
      toast("Saved offline — will sync when back online", { duration: 3000 });
      return;
    }
    const { error } = await supabase.from("stock_items").update({
      quantity: si.quantity, threshold: si.threshold, last_deducted_date: si.lastDeductedDate,
    }).eq("id", si.id);
    if (error) { handleSupabaseError(error, { source: "crud:stock_items.update", title: "Failed to update stock item", context: { id: si.id } }); return; }
    setStockItems(prev => prev.map(x => x.id === si.id ? si : x));
  }, [deps.persistEntityToCache]);

  const deleteStockItem = useCallback(async (id: string): Promise<boolean> => {
    if (!navigator.onLine) {
      setStockItems(prev => {
        const updated = prev.filter(x => x.id !== id);
        deps.persistEntityToCache("stockItems", updated);
        return updated;
      });
      await enqueueMutation({ type: "delete", table: "stock_items", payload: { id } });
      toast("Saved offline — will sync when back online", { duration: 3000 });
      return true;
    }
    const { error } = await supabase.from("stock_items").delete().eq("id", id);
    if (error) { handleSupabaseError(error, { source: "crud:stock_items.delete", title: "Failed to delete stock item", context: { id } }); return false; }
    setStockItems(prev => prev.filter(x => x.id !== id));
    return true;
  }, [deps.persistEntityToCache]);

  const safeRefetchGodowns = useCallback(async () => {
    if (!deps.companyId) return;
    try {
      const { data } = await supabase.from("godowns").select("*").eq("company_id", deps.companyId).order("name").range(0, 9999);
      if (data) {
        const mapped = data.map(mapGodown);
        setLocations(mapped);
        cacheData(deps.companyId, "locations", mapped);
      }
    } catch { /* ignore */ }
  }, [deps.companyId]);

  const safeRefetchStockItems = useCallback(async () => {
    if (!deps.companyId) return;
    try {
      const [siRes, prodRes, gdRes] = await Promise.all([
        supabase.from("stock_items").select("*").eq("company_id", deps.companyId).order("created_at", { ascending: false }).range(0, 9999),
        supabase.from("products").select("*").eq("company_id", deps.companyId).order("name").range(0, 9999),
        supabase.from("godowns").select("*").eq("company_id", deps.companyId).order("name").range(0, 9999),
      ]);
      const freshProducts = (prodRes.data || []).map(p => ({ id: p.id, name: p.name, sku: p.sku, unit: p.unit, basePrice: Number(p.base_price) }));
      const freshGodowns = (gdRes.data || []).map(g => ({ id: g.id, name: g.name }));
      const siData = siRes.data;
      if (siData) {
        const mapped = siData.map(si => {
          const prod = freshProducts.find(p => p.id === si.product_id);
          const gd = freshGodowns.find(g => g.id === si.godown_id);
          return {
            id: si.id, productId: si.product_id, godownId: si.godown_id,
            productName: prod?.name || "", sku: prod?.sku || "", unit: prod?.unit || "",
            godownName: gd?.name || "", quantity: si.quantity, threshold: si.threshold,
            basePrice: prod?.basePrice || 0, lastDeductedDate: si.last_deducted_date,
          };
        });
        setStockItems(mapped);
        cacheData(deps.companyId, "stockItems", mapped);
      }
    } catch { /* ignore */ }
  }, [deps.companyId]);

  const deductStockForOrder = useCallback(async (
    orderId: string, lines: OrderLine[], godownId: string, cId: string
  ) => {
    const today = new Date().toISOString().split("T")[0];
    let hasNegative = false;

    const { data: freshStockData } = await supabase
      .from("stock_items").select("*").eq("company_id", cId).eq("godown_id", godownId);
    const freshStock = freshStockData || [];

    for (const line of lines) {
      await supabase.from("stock_deductions").insert({
        company_id: cId, order_id: orderId, product_id: line.productId,
        godown_id: godownId, quantity_deducted: line.quantity, date: today,
      });
      const existing = freshStock.find(si => si.product_id === line.productId && si.godown_id === godownId);
      if (existing) {
        const newQty = existing.quantity - line.quantity;
        if (newQty < 0) hasNegative = true;
        await supabase.from("stock_items").update({ quantity: newQty, last_deducted_date: today }).eq("id", existing.id);
        existing.quantity = newQty;
      } else {
        hasNegative = true;
        await supabase.from("stock_items").insert({
          company_id: cId, product_id: line.productId, godown_id: godownId,
          quantity: -line.quantity, threshold: 0, last_deducted_date: today,
        });
      }
    }
    await safeRefetchStockItems();
    if (hasNegative) {
      toast.warning("Negative stock warning", {
        description: "Some products now have negative stock in this warehouse. This is allowed but please reconcile inventory.",
      });
    }
  }, [safeRefetchStockItems]);

  return {
    stockItems, setStockItems, locations, setLocations,
    addStockItem, updateStockItem, deleteStockItem,
    addLocation: locCrud.add, updateLocation: locCrud.update, deleteLocation: locCrud.remove,
    safeRefetchGodowns, safeRefetchStockItems, deductStockForOrder,
  };
}
