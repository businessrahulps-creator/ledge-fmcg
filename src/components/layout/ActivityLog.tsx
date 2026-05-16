import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ClipboardList, UserRound, Package, UserCheck, Gift, RotateCcw,
  FileText, Boxes, History, Warehouse,
} from "lucide-react";
import { SmartTime } from "@/components/ui/smart-time";

const ENTITY_ICONS: Record<string, React.ElementType> = {
  order: ClipboardList,
  dealer: UserRound,
  product: Package,
  salesperson: UserCheck,
  scheme: Gift,
  claim: RotateCcw,
  invoice: FileText,
  stock_item: Boxes,
  warehouse: Warehouse,
};

const ENTITY_LABELS: Record<string, string> = {
  order: "Orders",
  dealer: "Dealers",
  product: "Products",
  salesperson: "Sales Team",
  scheme: "Schemes",
  claim: "Returns",
  invoice: "Invoices",
  stock_item: "Stock",
  warehouse: "Warehouses",
};

interface ActivityEntry {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  summary: string;
  user_name: string;
  created_at: string;
  metadata: Record<string, any>;
}

const PAGE_SIZE = 50;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ActivityLog({ open, onOpenChange }: Props) {
  const { companyId } = useAuth();
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  // Cursor-based pagination: page through using the oldest loaded `created_at`
  // as the next anchor. Avoids the silent 1000-row Supabase cap and remains
  // correct even when new rows arrive mid-session.
  const fetchEntries = useCallback(async (cursor: string | null) => {
    if (!companyId) return;
    setLoading(true);
    try {
      let query = supabase
        .from("activity_log" as any)
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE);

      if (filter !== "all") query = query.eq("entity_type", filter);
      if (cursor) query = query.lt("created_at", cursor);

      const { data } = await query;
      const rows = ((data as any) || []) as ActivityEntry[];
      setHasMore(rows.length === PAGE_SIZE);
      setEntries(prev => (cursor ? [...prev, ...rows] : rows));
    } finally {
      setLoading(false);
    }
  }, [companyId, filter]);

  useEffect(() => {
    if (open) fetchEntries(null);
  }, [open, filter, companyId, fetchEntries]);

  // Realtime: while sheet is open, prepend new activity rows live.
  useEffect(() => {
    if (!open || !companyId) return;
    const channel = supabase
      .channel(`activity_log:${companyId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "activity_log", filter: `company_id=eq.${companyId}` },
        (payload) => {
          const row = payload.new as ActivityEntry;
          if (filter !== "all" && row.entity_type !== filter) return;
          setEntries(prev => prev.some(e => e.id === row.id) ? prev : [row, ...prev]);
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [open, companyId, filter]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <History className="h-5 w-5" /> Activity History
          </SheetTitle>
          <SheetDescription className="sr-only">Recent changes across your company</SheetDescription>
          <Select value={filter} onValueChange={v => setFilter(v)}>
            <SelectTrigger className="w-full mt-2">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All activity</SelectItem>
              {Object.entries(ENTITY_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
          {entries.length === 0 && !loading && (
            <p className="text-sm text-muted-foreground text-center py-10">No activity yet</p>
          )}
          {entries.map(entry => {
            const Icon = ENTITY_ICONS[entry.entity_type] || ClipboardList;
            return (
              <div key={entry.id} className="flex gap-3 py-2.5 border-b border-border/40 last:border-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/60">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm leading-snug">{entry.summary}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {entry.user_name || "System"}
                    {" · "}
                    {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            );
          })}
          {hasMore && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-2"
              onClick={() => fetchEntries(entries[entries.length - 1]?.created_at ?? null)}
              disabled={loading}
            >
              {loading ? "Loading…" : "Load more"}
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
