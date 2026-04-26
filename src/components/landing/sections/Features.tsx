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
    <section id="features" className="relative lp-mesh-light py-24 md:py-32 lg:py-36 overflow-hidden">
      <div className="absolute inset-0 lp-noise pointer-events-none" />
      <div className="relative max-w-6xl mx-auto px-6 md:px-8 lg:px-10">
        <AnimateIn variant="blurFadeUp">
          <div className="text-center mb-16 md:mb-20 max-w-3xl mx-auto">
            <span className="lp-eyebrow">Features</span>
            <h2 className="font-heading font-extrabold text-[30px] md:text-[44px] text-[#0A0F1C] tracking-[-0.035em] leading-[1.05] mt-6">
              Everything your business needs.
              <br />
              Nothing it doesn't.
            </h2>
          </div>
        </AnimateIn>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6" staggerTime={0.05}>
          {features.map((feature) => (
            <StaggerItem key={feature.title}>
              <div className="lp-card p-8 h-full flex flex-col">
                <div className="lp-icon-tile mb-6">
                  <feature.icon size={20} strokeWidth={1.75} className="text-[#6D28D9]" />
                </div>
                <h3 className="font-heading font-bold text-[18px] text-[#0A0F1C] mb-2 tracking-tight">
                  {feature.title}
                </h3>
                <p className="font-body text-[14.5px] text-[#64748B] leading-[1.55]">
                  {feature.desc}
                </p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
