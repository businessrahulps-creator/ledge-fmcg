import { Card } from "@/components/ui/card";
import { DeltaPill } from "./DeltaPill";

interface Props {
  label: string;
  value: string;
  pct: number | null;
  inverse?: boolean;
  hint?: string;
}

export function CommandKpiCard({ label, value, pct, inverse, hint }: Props) {
  return (
    <Card className="p-4">
      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <p className="font-heading text-[26px] leading-tight num mt-1 text-foreground">{value}</p>
      <div className="mt-1 flex items-center gap-2">
        <DeltaPill pct={pct} inverse={inverse} />
        {hint && <span className="text-[11px] text-muted-foreground truncate">{hint}</span>}
      </div>
    </Card>
  );
}
