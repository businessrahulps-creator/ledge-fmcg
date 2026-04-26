import { useRef } from "react";
import { motion } from "framer-motion";
import { spring, useParallaxY } from "@/lib/motion";
import { CapsuleCTA } from "../CapsuleCTA";

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 20, filter: "blur(4px)" },
  whileInView: { opacity: 1, y: 0, filter: "blur(0px)" },
  viewport: { once: true, margin: "-80px" as const },
  transition: { ...spring.default as object, delay },
});

export function FinalCTA() {
  const sectionRef = useRef<HTMLElement>(null);
  const gridY = useParallaxY(sectionRef, 30);

  return (
    <section ref={sectionRef} className="relative lp-mesh-dark py-28 md:py-36 lg:py-40 overflow-hidden">
      <motion.div style={{ y: gridY, willChange: "transform" }} className="absolute inset-0 lp-grid-soft pointer-events-none" />

      <div className="relative max-w-4xl mx-auto px-6 md:px-8 lg:px-10 text-center">
        <motion.div className="inline-flex justify-center mb-7" {...fadeUp(0)}>
          <span className="lp-glass-frost px-5 py-2.5 inline-flex items-center gap-2.5 text-[13px] font-medium text-[#475569] rounded-full">
            <span className="lp-live-dot" />
            Used by Indian businesses across 12 states
          </span>
        </motion.div>

        <motion.h2
          className="font-heading font-semibold text-[34px] md:text-[48px] text-[#0A0F1C] leading-[1.08] tracking-[-0.025em]"
          {...fadeUp(0.05)}
        >
          Ready to run your business
          <br />
          the way it deserves?
        </motion.h2>

        <motion.p
          className="font-body text-[17px] md:text-[19px] text-[#475569] max-w-2xl mx-auto mt-7 leading-[1.55]"
          {...fadeUp(0.12)}
        >
          Start your 30-day free trial today. No card. No commitment.
          <br />
          Just clarity. From day one.
        </motion.p>

        <motion.div
          className="flex flex-col items-center gap-4 mt-10"
          {...fadeUp(0.2)}
        >
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <CapsuleCTA to="/signup" variant="dark">Start 30-Day Free Trial</CapsuleCTA>
            <a
              href="https://wa.me/918138084689?text=Hi%20Asha%2C%20I%27d%20like%20to%20learn%20about%20Ledge"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-white border border-[#0A0F1C]/[0.08] hover:border-[#0A0F1C]/[0.18] shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_4px_12px_-6px_rgba(15,23,42,0.10)] transition-all"
              aria-label="Chat with Ledge sales on WhatsApp"
            >
              <WhatsAppIcon className="w-4 h-4 text-[#128C7E]" />
              <span className="font-body text-[14.5px] font-semibold text-[#0A0F1C]">
                Chat on WhatsApp
              </span>
            </a>
          </div>
        </motion.div>

        <motion.p
          className="font-body text-[13px] text-[#64748B] mt-8"
          {...fadeUp(0.28)}
        >
          No card required · Cancel anytime · Built in India
        </motion.p>
      </div>
    </section>
  );
}
