import { useRef } from "react";
import { motion } from "framer-motion";
import { spring, useParallaxY } from "@/lib/motion";
import { CapsuleCTA } from "../CapsuleCTA";
import { CursorAura } from "../CursorAura";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";

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
    <section ref={sectionRef} className="relative lp-block-ink lp-block-graphite py-20 md:py-28 overflow-hidden">
      <motion.div style={{ y: gridY, willChange: "transform" }} className="absolute inset-0 lp-grid-soft pointer-events-none" />
      {/* Motion v3 — the one ambient pointer layer outside the hero. */}
      <CursorAura tint="hsl(var(--accent) / 0.12)" size={560} />

      <div className="relative max-w-4xl mx-auto px-6 md:px-8 lg:px-10 text-center">
        <motion.div className="inline-flex justify-center mb-7" {...fadeUp(0)}>
          <span className="lp-glass-frost px-5 py-2.5 inline-flex items-center gap-2.5 text-[13px] font-medium text-muted-foreground rounded-full">
            <span className="lp-live-dot" />
            Used by Indian businesses across 12 states
          </span>
        </motion.div>

        <motion.h2
          className="font-heading font-semibold text-[34px] md:text-[48px] text-foreground leading-[1.08] tracking-[-0.025em]"
          {...fadeUp(0.05)}
        >
          One app. Every role.
          <br />
          Total clarity.
        </motion.h2>

        <motion.p
          className="font-body text-[17px] md:text-[19px] text-muted-foreground max-w-2xl mx-auto mt-7 leading-[1.55]"
          {...fadeUp(0.12)}
        >
          Start free for 30 days. No card needed. Setup in 30 minutes.
          <br />
          Owner, manager, accountant, salesperson — one screen, one truth.
        </motion.p>

        <motion.div
          className="flex flex-col items-center gap-4 mt-10"
          {...fadeUp(0.2)}
        >
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <CapsuleCTA to="/signup" variant="dark">Start Free Trial</CapsuleCTA>
            <a
              href="https://wa.me/918138084689?text=Hi%20Asha%2C%20I%27d%20like%20to%20learn%20about%20Ledge"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-card border border-border hover:border-primary/30 shadow-depth-2 transition-all"
              aria-label="Chat with Ledge sales on WhatsApp"
            >
              <WhatsAppIcon className="w-4 h-4 text-[#128C7E]" />
              <span className="font-body text-[14.5px] font-semibold text-foreground">
                Chat on WhatsApp
              </span>
            </a>
          </div>
        </motion.div>

        <motion.p
          className="font-body text-[13px] text-muted-foreground mt-8"
          {...fadeUp(0.28)}
        >
          No card required · Cancel anytime · Built in Kerala
        </motion.p>
      </div>
    </section>
  );
}
