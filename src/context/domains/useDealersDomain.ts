import { useState, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Distributor } from "@/data/mock-data";
import { cacheData } from "@/lib/offline-store";
import { sanitizeInput } from "@/utils/sanitize";
import { makeOfflineCrud, mapDistributor } from "@/context/data-utils";
import type { DomainDeps } from "@/context/data-types";
import { fmtAmount } from "@/utils/activityLog";

export function useDealersDomain(deps: DomainDeps) {
  const [rawDistributors, setDistributors] = useState<Distributor[]>([]);

  const toDbRow = (d: Distributor) => ({
    name: sanitizeInput(d.name), location: sanitizeInput(d.location), contact: sanitizeInput(d.contact),
    credit_limit: d.creditLimit || 0, email: sanitizeInput(d.email || ""), address: sanitizeInput(d.address || ""),
    gstin: sanitizeInput(d.gstin || ""), pan: sanitizeInput(d.pan || ""), state_code: sanitizeInput(d.stateCode || ""),
    bank_name: sanitizeInput(d.bankName || ""), bank_account_name: sanitizeInput(d.bankAccountName || ""),
    bank_account: sanitizeInput(d.bankAccount || ""), bank_ifsc: sanitizeInput(d.bankIfsc || ""),
  });

  const crud = useMemo(() => makeOfflineCrud<Distributor>(
    deps, "distributors", setDistributors, "distributors", toDbRow, "dealer", d => d.name,
  ), [deps.companyId, deps.persistEntityToCache, deps.log]);

  const safeRefetch = useCallback(async () => {
    if (!deps.companyId) return;
    try {
      const { data } = await supabase.from("distributors").select("*").eq("company_id", deps.companyId).order("name").range(0, 9999);
      if (data) {
        const mapped = data.map(mapDistributor);
        setDistributors(mapped);
        cacheData(deps.companyId, "distributors", mapped);
      }
    } catch { /* ignore */ }
  }, [deps.companyId]);

  return { rawDistributors, setDistributors, ...crud, safeRefetch };
}
