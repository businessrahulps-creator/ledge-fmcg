import { Fragment } from "react";
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowUpRight,
  BadgeCheck,
  Wallet,
  TrendingUp,
} from "lucide-react";

/* Shared chip styling for rows sitting inside a visual well */
const chip = {
  boxShadow: "inset 0 1px 0 hsl(0 0% 100%), 0 1px 2px hsl(220 30% 15% / 0.05)",
} as const;

const rowClass =
  "flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl bg-card";

/** Dealer roster — three dealers with health pills. */
export function DealerRosterVisual() {
  const rows = [
    { name: "Aryan Beverages", status: "Active", variant: "success" as const, icon: CheckCircle2 },
    { name: "Nova Retail Co.", status: "Slow", variant: "warn" as const, icon: Clock },
    { name: "Coastal Naturals", status: "At risk", variant: "neutral" as const, icon: AlertCircle },
  ];
  return (
    <div className="space-y-2 w-full">
      {rows.map((r) => (
        <div key={r.name} className={rowClass} style={chip}>
          <span className="font-body text-[13px] font-medium truncate text-foreground">
            {r.name}
          </span>
          <span
            className={`lp-pill lp-pill--${r.variant} shrink-0`}
            style={{ padding: "4px 9px 4px 4px", boxShadow: "none" }}
          >
            <span className="lp-pill__tile" style={{ width: 18, height: 18, borderRadius: 6 }}>
              <r.icon size={10} strokeWidth={2.5} />
            </span>
            <span className="lp-pill__label" style={{ fontSize: 11.5 }}>{r.status}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

/** Stock health — SKU rows with a traffic-light dot. */
export function StockHealthVisual() {
  const rows = [
    { sku: "Surf Excel 1kg", count: "48", label: "in stock", dot: "hsl(var(--success))" },
    { sku: "Maggi 70g", count: "12", label: "reorder", dot: "hsl(var(--accent))" },
    { sku: "Dabur Honey 250g", count: "0", label: "out", dot: "hsl(var(--muted-foreground))" },
  ];
  return (
    <div className="space-y-2 w-full">
      {rows.map((r) => (
        <div key={r.sku} className={rowClass} style={chip}>
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className="shrink-0 w-1.5 h-1.5 rounded-full"
              style={{ background: r.dot }}
              aria-hidden
            />
            <span className="font-body text-[13px] font-medium text-foreground truncate">
              {r.sku}
            </span>
          </div>
          <span className="font-body text-[11.5px] text-muted-foreground shrink-0">
            <span className="num-tabular font-semibold text-foreground">{r.count}</span> {r.label}
          </span>
        </div>
      ))}
    </div>
  );
}

/** Scheme progress arc + amounts. */
export function SchemeArcVisual() {
  const pct = 62;
  return (
    <div className="w-full flex flex-col items-center">
      <svg viewBox="0 0 120 68" className="w-[168px] h-auto" role="img" aria-label="Scheme progress 62 percent">
        <path
          d="M 12 60 A 48 48 0 0 1 108 60"
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth="9"
          strokeLinecap="round"
        />
        <path
          d="M 12 60 A 48 48 0 0 1 108 60"
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * (Math.PI * 48)} ${Math.PI * 48}`}
          style={{ opacity: 0.9 }}
        />
        <text
          x="60"
          y="56"
          textAnchor="middle"
          className="num-tabular"
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 22,
            fontWeight: 600,
            fill: "hsl(var(--foreground))",
          }}
        >
          {pct}%
        </text>
      </svg>
      <div className="mt-3 w-full flex items-center justify-between px-1">
        <span className="font-body text-[12px] text-muted-foreground">Monsoon Scheme</span>
        <span className="font-body text-[12px] num-tabular text-foreground font-semibold">
          ₹1.24L / ₹2.00L
        </span>
      </div>
    </div>
  );
}

/** Team performance — three reps as horizontal bars. */
export function TeamBarsVisual() {
  const reps = [
    { name: "Anjali R.", orders: 42, pct: 100 },
    { name: "Vikram S.", orders: 38, pct: 90 },
    { name: "Meera K.", orders: 24, pct: 57 },
  ];
  return (
    <div className="w-full space-y-3.5">
      {reps.map((r, i) => (
        <div key={r.name}>
          <div className="flex items-baseline justify-between mb-1.5">
            <span className="font-body text-[12.5px] font-medium text-foreground">{r.name}</span>
            <span className="font-body text-[11.5px] num-tabular text-muted-foreground">
              {r.orders} orders
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${r.pct}%`,
                background:
                  i === 2 ? "hsl(var(--accent))" : "hsl(var(--primary))",
                opacity: i === 2 ? 0.85 : 0.9 - i * 0.12,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/** GST invoice receipt. */
export function GstInvoiceVisual() {
  return (
    <div className="w-full px-3.5 py-3 rounded-xl bg-card" style={chip}>
      <div className="flex items-baseline justify-between mb-2 pb-2 border-b border-dashed border-border">
        <span className="font-heading font-semibold text-[12px] text-foreground tracking-tight">
          INV-2641
        </span>
        <span className="font-body text-[11px] text-muted-foreground">Aryan Beverages</span>
      </div>
      <div className="space-y-1">
        {[
          ["Subtotal", "₹42,500"],
          ["CGST 9%", "₹3,825"],
          ["SGST 9%", "₹3,825"],
        ].map(([k, v]) => (
          <div key={k} className="flex items-center justify-between font-body text-[11.5px]">
            <span className="text-muted-foreground">{k}</span>
            <span className="num-tabular text-foreground">{v}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 pt-2 border-t border-dashed border-border flex items-baseline justify-between">
        <span className="font-heading font-semibold text-[12px] text-foreground">Total</span>
        <span className="font-heading font-semibold text-[14px] num-tabular text-foreground">
          ₹50,150
        </span>
      </div>
    </div>
  );
}

/** Claim lifecycle — submitted → approved → paid. */
export function ClaimTimelineVisual() {
  const steps = [
    { label: "Submitted", variant: "info" as const, icon: ArrowUpRight },
    { label: "Approved", variant: "success" as const, icon: BadgeCheck },
    { label: "Paid", variant: "success" as const, icon: Wallet },
  ];
  return (
    <div className="w-full">
      <div
        className="flex items-center gap-1.5 px-2.5 py-3 rounded-xl bg-card"
        style={chip}
      >
        {steps.map((s, idx) => (
          <Fragment key={s.label}>
            <span
              className={`lp-pill lp-pill--${s.variant} shrink-0`}
              style={{ padding: "3px 8px 3px 3px", boxShadow: "none" }}
            >
              <span className="lp-pill__tile" style={{ width: 16, height: 16, borderRadius: 5 }}>
                <s.icon size={9} strokeWidth={2.5} />
              </span>
              <span className="lp-pill__label" style={{ fontSize: 11 }}>{s.label}</span>
            </span>
            {idx < steps.length - 1 && (
              <span className="flex-1 h-px bg-border min-w-[6px]" aria-hidden />
            )}
          </Fragment>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between px-1">
        <span className="font-body text-[12px] text-muted-foreground">Claim #4821</span>
        <span className="font-body text-[13px] font-semibold num-tabular text-foreground">
          ₹38,400
        </span>
      </div>
    </div>
  );
}

/** Revenue recovered — soft area chart with a highlighted last month. */
export function RevenueChartVisual() {
  const pts = [22, 30, 27, 38, 44, 41, 56, 62];
  const w = 260;
  const h = 96;
  const step = w / (pts.length - 1);
  const max = 70;
  const coords = pts.map((p, i) => [i * step, h - (p / max) * h]);
  const line = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const area = `${line} L ${w} ${h} L 0 ${h} Z`;
  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto" role="img" aria-label="Revenue recovered trend">
        <defs>
          <linearGradient id="lp-rev-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity="0.28" />
            <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#lp-rev-fill)" />
        <path d={line} fill="none" stroke="hsl(var(--success))" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={coords[coords.length - 1][0]} cy={coords[coords.length - 1][1]} r="4.5" fill="hsl(var(--success))" />
      </svg>
      <div className="mt-3 flex items-center justify-between px-1">
        <span className="font-body text-[12px] text-muted-foreground">Last 8 months</span>
        <span className="lp-pill lp-pill--success" style={{ padding: "3px 9px 3px 3px", boxShadow: "none" }}>
          <span className="lp-pill__tile" style={{ width: 16, height: 16, borderRadius: 5 }}>
            <TrendingUp size={9} strokeWidth={2.5} />
          </span>
          <span className="lp-pill__label" style={{ fontSize: 11 }}>↑ 18%</span>
        </span>
      </div>
    </div>
  );
}
