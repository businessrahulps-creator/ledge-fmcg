import { HeroBand as HeroBandShell } from "@/components/ui/hero-band";
import { formatCurrency } from "@/data/mock-data";

interface Props {
  collected: number;
  newInvoiced: number;
  prevCollected: number;
  periodLabel: string;
}

/**
 * The one loud block on My Business: net position for the period.
 * Net = Money collected − New invoiced. Positive = brought balance down.
 */
export function HeroBand({ collected, newInvoiced, prevCollected, periodLabel }: Props) {
  const net = collected - newInvoiced;
  const positive = net >= 0;

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
    <HeroBandShell
      eyebrow={`Net position · ${periodLabel}`}
      title={`${positive && net !== 0 ? "+" : ""}${formatCurrency(net)}`}
      subtitle={interpretation}
      figures={[
        {
          label: "Money collected",
          value: formatCurrency(collected),
          tone: collected > 0 ? "good" : "default",
          note: comparison,
        },
        {
          label: "New invoiced",
          value: formatCurrency(newInvoiced),
          note: `Billed this ${periodLabel.toLowerCase()}`,
        },
        {
          label: "Net effect",
          value: net === 0 ? "No change" : net > 0 ? "Balance came down" : "Balance went up",
          tone: net === 0 ? "default" : net > 0 ? "good" : "attention",
          note: "Money in minus money billed",
        },
      ]}
    />
  );
}
