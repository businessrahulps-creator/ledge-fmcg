import { useRef, type ReactNode } from "react";
import { Contact, HeartPulse, Gift, Users, IndianRupee, RotateCcw, CheckCircle2, AlertCircle, Clock, ArrowUpRight, BadgeCheck, Wallet, TrendingUp } from "lucide-react";
import { AnimateIn, StaggerContainer, StaggerItem } from "../AnimateIn";
import { useTilt } from "@/lib/hooks/useTilt";

/** Tilts a tinted feature card 3D on pointer move. */
function TiltCard({ className, children }: { className: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useTilt(ref, { max: 5, scale: 1.01 });
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}


const features = [
  { icon: Contact, title: "Dealer Intelligence", desc: "Full history, credit and behaviour — instant. One profile per dealer." },
  { icon: HeartPulse, title: "Stock Health", desc: "Green, amber, red — per SKU, per godown. Before problems hit." },
  { icon: Gift, title: "Schemes & Targets", desc: "Auto-tracked. Always accurate. No more end-of-month surprises." },
  { icon: Users, title: "Team Performance", desc: "Every rep's orders and targets, live. Know who's performing — and why." },
  { icon: IndianRupee, title: "GST Automation", desc: "Invoices, estimates, credit notes — one tap. CGST, SGST, IGST done." },
  { icon: RotateCcw, title: "Returns & Claims", desc: "Handled cleanly. No arguments. Full paper trail, every time." },
];

/** Mini dealer roster — three rows with status pills */
function DealerPreview() {
  const rows = [
    { name: "Aryan Beverages", status: "Active", variant: "success" as const, icon: CheckCircle2 },
    { name: "Nova Retail Co.", status: "Slow", variant: "warn" as const, icon: Clock },
    { name: "Coastal Naturals", status: "At risk", variant: "neutral" as const, icon: AlertCircle },
  ];
  return (
    <div className="mt-5 space-y-2">
      {rows.map((r) => (
        <div
          key={r.name}
          className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-white/90 backdrop-blur-sm"
          style={{
            color: "hsl(var(--foreground))",
            boxShadow: "inset 0 1px 0 hsl(0 0% 100%), 0 1px 2px hsl(220 30% 15% / 0.05)",
          }}
        >
          <span className="font-body text-[13px] font-medium truncate" style={{ color: "hsl(var(--foreground))" }}>{r.name}</span>
          <span className={`lp-pill lp-pill--${r.variant}`} style={{ padding: "4px 9px 4px 4px", boxShadow: "none" }}>
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

/** Mini claim timeline — three status nodes */
function ClaimPreview() {
  const steps = [
    { label: "Submitted", variant: "info" as const, icon: ArrowUpRight },
    { label: "Approved", variant: "success" as const, icon: BadgeCheck },
    { label: "Paid", variant: "success" as const, icon: Wallet },
  ];
  return (
    <div className="mt-5">
      <div
        className="flex items-center justify-between gap-2 px-3 py-3 rounded-xl bg-white/85 backdrop-blur-sm"
        style={{ boxShadow: "inset 0 1px 0 hsl(0 0% 100%), 0 1px 2px hsl(220 30% 15% / 0.05)" }}
      >
        {steps.map((s, idx) => (
          <div key={s.label} className="flex items-center gap-2 flex-1">
            <span className={`lp-pill lp-pill--${s.variant}`} style={{ padding: "4px 9px 4px 4px", boxShadow: "none" }}>
              <span className="lp-pill__tile" style={{ width: 18, height: 18, borderRadius: 6 }}>
                <s.icon size={10} strokeWidth={2.5} />
              </span>
              <span className="lp-pill__label" style={{ fontSize: 11.5 }}>{s.label}</span>
            </span>
            {idx < steps.length - 1 && (
              <span className="flex-1 h-px bg-border" aria-hidden />
            )}
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between px-1">
        <span className="font-body text-[12px]" style={{ color: "hsl(var(--accent-foreground) / 0.78)" }}>Claim #4821</span>
        <span className="font-body text-[13px] font-semibold num-tabular" style={{ color: "hsl(var(--accent-foreground))" }}>₹38,400</span>
      </div>
    </div>
  );
}

/* Shared inset-card style for all mini-previews */
const insetCardStyle = {
  boxShadow: "inset 0 1px 0 hsl(0 0% 100%), 0 1px 2px hsl(220 30% 15% / 0.05)",
} as const;

/** Mini SKU stock list — green/amber/red status */
function StockHealthPreview() {
  const rows = [
    { sku: "Surf Excel 1kg", count: "48", label: "in stock", variant: "success" as const },
    { sku: "Maggi 70g", count: "12", label: "reorder", variant: "warn" as const },
    { sku: "Dabur Honey 250g", count: "0", label: "out", variant: "neutral" as const },
  ];
  const dotColor = { success: "hsl(var(--success))", warn: "hsl(var(--accent))", neutral: "hsl(var(--muted-foreground))" };
  return (
    <div className="mt-5 space-y-1.5">
      {rows.map((r) => (
        <div key={r.sku} className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-card" style={insetCardStyle}>
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="shrink-0 w-1.5 h-1.5 rounded-full" style={{ background: dotColor[r.variant] }} aria-hidden />
            <span className="font-body text-[13px] font-medium text-foreground truncate">{r.sku}</span>
          </div>
          <span className="font-body text-[11.5px] text-muted-foreground shrink-0">
            <span className="num-tabular font-semibold text-foreground">{r.count}</span> {r.label}
          </span>
        </div>
      ))}
    </div>
  );
}

/** Mini scheme tracker — title, progress bar, %/time */
function SchemePreview() {
  const pct = 62;
  return (
    <div className="mt-5 px-3.5 py-3 rounded-xl bg-card" style={insetCardStyle}>
      <div className="flex items-baseline justify-between mb-2">
        <span className="font-heading font-semibold text-[13px] text-foreground">Monsoon Scheme</span>
        <span className="font-body text-[11px] text-muted-foreground">Jul</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full bg-foreground/85" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="font-body text-[11.5px] text-muted-foreground">
          <span className="num-tabular font-semibold text-foreground">₹1.24L</span> / ₹2.00L
        </span>
        <span className="font-body text-[11.5px] num-tabular text-muted-foreground">{pct}% · 8d left</span>
      </div>
    </div>
  );
}

/** Top reps leaderboard — 3 rows with rank + orders */
function TeamPreview() {
  const reps = [
    { rank: 1, name: "Anjali R.", orders: 42, status: "On target", variant: "success" as const, icon: TrendingUp },
    { rank: 2, name: "Vikram S.", orders: 38, status: "On target", variant: "success" as const, icon: TrendingUp },
    { rank: 3, name: "Meera K.", orders: 24, status: "Catching up", variant: "warn" as const, icon: Clock },
  ];
  return (
    <div className="mt-5 space-y-1.5">
      {reps.map((r) => (
        <div key={r.rank} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-card" style={insetCardStyle}>
          <span className="font-heading font-semibold text-[14px] text-muted-foreground w-3 shrink-0 num-tabular">{r.rank}</span>
          <span className="font-body text-[13px] font-medium text-foreground flex-1 truncate">{r.name}</span>
          <span className="font-body text-[11.5px] num-tabular text-muted-foreground shrink-0">
            <span className="font-semibold text-foreground">{r.orders}</span> orders
          </span>
          <span className={`lp-pill lp-pill--${r.variant} shrink-0`} style={{ padding: "3px 8px 3px 3px", boxShadow: "none" }}>
            <span className="lp-pill__tile" style={{ width: 16, height: 16, borderRadius: 5 }}>
              <r.icon size={9} strokeWidth={2.5} />
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}

/** Mini GST invoice receipt */
function GstPreview() {
  return (
    <div className="mt-5 px-3.5 py-3 rounded-xl bg-card" style={insetCardStyle}>
      <div className="flex items-baseline justify-between mb-2 pb-2 border-b border-dashed border-border">
        <span className="font-heading font-semibold text-[12px] text-foreground tracking-tight">INV-2641</span>
        <span className="font-body text-[11px] text-muted-foreground">Aryan Beverages</span>
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between font-body text-[11.5px]">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="num-tabular text-foreground">₹42,500</span>
        </div>
        <div className="flex items-center justify-between font-body text-[11.5px]">
          <span className="text-muted-foreground">CGST 9%</span>
          <span className="num-tabular text-foreground">₹3,825</span>
        </div>
        <div className="flex items-center justify-between font-body text-[11.5px]">
          <span className="text-muted-foreground">SGST 9%</span>
          <span className="num-tabular text-foreground">₹3,825</span>
        </div>
      </div>
      <div className="mt-2 pt-2 border-t border-dashed border-border flex items-baseline justify-between">
        <span className="font-heading font-semibold text-[12px] text-foreground">Total</span>
        <span className="font-heading font-semibold text-[14px] num-tabular text-foreground">₹50,150</span>
      </div>
    </div>
  );
}

export function Features() {
  return (
    <section id="features" className="relative lp-section-paper py-24 md:py-32 lg:py-36 overflow-hidden">
      <div className="relative max-w-6xl mx-auto px-6 md:px-8 lg:px-10">
        <AnimateIn variant="blurFadeUp">
          <div className="text-center mb-16 md:mb-20 max-w-3xl mx-auto">
            <span className="lp-eyebrow">Features</span>
            <h2 className="font-heading font-semibold text-[30px] md:text-[40px] text-foreground tracking-[-0.022em] leading-[1.1] mt-6">
              Simple tools.
              <br />
              Extraordinary results.
            </h2>
          </div>
        </AnimateIn>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6 auto-rows-fr" staggerTime={0.05}>
          {features.map((feature, i) => {
            const isTinted = i === 0 || i === 5;
            const tint =
              i === 0 ? "lp-card-tinted lp-card-forest" :       // Dealer Intelligence → growth
              i === 5 ? "lp-card-tinted lp-card-terracotta" :   // Returns & Claims → recovery
              "lp-card lp-card-premium";
            const cardClass = `${tint} p-7 h-full flex flex-col`;
            const inner = (
              <>
                <div className="lp-icon-tile lp-icon-premium mb-5" style={{ width: 40, height: 40 }}>
                  <feature.icon size={20} strokeWidth={2} className="text-foreground icon-signal" />
                </div>
                <h3 className="font-heading font-semibold text-[17px] text-foreground mb-2 tracking-tight">
                  {feature.title}
                </h3>
                <p className="font-body text-[14px] text-muted-foreground leading-[1.55]">
                  {feature.desc}
                </p>
                {i === 0 && <DealerPreview />}
                {i === 1 && <StockHealthPreview />}
                {i === 2 && <SchemePreview />}
                {i === 3 && <TeamPreview />}
                {i === 4 && <GstPreview />}
                {i === 5 && <ClaimPreview />}
              </>
            );
            return (
              <StaggerItem key={feature.title}>
                {isTinted ? (
                  <TiltCard className={cardClass}>{inner}</TiltCard>
                ) : (
                  <div className={cardClass}>{inner}</div>
                )}
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </div>
    </section>
  );
}
