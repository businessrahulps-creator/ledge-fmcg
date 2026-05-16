import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface ExplainButtonProps {
  /** Short label. e.g. "Outstanding". */
  metric: string;
  /** Formatted value to explain. e.g. "₹2.4L". */
  value: string;
  /** Supporting context lines (driver bullets). */
  context?: string[];
  className?: string;
  /** Visual size. Default sm. */
  size?: "sm" | "md";
}

/**
 * `✦` affordance next to any KPI. On click, asks Gemini to explain the
 * number using the supplied context. Result is memoised per-open.
 */
export function ExplainButton({ metric, value, context, className, size = "sm" }: ExplainButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (explanation || loading) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: invokeErr } = await supabase.functions.invoke("explain-metric", {
        body: { metric, value, context },
      });
      if (invokeErr) throw invokeErr;
      const text: string | undefined = data?.explanation;
      if (!text) throw new Error("Empty response");
      setExplanation(text);
    } catch (err: any) {
      setError(err?.message ?? "Couldn't explain");
    } finally {
      setLoading(false);
    }
  };

  const iconSize = size === "md" ? "h-3.5 w-3.5" : "h-3 w-3";
  const btnSize = size === "md" ? "h-6 w-6" : "h-5 w-5";

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) void load();
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Explain ${metric}`}
          className={cn(
            "inline-flex shrink-0 items-center justify-center rounded-full text-muted-foreground/55 transition-colors hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
            btnSize,
            className
          )}
        >
          <Sparkles className={iconSize} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-72 rounded-md border border-border bg-popover p-3 shadow-depth-8"
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
          {metric} · {value}
        </p>
        {loading ? (
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            Thinking…
          </div>
        ) : error ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Couldn't load explanation.{" "}
            <button
              onClick={() => {
                setExplanation(null);
                void load();
              }}
              className="text-link"
            >
              Retry
            </button>
          </p>
        ) : (
          <p className="mt-2 text-[13px] leading-relaxed text-foreground/85">{explanation}</p>
        )}
      </PopoverContent>
    </Popover>
  );
}
