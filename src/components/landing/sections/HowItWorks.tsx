import { Smartphone, LayoutDashboard, Truck } from "lucide-react";
import { motion } from "framer-motion";
import { AnimateIn } from "../AnimateIn";
import { spring } from "@/lib/motion";
import stepOrders from "@/assets/landing/step-orders.webp";
import stepStock from "@/assets/landing/step-stock.webp";
import stepBilling from "@/assets/landing/step-billing.webp";

function ProductShot({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative">
      <div
        aria-hidden
        className="absolute -inset-6 rounded-md blur-3xl opacity-25 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% 50%, hsl(var(--accent) / 0.18) 0%, transparent 65%)" }}
      />
      <div className="relative lp-glass-frost p-2 md:p-3 rounded-md overflow-hidden">
        <img
          src={src}
          alt={alt}
          width={1280}
          height={896}
          loading="lazy"
          className="block w-full h-auto rounded-[4px]"
        />
      </div>
    </div>
  );
}

const steps = [
  {
    badge: "01",
    icon: Smartphone,
    title: "Field team places an order in 60 seconds.",
    description: "Pick dealer, add products, submit. Sequential order number, instantly.",
    image: stepOrders,
    alt: "Mobile order capture screen with auto-saved status and Save Order action",
    reversed: false,
  },
  {
    badge: "02",
    icon: LayoutDashboard,
    title: "Your stock health stays in the green.",
    description: "Per-SKU, per-godown health bars. Low stock surfaces before the dealer call.",
    image: stepStock,
    alt: "Stock health table with color-coded badges per SKU",
    reversed: true,
  },
  {
    badge: "03",
    icon: Truck,
    title: "Dispatch → stock deducts → GST invoice generates.",
    description: "One tap. Accountant skips Tally. CGST/SGST/IGST calculated automatically.",
    image: stepBilling,
    alt: "GST invoice page with itemized breakdown and Paid status",
    reversed: false,
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative bg-white py-20 md:py-28 overflow-hidden">
      <div className="relative max-w-6xl mx-auto px-6 md:px-8 lg:px-10">
        <AnimateIn variant="blurFadeUp">
          <div className="text-center mb-16 md:mb-20 max-w-3xl mx-auto">
            <span className="lp-eyebrow">How it works</span>
            <h2 className="font-heading font-semibold text-[30px] md:text-[40px] text-foreground tracking-[-0.022em] leading-[1.1] mt-6">
              Three things happen.
              <br />
              All in under 60 seconds.
            </h2>
          </div>
        </AnimateIn>

        <div className="relative space-y-24 md:space-y-28">
          {/* Vertical hairline connector — desktop only */}
          <div
            aria-hidden
            className="hidden lg:block absolute left-1/2 top-12 bottom-12 w-px -translate-x-1/2 pointer-events-none bg-border"
          />

          {steps.map((step, i) => (
            <AnimateIn key={step.badge} delay={i * 0.08}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                <div className={step.reversed ? "lg:order-2" : ""}>
                  <span className="inline-flex items-center gap-2.5 mb-5 group">
                    <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-[hsl(34_30%_90%)] border border-border lp-icon-premium">
                      <step.icon size={16} strokeWidth={2} className="text-foreground" />
                    </span>
                    <span className="font-heading font-semibold text-[12px] text-muted-foreground tracking-[0.18em]">
                      STEP {step.badge}
                    </span>
                  </span>
                  <h3 className="font-heading font-semibold text-[24px] md:text-[28px] text-foreground tracking-[-0.022em] leading-[1.18]">
                    {step.title}
                  </h3>
                  <p className="font-body text-[16px] text-muted-foreground leading-[1.55] mt-4 max-w-md">
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
                  <ProductShot src={step.image} alt={step.alt} />
                </motion.div>
              </div>
            </AnimateIn>
          ))}
        </div>
      </div>
    </section>
  );
}
