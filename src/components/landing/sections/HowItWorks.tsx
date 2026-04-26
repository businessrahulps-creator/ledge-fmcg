import { Smartphone, LayoutDashboard, Truck } from "lucide-react";
import { motion } from "framer-motion";
import { AnimateIn } from "../AnimateIn";
import { spring } from "@/lib/motion";
import { BrowserFrame, PhoneFrame } from "../DeviceFrames";
import { OrderFormSvg, DashboardMiniSvg, InvoiceStockSvg } from "../illustrations/SvgIllustrations";

function PremiumStage({ children }: { children: React.ReactNode; accent?: "violet" | "indigo" | "blue" }) {
  return (
    <div className="relative">
      <div
        aria-hidden
        className="absolute -inset-6 rounded-[2.5rem] blur-3xl opacity-30 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(15,23,42,0.16) 0%, transparent 65%)" }}
      />
      <div className="relative lp-card-glass p-4 md:p-6 rounded-[1.75rem]">
        {children}
      </div>
    </div>
  );
}

const steps = [
  {
    badge: "01",
    icon: Smartphone,
    accent: "violet" as const,
    title: "Field team places an order in 60 seconds.",
    description: "Pick dealer, add products, submit. Sequential order number, instantly.",
    mockup: () => (
      <PremiumStage accent="violet">
        <PhoneFrame>
          <div className="p-3 bg-white">
            <OrderFormSvg />
          </div>
        </PhoneFrame>
      </PremiumStage>
    ),
    reversed: false,
  },
  {
    badge: "02",
    icon: LayoutDashboard,
    accent: "indigo" as const,
    title: "Your dashboard updates live.",
    description: "Revenue, dispatches, outstanding. Moving in real time. No evening summary call.",
    mockup: () => (
      <PremiumStage accent="indigo">
        <BrowserFrame url="app.ledge.in/dashboard">
          <div className="p-4 bg-white">
            <DashboardMiniSvg />
          </div>
        </BrowserFrame>
      </PremiumStage>
    ),
    reversed: true,
  },
  {
    badge: "03",
    icon: Truck,
    accent: "blue" as const,
    title: "Dispatch → stock deducts → GST invoice generates.",
    description: "One tap. Accountant skips Tally. CGST/SGST/IGST calculated automatically.",
    mockup: () => (
      <PremiumStage accent="blue">
        <BrowserFrame url="app.ledge.in/stock">
          <div className="p-4 bg-white">
            <InvoiceStockSvg />
          </div>
        </BrowserFrame>
      </PremiumStage>
    ),
    reversed: false,
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative bg-white py-24 md:py-32 lg:py-36 overflow-hidden">
      <div className="relative max-w-6xl mx-auto px-6 md:px-8 lg:px-10">
        <AnimateIn variant="blurFadeUp">
          <div className="text-center mb-16 md:mb-20 max-w-3xl mx-auto">
            <span className="lp-eyebrow">How it works</span>
            <h2 className="font-heading font-extrabold text-[30px] md:text-[44px] text-[#0A0F1C] tracking-[-0.035em] leading-[1.05] mt-6">
              Three things happen.
              <br />
              All in under 60 seconds.
            </h2>
          </div>
        </AnimateIn>

        <div className="relative space-y-24 md:space-y-28">
          {/* Vertical gradient connector — desktop only */}
          <div
            aria-hidden
            className="hidden lg:block absolute left-1/2 top-12 bottom-12 w-px -translate-x-1/2 pointer-events-none"
            style={{
              background:
                "linear-gradient(to bottom, transparent 0%, rgba(124,58,237,0.25) 15%, rgba(79,70,229,0.25) 50%, rgba(37,99,235,0.25) 85%, transparent 100%)",
            }}
          />

          {steps.map((step, i) => {
            const MockupComponent = step.mockup;
            return (
              <AnimateIn key={step.badge} delay={i * 0.08}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                  <div className={step.reversed ? "lg:order-2" : ""}>
                    <span className="inline-flex items-center gap-2.5 mb-5">
                      <span className="relative inline-flex items-center justify-center w-9 h-9 rounded-full bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_4px_12px_-2px_rgba(124,58,237,0.25)]"
                        style={{
                          backgroundImage: "linear-gradient(white, white), linear-gradient(135deg, #7C3AED 0%, #2563EB 100%)",
                          backgroundOrigin: "border-box",
                          backgroundClip: "padding-box, border-box",
                          border: "1px solid transparent",
                        }}
                      >
                        <step.icon size={16} strokeWidth={2} className="text-[#6D28D9]" />
                      </span>
                      <span className="font-heading font-bold text-[12px] lp-gradient-text-cool tracking-[0.18em]">
                        STEP {step.badge}
                      </span>
                    </span>
                    <h3 className="font-heading font-extrabold text-[24px] md:text-[30px] text-[#0A0F1C] tracking-[-0.03em] leading-[1.15]">
                      {step.title}
                    </h3>
                    <p className="font-body text-[16px] text-[#64748B] leading-[1.55] mt-4 max-w-md">
                      {step.description}
                    </p>
                  </div>
                  <motion.div
                    className={step.reversed ? "lg:order-1" : ""}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-120px" }}
                    transition={spring.gentle}
                  >
                    <MockupComponent />
                  </motion.div>
                </div>
              </AnimateIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}
