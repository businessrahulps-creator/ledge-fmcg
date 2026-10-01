import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { useTodaysWork } from "@/hooks/useTodaysWork";

/** Dashboard strip: the top 3 things to do today, linking to Today's work. */
export function TodayStrip() {
  const w = useTodaysWork();
  if (w.loading) return null;
  return (
    <section aria-label="3 things to do today" className="rounded-md border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">
          {w.top.length ? `${w.top.length} thing${w.top.length === 1 ? "" : "s"} to do today` : "Nothing urgent today"}
        </h2>
        <Link to="/today" className="inline-flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground min-h-[32px]">
          See all <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>
      {w.top.length > 0 && (
        <ol className="mt-2 divide-y divide-border">
          {w.top.map((c, i) => (
            <li key={c.subjectId}>
              <Link to={c.link} className="flex items-start gap-3 py-2.5 hover:bg-muted/40 rounded-sm -mx-1 px-1">
                <span className="text-xs font-semibold text-muted-foreground mt-0.5 w-4">{i + 1}</span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium truncate">{c.title}</span>
                  <span className="block text-xs text-muted-foreground">{c.fact}</span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
