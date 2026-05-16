import { Contact, HeartPulse, Gift, Users, IndianRupee, RotateCcw } from "lucide-react";
import { AnimateIn, StaggerContainer, StaggerItem } from "../AnimateIn";

const features = [
  { icon: Contact, title: "Dealer Intelligence", desc: "Full history, credit and behaviour — instant. One profile per dealer." },
  { icon: HeartPulse, title: "Stock Health", desc: "Green, amber, red — per SKU, per godown. Before problems hit." },
  { icon: Gift, title: "Schemes & Targets", desc: "Auto-tracked. Always accurate. No more end-of-month surprises." },
  { icon: Users, title: "Team Performance", desc: "Every rep's orders and targets, live. Know who's performing — and why." },
  { icon: IndianRupee, title: "GST Automation", desc: "Invoices, estimates, credit notes — one tap. CGST, SGST, IGST done." },
  { icon: RotateCcw, title: "Returns & Claims", desc: "Handled cleanly. No arguments. Full paper trail, every time." },
];

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
            const isHero = i === 0;
            return (
              <StaggerItem key={feature.title}>
                {isHero ? (
                  <div className="lp-bento-hero lp-card-premium p-7 h-full flex flex-col">
                    <div className="flex items-center gap-2 mb-5">
                      <span className="lp-live-dot" />
                      <span className="font-body text-[11px] uppercase tracking-[0.14em] text-accent font-semibold">Live now</span>
                    </div>
                    <h3 className="font-heading font-semibold text-[17px] text-foreground mb-2 tracking-tight">
                      {feature.title}
                    </h3>
                    <p className="font-body text-[14px] text-muted-foreground leading-[1.55]">
                      {feature.desc}
                    </p>
                    <div className="mt-auto pt-6">
                      <p className="font-body text-[12.5px] text-muted-foreground tracking-tight">
                        <span className="font-heading font-semibold text-foreground">Lifetime value</span>
                        <span className="text-[hsl(var(--muted-foreground)/0.7)] mx-1.5">·</span>
                        <span className="font-heading font-semibold text-foreground">Credit days</span>
                        <span className="text-[hsl(var(--muted-foreground)/0.7)] mx-1.5">·</span>
                        <span className="font-heading font-semibold text-foreground">Full history</span>
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="lp-card lp-card-premium p-7 h-full flex flex-col">
                    <div className="lp-icon-tile lp-icon-premium mb-5" style={{ width: 40, height: 40 }}>
                      <feature.icon size={20} strokeWidth={2} className="text-foreground icon-signal" />
                    </div>
                    <h3 className="font-heading font-semibold text-[17px] text-foreground mb-2 tracking-tight">
                      {feature.title}
                    </h3>
                    <p className="font-body text-[14px] text-muted-foreground leading-[1.55]">
                      {feature.desc}
                    </p>
                  </div>
                )}
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </div>
    </section>
  );
}
