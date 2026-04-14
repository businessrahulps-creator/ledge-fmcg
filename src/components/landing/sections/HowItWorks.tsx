import { Smartphone, LayoutDashboard, Truck } from "lucide-react";
import { AnimateIn } from "../AnimateIn";
import { BrowserFrame, PhoneFrame, GradientStage } from "../DeviceFrames";
import { OrderFormSvg, DashboardMiniSvg, InvoiceStockSvg } from "../illustrations/SvgIllustrations";

function OrderMockup() {
  return (
    <GradientStage variant="lavender">
      <PhoneFrame>
        <div className="p-3 bg-white">
          <OrderFormSvg />
        </div>
      </PhoneFrame>
    </GradientStage>
  );
}

function DashboardMiniMockup() {
  return (
    <GradientStage variant="indigo">
      <BrowserFrame url="app.ledge.in/dashboard">
        <div className="p-4 bg-white">
          <DashboardMiniSvg />
        </div>
      </BrowserFrame>
    </GradientStage>
  );
}

function StockMockup() {
  return (
    <GradientStage variant="emerald">
      <BrowserFrame url="app.ledge.in/stock">
        <div className="p-4 bg-white">
          <InvoiceStockSvg />
        </div>
      </BrowserFrame>
    </GradientStage>
  );
}

const steps = [
  {
    badge: "01",
    icon: Smartphone,
    title: "Your field team places an order from their phone. In under a minute.",
    description:
      "They open Ledge - no app store, no download, just a link they installed to their home screen. They select the dealer, add the products, apply any active scheme, set the payment mode. Done. The order gets a sequential number the moment it's submitted. Nothing falls through.",
    mockup: OrderMockup,
    reversed: false,
  },
  {
    badge: "02",
    icon: LayoutDashboard,
    title: "You see it on your dashboard immediately.",
    description:
      "The order is live. Revenue updates. Pending dispatch count moves. You're not waiting for an evening summary - you're watching your business happen, the way you'd watch a bank balance. Every order, every salesperson, every dealer. Right there.",
    mockup: DashboardMiniMockup,
    reversed: true,
  },
  {
    badge: "03",
    icon: Truck,
    title: "Your ops team dispatches, stocks adjust, invoices generate - automatically.",
    description:
      "When dispatch is marked, inventory deducts from the right godown. The invoice builds itself from the order - CGST, SGST, or IGST calculated based on state codes. Your accountant generates a GST-compliant PDF without touching a calculator. No double entry. No reconciliation ritual.",
    mockup: StockMockup,
    reversed: false,
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-white py-28 md:py-36">
      <div className="max-w-7xl mx-auto px-6">
        <AnimateIn>
          <h2 className="font-heading font-bold text-[24px] md:text-[34px] text-[#1A1A1A] text-center mb-16 tracking-[-0.04em]">
            Three things happen when your team uses Ledge. All of them in under sixty seconds.
          </h2>
        </AnimateIn>

        <div className="space-y-28">
          {steps.map((step, i) => {
            const MockupComponent = step.mockup;
            return (
              <AnimateIn key={step.badge} delay={i * 0.1}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                  <div className={step.reversed ? "lg:order-2" : ""}>
                    <span className="bg-[#F4F4F5] text-[#27272A] text-sm font-semibold px-3 py-1 rounded-full inline-flex items-center gap-2 mb-4">
                      <step.icon size={16} strokeWidth={1.5} />
                      {step.badge}
                    </span>
                    <h3 className="font-heading font-bold text-[20px] md:text-[24px] text-[#1A1A1A]">
                      {step.title}
                    </h3>
                    <p className="font-body text-[15px] text-[#52525B] leading-[1.7] mt-4">
                      {step.description}
                    </p>
                  </div>
                  <div className={step.reversed ? "lg:order-1" : ""}>
                    <MockupComponent />
                  </div>
                </div>
              </AnimateIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}
