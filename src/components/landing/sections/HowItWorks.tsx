import { Smartphone, LayoutDashboard, Truck } from "lucide-react";
import { motion } from "framer-motion";
import { AnimateIn } from "../AnimateIn";
import { spring } from "@/lib/motion";
import { BrowserFrame, PhoneFrame } from "../DeviceFrames";
import { OrderFormSvg, DashboardMiniSvg, InvoiceStockSvg } from "../illustrations/SvgIllustrations";

function CoolStage({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative rounded-3xl p-5 md:p-8"
      style={{
        background:
          "radial-gradient(ellipse at 30% 20%, rgba(124,58,237,0.10) 0%, transparent 55%), radial-gradient(ellipse at 70% 80%, rgba(37,99,235,0.08) 0%, transparent 55%), linear-gradient(135deg, #F5F6F8 0%, #FFFFFF 100%)",
      }}
    >
      {children}
    </div>
  );
}

const steps = [
  {
    badge: "01",
    icon: Smartphone,
    title: "Field team places an order in 60 seconds.",
    description: "Pick dealer, add products, submit. Sequential order number, instantly.",
    mockup: () => (
      <CoolStage>
        <PhoneFrame>
          <div className="p-3 bg-white">
            <OrderFormSvg />
          </div>
        </PhoneFrame>
      </CoolStage>
    ),
    reversed: false,
  },
  {
    badge: "02",
    icon: LayoutDashboard,
    title: "Your dashboard updates live.",
    description: "Revenue, dispatches, outstanding — moving in real time. No evening summary call.",
    mockup: () => (
      <CoolStage>
        <BrowserFrame url="app.ledge.in/dashboard">
          <div className="p-4 bg-white">
            <DashboardMiniSvg />
          </div>
        </BrowserFrame>
      </CoolStage>
    ),
    reversed: true,
  },
  {
    badge: "03",
    icon: Truck,
    title: "Dispatch → stock deducts → GST invoice generates.",
    description: "One tap. Accountant skips Tally. CGST/SGST/IGST calculated automatically.",
    mockup: () => (
      <CoolStage>
        <BrowserFrame url="app.ledge.in/stock">
          <div className="p-4 bg-white">
            <InvoiceStockSvg />
          </div>
        </BrowserFrame>
      </CoolStage>
    ),
    reversed: false,
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-white py-28 md:py-36">
      <div className="max-w-7xl mx-auto px-6">
        <AnimateIn variant="blurFadeUp">
          <div className="text-center mb-20 max-w-3xl mx-auto">
            <span className="inline-block font-body text-[12px] font-semibold tracking-[0.18em] text-[#2563EB] uppercase mb-4">
              How it works
            </span>
            <h2 className="font-heading font-extrabold text-[32px] md:text-[52px] text-[#0A0F1C] tracking-[-0.04em] leading-[1.05]">
              Three things happen.
              <br />
              All in under 60 seconds.
            </h2>
          </div>
        </AnimateIn>

        <div className="space-y-24 md:space-y-28">
          {steps.map((step, i) => {
            const MockupComponent = step.mockup;
            return (
              <AnimateIn key={step.badge} delay={i * 0.1}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                  <div className={step.reversed ? "lg:order-2" : ""}>
                    <span className="inline-flex items-center gap-2 font-heading font-bold text-[14px] brand-gradient-cool-text mb-5 tracking-wider">
                      <step.icon size={18} strokeWidth={1.75} className="text-[#7C3AED]" />
                      STEP {step.badge}
                    </span>
                    <h3 className="font-heading font-extrabold text-[26px] md:text-[36px] text-[#0A0F1C] tracking-[-0.035em] leading-[1.1]">
                      {step.title}
                    </h3>
                    <p className="font-body text-[17px] text-[#64748B] leading-[1.55] mt-5 max-w-md">
                      {step.description}
                    </p>
                  </div>
                  <motion.div
                    className={step.reversed ? "lg:order-1" : ""}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-80px" }}
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
