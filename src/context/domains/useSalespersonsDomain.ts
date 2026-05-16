import { useState, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Salesperson } from "@/data/mock-data";
import { cacheData } from "@/lib/offline-store";
import { sanitizeInput } from "@/utils/sanitize";
import { makeOfflineCrud, mapSalesperson, fetchAllChunked } from "@/context/data-utils";
import type { DomainDeps } from "@/context/data-types";

export function useSalespersonsDomain(deps: DomainDeps) {
  const [rawSalespersons, setSalespersons] = useState<Salesperson[]>([]);

  const toDbRow = (s: Salesperson) => ({
    name: sanitizeInput(s.name), phone: sanitizeInput(s.phone),
    email: sanitizeInput(s.email), region: sanitizeInput(s.region),
  });

  const crud = useMemo(() => makeOfflineCrud<Salesperson>(
    deps, "salespersons", setSalespersons, "salespersons", toDbRow, "salesperson", s => s.name,
  ), [deps.companyId, deps.persistEntityToCache, deps.log]);

  const safeRefetch = useCallback(async () => {
    if (!deps.companyId) return;
    try {
      const { data } = await supabase.from("salespersons").select("*").eq("company_id", deps.companyId).order("name").range(0, 9999);
      if (data) {
        const mapped = data.map(mapSalesperson);
        setSalespersons(mapped);
        cacheData(deps.companyId, "salespersons", mapped);
      }
    } catch { /* ignore */ }
  }, [deps.companyId]);

  return { rawSalespersons, setSalespersons, ...crud, safeRefetch };
}
