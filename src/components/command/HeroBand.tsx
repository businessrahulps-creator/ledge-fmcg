import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/data/mock-data";
import { cn } from "@/lib/utils";

interface Props {
  collected: number;
  newInvoiced: number;
  prevCollected: number;
  periodLabel: string;
}

/**
 * Hero band — single big "Net Position" number for the period.
 * Net = Money collected − New invoiced. Positive = brought balance down.
 */
export function HeroBand({ collected, newInvoiced, prevCollected, periodLabel }: Props) {
  const net = collected - newInvoiced;
  const positive = net >= 0;
  const Icon = net === 0 ? Minus : positive ? ArrowUpRight : ArrowDownRight;
  const tone = net === 0 ? "text-muted-foreground" : positive ? "text-success" : "text-destructive";

  // Comparison line vs previous period collections
  let comparison = "No prior collections to compare.";
  if (prevCollected > 0) {
    const diff = collected - prevCollected;
    const pct = (diff / prevCollected) * 100;
    if (Math.abs(pct) < 1) {
      comparison = `Collections flat vs previous ${periodLabel.toLowerCase()}.`;
    } else if (diff >= 0) {
      comparison = `You're ${formatCurrency(diff)} ahead of last ${periodLabel.toLowerCase()} at the same point.`;
    } else {
      comparison = `You're ${formatCurrency(Math.abs(diff))} behind last ${periodLabel.toLowerCase()} at the same point.`;
    }
  }

  const interpretation = net > 0
    ? `You brought outstanding down by ${formatCurrency(net)} this ${periodLabel.toLowerCase()}.`
    : net < 0
      ? `You added ${formatCurrency(Math.abs(net))} to outstanding this ${periodLabel.toLowerCase()}.`
      : `Money in matched money invoiced this ${periodLabel.toLowerCase()}.`;

  return (
    <Card className="relative overflow-hidden p-5 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Net position · {periodLabel}
          </p>
          <div className="mt-1 flex items-baseline gap-3">
            <span className={cn("h1-display num tabular-nums", tone)}>
              {positive && net !== 0 ? "+" : ""}{formatCurrency(net)}
            </span>
            <Icon className={cn("h-5 w-5 shrink-0", tone)} />
          </div>
          <p className="mt-1 text-sm text-foreground/80">{interpretation}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{comparison}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 border-l-0 border-t border-border pt-4 md:border-l md:border-t-0 md:pl-6 md:pt-0">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Collected
            </p>
            <p className="num mt-1 text-lg font-semibold text-success">{formatCurrency(collected)}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              New invoiced
            </p>
            <p className="num mt-1 text-lg font-semibold text-foreground">{formatCurrency(newInvoiced)}</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
