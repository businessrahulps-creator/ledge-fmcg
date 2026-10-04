import { Clock, TrendingUp, LineChart, Wallet } from "lucide-react";
import { BarChart } from "@/components/arc/bar-chart/bar-chart";
import { Section, SectionHead, Reveal } from "../kit";

const outcomes = [
  { icon: Clock, eyebrow: "Time saved", value: "80+", unit: "hours / month", label: "Recovered every month across your team." },
  { icon: TrendingUp, eyebrow: "Revenue recovered", value: "₹10L–₹1Cr", unit: "per year", label: "Leakage plugged across orders, claims and ledgers." },
  { icon: LineChart, eyebrow: "Sales lift", value: "8–12%", unit: "uplift", label: "Same team, same dealers, sharper execution." },
  { icon: Wallet, eyebrow: "Overheads", value: "₹10K–₹20K", unit: "saved monthly", label: "Less spent outsourcing accounting work." },
];

/** Sample business: money collected per week across the first 12 weeks on Ledge, in ₹ lakh. */
const weeks = [3.1, 3.4, 3.2, 3.9, 4.2, 4.0, 4.6, 4.9, 5.1, 5.0, 5.6, 5.9].map((v, i) => ({
  key: `w${i + 1}`,
  label: `Week ${i + 1}`,
  axisLabel: `W${i + 1}`,
  value: v,
}));

export function Outcome() {
  return (
    <Section ground="light" labelledBy="outcome-title">
      <SectionHead
        num="03"
        eyebrow="Outcome"
        id="outcome-title"
        title="What changes in the first 90 days."
        lede="Live dashboard. Five reports ready instantly. Any report in 60 seconds. Full visibility - zero chasing."
      />

      <div className="lpx-grid lpx-grid-4">
        {outcomes.map((o, i) => (
          <Reveal key={o.eyebrow} delay={i * 0.06}>
            <div className="lpx-card lpx-card--hover">
              <div className="flex items-center gap-3">
                <span className="lpx-icon"><o.icon size={18} strokeWidth={1.75} /></span>
                <span className="text-[12px] font-semibold uppercase tracking-[0.14em] lpx-muted">{o.eyebrow}</span>
              </div>
              <div className="lpx-stat mt-8 text-[30px] md:text-[32px]">{o.value}</div>
              <div className="text-[14px] lpx-muted mt-1.5">{o.unit}</div>
              <p className="lpx-body mt-5 pt-5 border-t" style={{ borderColor: "hsl(var(--mono-line))" }}>{o.label}</p>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.1}>
        <div className="lpx-card mt-4 md:mt-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
            <span className="text-[12px] font-semibold uppercase tracking-[0.14em] lpx-muted">Sample business · money collected each week</span>
            <span className="text-[14px] font-semibold">Same factory. Same field. Better cash flow.</span>
          </div>
          <BarChart
            data={weeks}
            label="Money collected each week"
            period="the first 12 weeks"
            unit=" lakh"
            valueLabel="Total"
            averageLabel="Weekly average"
            categoryLabel="Week"
            height={200}
            formatValue={(v) => `₹${v.toFixed(1)}L`}
          />
        </div>
      </Reveal>
    </Section>
  );
}
