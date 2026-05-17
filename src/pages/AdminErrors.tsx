import { useEffect, useState, useCallback } from "react";
import { Navigate } from "react-router-dom";
import { useIsFetching } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/context/AuthContext";
import { useCan } from "@/hooks/useCan";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, RefreshCw, CheckCircle2, ChevronDown, ChevronRight } from "lucide-react";
import { logError } from "@/utils/errorLog";
import { APP_VERSION } from "@/lib/app-version";

interface ErrorRow {
  id: string;
  created_at: string;
  source: string;
  severity: string;
  message: string;
  stack: string;
  context: Record<string, unknown> | null;
  resolved: boolean;
  user_id: string | null;
}

const SEVERITY_TONE: Record<string, string> = {
  error: "bg-destructive/10 text-destructive border-destructive/20",
  warning: "bg-warning/10 text-warning border-warning/20",
  info: "bg-muted text-muted-foreground border-border",
};

export default function AdminErrors() {
  const { user, loading } = useAuth();
  const canViewLogs = useCan("view_error_logs");
  const capPending = useIsFetching({ queryKey: ["capability", user?.id ?? null, "view_error_logs"] }) > 0;
  const [rows, setRows] = useState<ErrorRow[] | null>(null);
  const [filter, setFilter] = useState<"open" | "all">("open");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setBusy(true);
    let q = supabase
      .from("error_log")
      .select("id, created_at, source, severity, message, stack, context, resolved, user_id")
      .order("created_at", { ascending: false })
      .limit(200);
    if (filter === "open") q = q.eq("resolved", false);
    const { data, error } = await q;
    if (error) {
      logError({ source: "page:AdminErrors.load", error });
      setRows([]);
    } else {
      setRows((data ?? []) as ErrorRow[]);
    }
    setBusy(false);
  }, [filter]);

  useEffect(() => {
    if (canViewLogs) load();
  }, [canViewLogs, load]);

  if (loading || capPending) return <AppLayout><Skeleton className="h-40 w-full" /></AppLayout>;
  if (!canViewLogs) return <Navigate to="/dashboard" replace />;

  const resolve = async (id: string) => {
    const { error } = await supabase
      .from("error_log")
      .update({ resolved: true })
      .eq("id", id);
    if (error) {
      logError({ source: "page:AdminErrors.resolve", error });
      return;
    }
    setRows((prev) => prev?.map((r) => (r.id === id ? { ...r, resolved: true } : r)) ?? null);
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <AlertTriangle className="h-5 w-5" />
              <span className="text-sm font-medium">Error Log</span>
            </div>
            <h1 className="h1-display">Runtime errors</h1>
            <p className="text-sm text-muted-foreground">
              Live capture of blank-page crashes, unhandled rejections, and backend failures. Currently on {APP_VERSION}.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-md border bg-card p-0.5">
              {(["open", "all"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-[5px] transition-colors ${
                    filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f === "open" ? "Open" : "All"}
                </button>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={load} disabled={busy}>
              <RefreshCw className={`h-4 w-4 mr-1.5 ${busy ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        <div className="glass-card rounded-md border overflow-hidden">
          {rows === null ? (
            <div className="p-6 space-y-2">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : rows.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-success" />
              No errors {filter === "open" ? "open" : "logged"}. The app is running clean.
            </div>
          ) : (
            <ul className="divide-y">
              {rows.map((r) => {
                const open = expanded === r.id;
                const when = new Date(r.created_at);
                const route = r.context?.route || "—";
                return (
                  <li key={r.id} className="p-3 sm:p-4">
                    <button
                      className="w-full text-left flex items-start gap-3"
                      onClick={() => setExpanded(open ? null : r.id)}
                    >
                      <div className="pt-0.5">
                        {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className={`text-[10px] uppercase tracking-wide ${SEVERITY_TONE[r.severity] || ""}`}>
                            {r.severity}
                          </Badge>
                          <span className="text-xs font-mono text-muted-foreground">{r.source}</span>
                          {r.resolved && (
                            <Badge variant="outline" className="text-[10px] bg-success/10 text-success border-success/20">
                              resolved
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm font-medium truncate">{r.message}</div>
                        <div className="text-xs text-muted-foreground num">
                          {when.toLocaleString()} · <span className="font-mono">{route}</span>
                        </div>
                      </div>
                      {!r.resolved && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); resolve(r.id); }}
                        >
                          Mark resolved
                        </Button>
                      )}
                    </button>
                    {open && (
                      <div className="mt-3 ml-7 space-y-3 text-xs">
                        {r.stack && (
                          <div>
                            <div className="font-semibold text-muted-foreground mb-1">Stack</div>
                            <pre className="bg-muted/40 border rounded-md p-3 overflow-auto max-h-64 text-[11px] font-mono whitespace-pre-wrap break-all">
                              {r.stack}
                            </pre>
                          </div>
                        )}
                        {r.context && (
                          <div>
                            <div className="font-semibold text-muted-foreground mb-1">Context</div>
                            <pre className="bg-muted/40 border rounded-md p-3 overflow-auto max-h-64 text-[11px] font-mono whitespace-pre-wrap break-all">
                              {JSON.stringify(r.context, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
