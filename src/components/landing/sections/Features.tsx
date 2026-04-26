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

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-5 lg:gap-6 auto-rows-fr" staggerTime={0.05}>
          {features.map((feature, i) => {
            const isHero = i === 0;
            // Bento spans: hero tile takes 3, others take 3/3/2/2/2 to make a balanced grid
            const spanClass = i === 0 ? "lg:col-span-3" : i <= 2 ? "lg:col-span-3" : "lg:col-span-2";
            return (
              <StaggerItem key={feature.title} className={spanClass}>
                {isHero ? (
                  <div className="lp-bento-hero p-8 h-full flex flex-col relative overflow-hidden">
                    <span className="lp-bento-numeral absolute top-5 right-6">[ 01 ]</span>
                    <div className="flex items-center gap-2 mb-5">
                      <span className="lp-live-dot" />
                      <span className="font-body text-[11px] uppercase tracking-[0.14em] text-[#3730A3] font-semibold">Live now</span>
                    </div>
                    <h3 className="font-heading font-semibold text-[20px] text-[#0A0F1C] mb-2 tracking-tight">
                      {feature.title}
                    </h3>
                    <p className="font-body text-[14.5px] text-[#475569] leading-[1.55] mb-6">
                      {feature.desc}
                    </p>
                    <div className="lp-glass-micro mt-auto p-5 grid grid-cols-3 gap-4">
                      <div>
                        <div className="font-heading font-semibold text-[20px] text-[#0A0F1C] tracking-tight leading-none">₹4.2L</div>
                        <div className="font-body text-[11px] text-[#64748B] mt-1.5 uppercase tracking-wider">Revenue today</div>
                      </div>
                      <div>
                        <div className="font-heading font-semibold text-[20px] text-[#0A0F1C] tracking-tight leading-none">28</div>
                        <div className="font-body text-[11px] text-[#64748B] mt-1.5 uppercase tracking-wider">Orders</div>
                      </div>
                      <div>
                        <div className="font-heading font-semibold text-[20px] text-[#0A0F1C] tracking-tight leading-none">12</div>
                        <div className="font-body text-[11px] text-[#64748B] mt-1.5 uppercase tracking-wider">Dispatched</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="lp-card p-8 h-full flex flex-col relative">
                    <span className="lp-bento-numeral absolute top-5 right-6">[ {String(i + 1).padStart(2, "0")} ]</span>
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
