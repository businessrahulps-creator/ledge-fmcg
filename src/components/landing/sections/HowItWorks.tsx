import { Smartphone, LayoutDashboard, Truck } from "lucide-react";
import { AnimateIn } from "../AnimateIn";
import { BrowserFrame, PhoneFrame, GradientStage } from "../DeviceFrames";
import orderShot from "@/assets/order-shot.webp";
import dashboardShot from "@/assets/dashboard-shot.webp";
import stockShot from "@/assets/stock-shot.webp";

function OrderMockup() {
  return (
    <GradientStage variant="lavender">
      <PhoneFrame>
        <img src={orderShot} alt="New order creation form" className="w-full block" loading="lazy" />
      </PhoneFrame>
    </GradientStage>
  );
}

function DashboardMiniMockup() {
  return (
    <GradientStage variant="indigo">
      <BrowserFrame url="app.ledge.in/dashboard">
        <img src={dashboardShot} alt="Ledge dashboard with KPIs and analytics" className="w-full block" loading="lazy" />
      </BrowserFrame>
    </GradientStage>
  );
}

function StockMockup() {
  return (
    <GradientStage variant="emerald">
      <BrowserFrame url="app.ledge.in/stock">
        <img src={stockShot} alt="Stock inventory with product details" className="w-full block" loading="lazy" />
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
          <h2 className="font-heading font-bold text-[24px] md:text-[32px] text-[#1A1A1A] text-center mb-16 tracking-[-0.04em]">
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
                    <span className="bg-[#F0FDFA] text-[#0D9488] text-sm font-semibold px-3 py-1 rounded-full inline-flex items-center gap-2 mb-4">
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
