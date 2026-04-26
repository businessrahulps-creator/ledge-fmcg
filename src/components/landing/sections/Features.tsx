import { LayoutDashboard, Route, Contact, Warehouse, IndianRupee, Layers } from "lucide-react";
import { AnimateIn, StaggerContainer, StaggerItem } from "../AnimateIn";

const features = [
  { icon: LayoutDashboard, title: "Live business dashboard", desc: "Today's revenue, orders, dispatches. The moment you log in." },
  { icon: Route, title: "Order lifecycle, tracked", desc: "Pending → Dispatched → Delivered. Every step logged." },
  { icon: Contact, title: "Dealer intelligence", desc: "Lifetime value, outstanding, full history. One profile." },
  { icon: Warehouse, title: "Stock health alerts", desc: "Green, amber, red. Per SKU, per godown. Never face a stockout." },
  { icon: IndianRupee, title: "Payments tracked properly", desc: "Cash, UPI, cheque, bank. All reconciled in one place." },
  { icon: Layers, title: "Schemes, targets, claims", desc: "The whole ops layer. Not just orders." },
];

export function Features() {
  return (
    <section id="features" className="relative lp-section-paper py-24 md:py-32 lg:py-36 overflow-hidden">
      <div className="relative max-w-6xl mx-auto px-6 md:px-8 lg:px-10">
        <AnimateIn variant="blurFadeUp">
          <div className="text-center mb-16 md:mb-20 max-w-3xl mx-auto">
            <span className="lp-eyebrow">Features</span>
            <h2 className="font-heading font-semibold text-[30px] md:text-[40px] text-[#0A0F1C] tracking-[-0.022em] leading-[1.1] mt-6">
              Everything your business needs.
              <br />
              Nothing it doesn't.
            </h2>
          </div>
        </AnimateIn>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6 auto-rows-fr" staggerTime={0.05}>
          {features.map((feature, i) => {
            const isHero = i === 0;
            return (
              <StaggerItem key={feature.title}>
                {isHero ? (
                  <div className="lp-bento-hero p-7 h-full flex flex-col">
                    <div className="flex items-center gap-2 mb-5">
                      <span className="lp-live-dot" />
                      <span className="font-body text-[11px] uppercase tracking-[0.14em] text-[#3730A3] font-semibold">Live now</span>
                    </div>
                    <h3 className="font-heading font-semibold text-[17px] text-[#0A0F1C] mb-2 tracking-tight">
                      {feature.title}
                    </h3>
                    <p className="font-body text-[14px] text-[#475569] leading-[1.55]">
                      {feature.desc}
                    </p>
                    <div className="mt-auto pt-6">
                      <p className="font-body text-[12.5px] text-[#3B3F66] tracking-tight">
                        <span className="font-heading font-semibold text-[#0A0F1C]">₹4.2L</span> revenue today
                        <span className="text-[#94A3B8] mx-1.5">·</span>
                        <span className="font-heading font-semibold text-[#0A0F1C]">28</span> orders
                        <span className="text-[#94A3B8] mx-1.5">·</span>
                        <span className="font-heading font-semibold text-[#0A0F1C]">12</span> dispatched
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="lp-card p-7 h-full flex flex-col">
                    <div className="lp-icon-tile mb-5" style={{ width: 36, height: 36 }}>
                      <feature.icon size={17} strokeWidth={1.75} className="text-[#1F2937]" />
                    </div>
                    <h3 className="font-heading font-semibold text-[17px] text-[#0A0F1C] mb-2 tracking-tight">
                      {feature.title}
                    </h3>
                    <p className="font-body text-[14px] text-[#64748B] leading-[1.55]">
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
