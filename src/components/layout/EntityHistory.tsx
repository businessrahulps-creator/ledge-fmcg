import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, History } from "lucide-react";
import { SmartTime } from "@/components/ui/smart-time";

interface ActivityEntry {
  id: string;
  action: string;
  summary: string;
  user_name: string;
  created_at: string;
}

interface Props {
  entityType: string;
  entityId: string;
}

export function EntityHistory({ entityType, entityId }: Props) {
  const { companyId } = useAuth();
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open || !companyId) return;
    supabase
      .from("activity_log" as any)
      .select("id, action, summary, user_name, created_at")
      .eq("company_id", companyId)
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .order("created_at", { ascending: false })
      .limit(30)
      .then(({ data }) => setEntries(((data as any) || []) as ActivityEntry[]));
  }, [open, companyId, entityType, entityId]);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-full py-2">
        <History className="h-4 w-4" />
        <span>History</span>
        <ChevronDown className={`h-4 w-4 ml-auto transition-transform ${open ? "rotate-180" : ""}`} />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-1 pt-1 pb-2">
          {entries.length === 0 && (
            <p className="text-xs text-muted-foreground py-3 text-center">No history recorded</p>
          )}
          {entries.map(e => (
            <div key={e.id} className="flex gap-2 py-1.5 text-xs">
              <div className="w-1 rounded-full bg-border shrink-0 mt-1" style={{ minHeight: 16 }} />
              <div>
                <p className="text-foreground/90">{e.summary}</p>
                <p className="text-muted-foreground">
                  {e.user_name || "System"} · {formatDistanceToNow(new Date(e.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
