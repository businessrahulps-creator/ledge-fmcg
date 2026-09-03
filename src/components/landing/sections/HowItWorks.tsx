import { Smartphone, LayoutDashboard, Truck } from "lucide-react";
import { motion } from "framer-motion";
import { AnimateIn } from "../AnimateIn";
import { ease, duration } from "@/lib/motion";
import {
  OrderBuildVisual,
  StockHealthVisual,
  DispatchInvoiceVisual,
} from "../visuals/StepMicroVisuals";

const steps = [
  {
    badge: "01",
    icon: Smartphone,
    title: "Field team places an order in 60 seconds.",
    description: "Pick dealer, add products, submit. Sequential order number, instantly.",
    Visual: OrderBuildVisual,
  },
  {
    badge: "02",
    icon: LayoutDashboard,
    title: "Your stock health stays in the green.",
    description: "Per-SKU, per-godown health bars. Low stock surfaces before the dealer call.",
    Visual: StockHealthVisual,
  },
  {
    badge: "03",
    icon: Truck,
    title: "Dispatch → stock deducts → GST invoice generates.",
    description: "One tap. Accountant skips Tally. CGST/SGST/IGST calculated automatically.",
    Visual: DispatchInvoiceVisual,
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative bg-white py-20 md:py-28 overflow-hidden">
      <div className="relative max-w-6xl mx-auto px-6 md:px-8 lg:px-10">
        <AnimateIn variant="blurFadeUp">
          <div className="text-center mb-14 md:mb-16 max-w-3xl mx-auto">
            <span className="lp-eyebrow">How it works</span>
            <h2 className="font-heading font-semibold text-[30px] md:text-[40px] text-foreground tracking-[-0.022em] leading-[1.1] mt-6">
              Three things happen.
              <br />
              All in under 60 seconds.
            </h2>
          </div>
        </AnimateIn>

        <div className="relative">
          {/* Progress rail — horizontal on desktop, vertical on mobile.
              The one Electric accent this section gets. */}
          <div
            aria-hidden
            className="pointer-events-none hidden md:block absolute left-0 right-0 top-[22px] h-px bg-border"
          >
            <motion.div
              className="h-px w-full bg-primary origin-left"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: duration.hero, ease: ease.emphasized }}
            />
          </div>
          <div
            aria-hidden
            className="pointer-events-none md:hidden absolute left-[21px] top-0 bottom-0 w-px bg-border"
          >
            <motion.div
              className="w-px h-full bg-primary origin-top"
              initial={{ scaleY: 0 }}
              whileInView={{ scaleY: 1 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: duration.hero, ease: ease.emphasized }}
            />
          </div>


          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8 lg:gap-10">
            {steps.map((step, i) => (
              <motion.div
                key={step.badge}
                className="relative pl-14 md:pl-0"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{
                  duration: duration.medium,
                  ease: ease.decelerate,
                  delay: 0.12 + i * 0.12,
                }}
              >
                {/* Node */}
                <div className="absolute left-0 top-0 md:relative md:mb-6">
                  <motion.span
                    className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-secondary border border-border text-foreground"
                    initial={{ scale: 0.85, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{
                      duration: duration.short,
                      ease: ease.emphasized,
                      delay: 0.18 + i * 0.12,
                    }}
                  >
                    <step.icon size={17} strokeWidth={2} />
                  </motion.span>
                </div>

                <span className="font-heading font-semibold text-[11.5px] text-muted-foreground tracking-[0.18em] block">
                  STEP {step.badge}
                </span>
                <h3 className="font-heading font-semibold text-[20px] md:text-[22px] text-foreground tracking-[-0.02em] leading-[1.22] mt-2.5">
                  {step.title}
                </h3>
                <p className="font-body text-[14.5px] text-muted-foreground leading-[1.55] mt-2.5">
                  {step.description}
                </p>

                <div className="mt-6">
                  <step.Visual />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
