import { useEffect, useState } from "react";
import { Sparkles, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface DigestContext {
  todayOrders: number;
  todayRevenue: number;
  monthOrders: number;
  monthRevenue: number;
  outstanding: number;
  overdueDealers: number;
  lowStockSkus: number;
  topDealer?: string;
}

interface TodayDigestProps {
  context: DigestContext;
  /** Stable cache key — usually the iso date — so we don't refetch on every render. */
  cacheKey: string;
}

interface CachedEntry {
  key: string;
  summary: string;
  at: number;
}

const STORAGE_KEY = "ledge:today-digest:v1";
const TTL_MS = 6 * 60 * 60 * 1000; // 6h

function readCache(key: string): string | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const e: CachedEntry = JSON.parse(raw);
    if (e.key !== key) return null;
    if (Date.now() - e.at > TTL_MS) return null;
    return e.summary;
  } catch {
    return null;
  }
}

function writeCache(key: string, summary: string) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ key, summary, at: Date.now() } satisfies CachedEntry));
  } catch {
    /* ignore quota errors */
  }
}

/**
 * "Today" digest — 2-sentence Gemini summary of the business pulse.
 * Cached per-day in sessionStorage so it costs at most 1 AI call per session per day.
 */
export function TodayDigest({ context, cacheKey }: TodayDigestProps) {
  const [summary, setSummary] = useState<string | null>(() => readCache(cacheKey));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDigest = async (force = false) => {
    if (!force && summary) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: invokeErr } = await supabase.functions.invoke("dashboard-digest", {
        body: { context },
      });
      if (invokeErr) throw invokeErr;
      const text: string | undefined = data?.summary;
      if (!text) throw new Error("Empty digest");
      setSummary(text);
      writeCache(cacheKey, text);
    } catch (err: any) {
      setError(err?.message ?? "Couldn't load digest");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (summary) return;
    fetchDigest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey]);

  return (
    <section
      aria-label="Today's briefing"
      className="relative overflow-hidden rounded-md border border-border/60 bg-card p-4 shadow-depth-2 md:p-5"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Sparkles className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/70">
              Today's briefing
            </p>
            <button
              type="button"
              onClick={() => fetchDigest(true)}
              disabled={loading}
              aria-label="Refresh briefing"
              className="text-muted-foreground/60 hover:text-foreground transition-colors disabled:opacity-40"
            >
              <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
            </button>
          </div>
          {loading && !summary ? (
            <div className="mt-2 space-y-1.5">
              <div className="h-3 w-11/12 animate-pulse rounded bg-muted" />
              <div className="h-3 w-9/12 animate-pulse rounded bg-muted" />
            </div>
          ) : error && !summary ? (
            <p className="mt-1.5 text-sm text-muted-foreground">
              Couldn't load briefing.{" "}
              <button onClick={() => fetchDigest(true)} className="text-link">Retry</button>
            </p>
          ) : (
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-foreground/85 md:text-sm">
              {summary}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
