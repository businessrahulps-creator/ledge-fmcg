import { useState, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Product, Scheme } from "@/data/mock-data";
import { cacheData } from "@/lib/offline-store";
import { sanitizeInput } from "@/utils/sanitize";
import { makeOfflineCrud, mapProduct, mapScheme } from "@/context/data-utils";
import type { DomainDeps } from "@/context/data-types";
import { fmtAmount } from "@/utils/activityLog";

export function useCatalogDomain(deps: DomainDeps) {
  const [rawProducts, setProducts] = useState<Product[]>([]);
  const [schemes, setSchemes] = useState<Scheme[]>([]);

  const prodCrud = useMemo(() => makeOfflineCrud<Product>(
    deps, "products", setProducts, "products",
    p => ({ name: sanitizeInput(p.name), sku: sanitizeInput(p.sku), unit: sanitizeInput(p.unit), base_price: p.basePrice, hsn_code: sanitizeInput(p.hsnCode || "") }),
    "product", p => `${p.name} — ${fmtAmount(p.basePrice)}`,
  ), [deps.companyId, deps.persistEntityToCache, deps.log]);

  const schemeCrud = useMemo(() => makeOfflineCrud<Scheme>(
    deps, "schemes", setSchemes, "schemes",
    s => ({
      name: sanitizeInput(s.name), description: sanitizeInput(s.description),
      scheme_type: s.schemeType, discount_percent: s.discountPercent,
      buy_qty: s.buyQty, free_qty: s.freeQty, flat_amount: s.flatAmount,
      min_order_value: s.minOrderValue, min_qty: s.minQty,
      product_id: s.productId || null, dealer_id: s.dealerId || null,
      is_active: s.isActive, valid_from: s.validFrom, valid_until: s.validUntil || null,
    }),
    "scheme", s => s.name,
  ), [deps.companyId, deps.persistEntityToCache, deps.log]);

  const safeRefetchProducts = useCallback(async () => {
    if (!deps.companyId) return;
    try {
      const { data } = await supabase.from("products").select("*").eq("company_id", deps.companyId).order("name").range(0, 9999);
      if (data) {
        const mapped = data.map(mapProduct);
        setProducts(mapped);
        cacheData(deps.companyId, "products", mapped);
      }
    } catch { /* ignore */ }
  }, [deps.companyId]);

  const safeRefetchSchemes = useCallback(async () => {
    if (!deps.companyId) return;
    try {
      const { data } = await supabase.from("schemes").select("*").eq("company_id", deps.companyId).order("created_at", { ascending: false }).range(0, 9999);
      if (data) {
        const mapped = data.map(mapScheme);
        setSchemes(mapped);
        cacheData(deps.companyId, "schemes", mapped);
      }
    } catch { /* ignore */ }
  }, [deps.companyId]);

  return {
    rawProducts, setProducts, schemes, setSchemes,
    addProduct: prodCrud.add, updateProduct: prodCrud.update, deleteProduct: prodCrud.remove,
    addScheme: schemeCrud.add, updateScheme: schemeCrud.update, deleteScheme: schemeCrud.remove,
    safeRefetchProducts, safeRefetchSchemes,
  };
}
