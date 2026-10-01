import { Input } from "@/components/ui/input";
import { CommandPeriod, PERIOD_LABELS, type PeriodRange } from "@/lib/command-signals";
import { cn } from "@/lib/utils";

interface Props {
  period: CommandPeriod;
  customFrom?: string;
  customTo?: string;
  range?: PeriodRange;
  onChange: (period: CommandPeriod, customFrom?: string, customTo?: string) => void;
}

const ORDER: CommandPeriod[] = ["today", "7d", "30d", "90d", "ytd", "custom"];
const SHORT: Record<CommandPeriod, string> = {
  today: "Today",
  "7d": "7D",
  "30d": "30D",
  "90d": "90D",
  ytd: "This year",
  custom: "Custom",
};

const FMT = new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short" });

function formatRange(range?: PeriodRange): string | null {
  if (!range) return null;
  return `${FMT.format(range.from)} – ${FMT.format(range.to)}`;
}

export function PeriodSelector({ period, customFrom, customTo, range, onChange }: Props) {
  const rangeLabel = formatRange(range);
  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <div role="radiogroup" aria-label="Time period" className="inline-flex max-w-full overflow-x-auto rounded-full bg-muted p-0.5">
          {ORDER.map((p) => {
            const active = p === period;
            return (
              <button
                key={p}
                type="button"
                role="radio"
                aria-checked={active}
                title={PERIOD_LABELS[p]}
                onClick={() => onChange(p, customFrom, customTo)}
                className={cn(
                  "h-8 whitespace-nowrap rounded-full px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {SHORT[p]}
              </button>
            );
          })}
        </div>
        {period === "custom" && (
          <div className="flex items-center gap-2">
            <Input type="date" value={customFrom || ""} onChange={(e) => onChange("custom", e.target.value, customTo)} className="h-9 w-40" aria-label="From date" />
            <span className="text-xs text-muted-foreground">to</span>
            <Input type="date" value={customTo || ""} onChange={(e) => onChange("custom", customFrom, e.target.value)} className="h-9 w-40" aria-label="To date" />
          </div>
        )}
      </div>
      {rangeLabel && <p className="num text-[11px] tracking-wide text-muted-foreground">{rangeLabel}</p>}
    </div>
  );
}
