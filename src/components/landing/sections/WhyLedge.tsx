import { Smartphone, WifiOff, ShieldCheck, FileText, Sparkles, ArrowRight, Check, Download, Warehouse, CreditCard, Tag } from "lucide-react";
import { AnimateIn, StaggerContainer, StaggerItem } from "../AnimateIn";

const blocks = [
  { icon: Smartphone, title: "Mobile-first. Any phone.", content: "PWA. No app store. No IT team. Installs from a link in 90 seconds." },
  { icon: WifiOff, title: "Works when the network doesn't.", content: "Offline orders queue and sync the moment signal returns." },
  { icon: ShieldCheck, title: "Schemes, warehouses, credit control.", content: "The whole distribution layer — built in. Not bolted on." },
  { icon: FileText, title: "Basics in 30 minutes. No trainer.", content: "Your team is live by lunch. No desktop. No IT. No excuses." },
];

const legacy = ["Tally", "Zoho Books", "Vyapar", "Khatabook"];

const insetCardStyle = {
  boxShadow: "inset 0 1px 0 hsl(0 0% 100%), 0 1px 2px hsl(220 30% 15% / 0.05)",
} as const;

function InstallPreview() {
  return (
    <div className="mt-auto pt-6">
      <div className="px-3.5 py-3 rounded-xl bg-card" style={insetCardStyle}>
        <div className="flex items-center gap-2.5 mb-2">
          <span className="w-7 h-7 rounded-md bg-foreground/[0.06] flex items-center justify-center shrink-0">
            <Download size={13} strokeWidth={2} className="text-foreground" />
          </span>
          <div className="flex-1 min-w-0">
            <div className="font-body text-[12.5px] font-semibold text-foreground truncate">Install Ledge</div>
            <div className="font-body text-[10.5px] text-muted-foreground num-tabular">12 MB · ~90 sec</div>
          </div>
        </div>
        <div className="h-1 rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full bg-foreground/85" style={{ width: "78%" }} />
        </div>
      </div>
    </div>
  );
}

function ModulesPreview() {
  const modules = [
    { icon: Tag, label: "Schemes" },
    { icon: Warehouse, label: "Warehouses" },
    { icon: CreditCard, label: "Credit limits" },
  ];
  return (
    <div className="mt-auto pt-6 space-y-1.5">
      {modules.map((m) => (
        <div key={m.label} className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-card" style={insetCardStyle}>
          <span className="w-6 h-6 rounded-md bg-foreground/[0.06] flex items-center justify-center shrink-0">
            <m.icon size={11} strokeWidth={2} className="text-foreground" />
          </span>
          <span className="font-body text-[12.5px] font-medium text-foreground flex-1">{m.label}</span>
          <Check size={12} strokeWidth={2.5} className="text-success shrink-0" />
        </div>
      ))}
    </div>
  );
}

function OnboardPreview() {
  const steps = [
    { label: "Sign up", time: "2 min" },
    { label: "Add your team", time: "8 min" },
    { label: "First order", time: "by lunch" },
  ];
  return (
    <div className="mt-auto pt-6">
      <div className="px-3.5 py-3 rounded-xl bg-card" style={insetCardStyle}>
        <div className="relative">
          <span className="absolute left-[5px] top-2 bottom-2 w-px bg-border" aria-hidden />
          <div className="space-y-2.5">
            {steps.map((s) => (
              <div key={s.label} className="flex items-center gap-3 relative">
                <span className="w-[11px] h-[11px] rounded-full bg-foreground/85 ring-2 ring-card shrink-0 relative z-10" aria-hidden />
                <span className="font-body text-[12.5px] font-medium text-foreground flex-1">{s.label}</span>
                <span className="font-body text-[11px] num-tabular text-muted-foreground">{s.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const blockPreviews: Array<(() => JSX.Element) | null> = [InstallPreview, null, ModulesPreview, OnboardPreview];

export function WhyLedge() {
  return (
    <section className="bg-white py-20 md:py-28">
      <div className="max-w-6xl mx-auto px-6 md:px-8 lg:px-10">
        <AnimateIn variant="blurFadeUp">
          <div className="text-center mb-16 md:mb-20 max-w-3xl mx-auto">
            <span className="lp-eyebrow">Built different</span>
            <h2 className="font-heading font-semibold text-[30px] md:text-[40px] text-foreground tracking-[-0.022em] leading-[1.1] mt-6">
              Every tool exists.
              <br />
              None built for you.
            </h2>
          </div>
        </AnimateIn>

        {/* Legacy comparison row — pill chips */}
        <AnimateIn delay={0.1}>
          <div className="flex flex-wrap items-center justify-center gap-2.5 mb-14 md:mb-16">
            {legacy.map((name) => (
              <span
                key={name}
                className="font-body text-[13px] font-medium text-muted-foreground/70 line-through decoration-muted-foreground/40 px-3.5 py-1.5 rounded-full bg-muted border border-border"
              >
                {name}
              </span>
            ))}
            <span className="font-heading font-semibold text-[14px] text-primary-foreground px-4 py-1.5 rounded-full bg-primary">
              Ledge
            </span>
          </div>
        </AnimateIn>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6" staggerTime={0.05}>
          {blocks.map((block, i) => {
            const isHero = i === 1; // "Works when the network doesn't" → Midnight
            return (
              <StaggerItem key={block.title}>
                <div className={`${isHero ? "lp-card-tinted lp-card-midnight" : "lp-card lp-card-premium"} p-7 h-full flex flex-col relative`}>
                  {isHero && (
                    <div className="flex justify-end mb-5">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-accent bg-white/10 px-2.5 py-1 rounded-full border border-white/20">
                        <span className="lp-live-dot" /> Offline-ready
                      </span>
                    </div>
                  )}
                  <h3 className="font-heading font-semibold text-[17px] text-foreground mb-2 tracking-tight leading-snug">
                    {block.title}
                  </h3>
                  <p className="font-body text-[14px] text-muted-foreground leading-[1.55]">
                    {block.content}
                  </p>
                  {isHero ? (
                    <div className="lp-insight lp-insight--on-dark mt-5">
                      <div className="lp-insight__header">
                        <Sparkles size={13} strokeWidth={2} />
                        Field signal
                      </div>
                      <p className="lp-insight__body">
                        3 orders queued in Wayanad. Will sync the moment signal returns.
                      </p>
                      <span className="lp-insight__link">
                        See queue <ArrowRight size={12} strokeWidth={2.5} />
                      </span>
                    </div>
                  ) : (
                    (() => {
                      const Preview = blockPreviews[i];
                      return Preview ? <Preview /> : null;
                    })()
                  )}
                </div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </div>
    </section>
  );
}
