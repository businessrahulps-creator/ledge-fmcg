import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Activity, ChevronDown, Copy, CheckCircle2, RotateCw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface ErrorLogRow {
  id: string;
  created_at: string;
  severity: "error" | "warning" | "info";
  source: string;
  message: string;
  stack: string;
  context: Record<string, any>;
  resolved: boolean;
}

interface GroupedError {
  source: string;
  message: string;
  severity: "error" | "warning" | "info";
  count: number;
  lastSeen: string;
  rows: ErrorLogRow[];
}

export function SystemHealthCard() {
  const [logs, setLogs] = useState<ErrorLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("error_log" as any)
      .select("*")
      .eq("resolved", false)
      .order("created_at", { ascending: false })
      .limit(500);
    setLogs((data as any[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 15_000);
    return () => clearInterval(interval);
  }, []);

  const grouped: GroupedError[] = (() => {
    const map = new Map<string, GroupedError>();
    for (const row of logs) {
      const key = `${row.source}::${row.message}`;
      const existing = map.get(key);
      if (existing) {
        existing.count++;
        existing.rows.push(row);
        if (row.created_at > existing.lastSeen) existing.lastSeen = row.created_at;
      } else {
        map.set(key, {
          source: row.source,
          message: row.message,
          severity: row.severity,
          count: 1,
          lastSeen: row.created_at,
          rows: [row],
        });
      }
    }
    return [...map.values()].sort((a, b) => (a.lastSeen < b.lastSeen ? 1 : -1)).slice(0, 50);
  })();

  const markResolved = async (group: GroupedError) => {
    const ids = group.rows.map((r) => r.id);
    const { error } = await supabase
      .from("error_log" as any)
      .update({ resolved: true })
      .in("id", ids);
    if (error) {
      toast.error("Failed to mark resolved", { description: error.message });
      return;
    }
    toast.success(`Marked ${ids.length} entr${ids.length > 1 ? "ies" : "y"} resolved`);
    load();
  };

  const copyDetails = (group: GroupedError) => {
    const sample = group.rows[0];
    const payload = {
      source: group.source,
      message: group.message,
      severity: group.severity,
      count: group.count,
      lastSeen: group.lastSeen,
      stack: sample.stack,
      context: sample.context,
    };
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    toast.success("Details copied to clipboard");
  };

  const severityClass = (s: string) =>
    s === "error"
      ? "bg-destructive/15 text-destructive border-destructive/30"
      : s === "warning"
      ? "bg-warning/15 text-warning border-warning/30"
      : "bg-muted text-muted-foreground border-border";

  return (
    <div className="glass-card p-4 md:p-6 max-w-2xl">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <Activity className="h-5 w-5 text-primary shrink-0" />
          <div>
            <h3 className="text-sm font-semibold md:text-base">System Health</h3>
            <p className="text-xs text-muted-foreground md:text-sm mt-0.5">
              Recent backend failures and silent errors
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={load} disabled={loading}>
          <RotateCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {grouped.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Sparkles className="h-8 w-8 text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">No errors logged. ✨</p>
          <p className="text-xs text-muted-foreground/70 mt-1">All systems operating normally.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {grouped.map((g) => {
            const key = `${g.source}::${g.message}`;
            const open = expanded === key;
            const sample = g.rows[0];
            return (
              <Collapsible key={key} open={open} onOpenChange={(v) => setExpanded(v ? key : null)}>
                <div className="rounded-lg border border-border/50 bg-muted/20">
                  <CollapsibleTrigger className="w-full flex items-center justify-between gap-3 p-3 text-left hover:bg-muted/40 rounded-lg transition-colors">
                    <div className="flex items-start gap-2 min-w-0 flex-1">
                      <Badge variant="outline" className={`text-[10px] uppercase tracking-wide ${severityClass(g.severity)} shrink-0`}>
                        {g.severity}
                      </Badge>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-mono text-muted-foreground truncate">{g.source}</p>
                        <p className="text-sm font-medium truncate mt-0.5">{g.message}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {g.count}× · last seen {formatDistanceToNow(new Date(g.lastSeen), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="border-t border-border/50 p-3 space-y-3">
                      {sample.stack && (
                        <div>
                          <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Stack</p>
                          <pre className="text-[10px] font-mono bg-background/60 p-2 rounded border border-border/30 max-h-40 overflow-auto whitespace-pre-wrap">
                            {sample.stack}
                          </pre>
                        </div>
                      )}
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Context</p>
                        <pre className="text-[10px] font-mono bg-background/60 p-2 rounded border border-border/30 max-h-32 overflow-auto whitespace-pre-wrap">
                          {JSON.stringify(sample.context, null, 2)}
                        </pre>
                      </div>
                      <div className="flex gap-2 pt-1">
                        <Button size="sm" variant="outline" onClick={() => markResolved(g)}>
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                          Mark resolved
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => copyDetails(g)}>
                          <Copy className="h-3.5 w-3.5 mr-1" />
                          Copy details
                        </Button>
                      </div>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })}
        </div>
      )}
    </div>
  );
}
