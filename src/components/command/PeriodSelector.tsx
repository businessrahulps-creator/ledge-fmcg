import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { CommandPeriod, PERIOD_LABELS } from "@/lib/command-signals";

interface Props {
  period: CommandPeriod;
  customFrom?: string;
  customTo?: string;
  onChange: (period: CommandPeriod, customFrom?: string, customTo?: string) => void;
}

const ORDER: CommandPeriod[] = ["today", "7d", "30d", "90d", "ytd", "custom"];

export function PeriodSelector({ period, customFrom, customTo, onChange }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={period} onValueChange={(v) => onChange(v as CommandPeriod, customFrom, customTo)}>
        <SelectTrigger className="h-9 w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ORDER.map((p) => (
            <SelectItem key={p} value={p}>{PERIOD_LABELS[p]}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {period === "custom" && (
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={customFrom || ""}
            onChange={(e) => onChange("custom", e.target.value, customTo)}
            className="h-9 w-40"
          />
          <span className="text-xs text-muted-foreground">to</span>
          <Input
            type="date"
            value={customTo || ""}
            onChange={(e) => onChange("custom", customFrom, e.target.value)}
            className="h-9 w-40"
          />
        </div>
      )}
    </div>
  );
}
