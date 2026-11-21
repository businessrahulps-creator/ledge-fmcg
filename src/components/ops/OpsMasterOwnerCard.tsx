import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { handleSupabaseError } from "@/utils/handleSupabaseError";
import { OpsCard, OpsEmpty } from "@/pages/ops/ops-ui";

export function OpsMasterOwnerCard({ companyId }: { companyId: string }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["ops", "company-members", companyId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("ops_company_members", { p_company: companyId });
      if (error) throw error;
      return data ?? [];
    },
    retry: false,
  });
  const [target, setTarget] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const master = data?.find((m) => m.is_master);

  const submit = async () => {
    if (!target || reason.trim().length < 5 || saving) return;
    setSaving(true);
    const { error } = await supabase.rpc("platform_reassign_master_owner", {
      p_company: companyId, p_new_user: target, p_reason: reason.trim(),
    });
    setSaving(false);
    if (error) return handleSupabaseError(error, { source: "ops:master.reassign", title: "Couldn't reassign" });
    toast.success("Master Owner reassigned");
    setTarget(""); setReason("");
    qc.invalidateQueries({ queryKey: ["ops", "company-members", companyId] });
  };

  return (
    <OpsCard title="Master Owner" className="mt-5">
      {isLoading && <OpsEmpty>Loading…</OpsEmpty>}
      {!isLoading && (
        <div className="space-y-3 p-3 text-sm">
          <p>Current: <span className="font-semibold">{master ? `${master.full_name || master.email} (${master.email})` : "Not set"}</span></p>
          <p className="text-xs text-muted-foreground">
            Use only for recovery or a sale of the business. The reason is saved in the platform log and the business's Activity.
          </p>
          <Select value={target} onValueChange={setTarget}>
            <SelectTrigger className="h-10"><SelectValue placeholder="Choose new Master Owner" /></SelectTrigger>
            <SelectContent>
              {(data ?? []).filter((m) => !m.is_master).map((m) => (
                <SelectItem key={m.user_id} value={m.user_id}>{(m.full_name || m.email) + " · " + m.email}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Textarea placeholder="Reason (required)" value={reason} onChange={(e) => setReason(e.target.value)} />
          <Button size="compact" onClick={submit} disabled={!target || reason.trim().length < 5 || saving}>
            {saving ? "Reassigning…" : "Reassign Master Owner"}
          </Button>
        </div>
      )}
    </OpsCard>
  );
}
