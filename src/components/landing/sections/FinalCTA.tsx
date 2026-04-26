import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { spring } from "@/lib/motion";

const MotionLink = motion.create(Link);

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 20, filter: "blur(4px)" },
  whileInView: { opacity: 1, y: 0, filter: "blur(0px)" },
  viewport: { once: true, margin: "-80px" as const },
  transition: { ...spring.default as object, delay },
});

export function FinalCTA() {
  return (
    <section className="relative lp-mesh-dark py-28 md:py-36 overflow-hidden">
      <div className="absolute inset-0 lp-grid-soft-dark pointer-events-none" />
      <div className="absolute inset-0 lp-noise pointer-events-none opacity-30" />

      <div className="relative max-w-4xl mx-auto px-6 text-center">
        <motion.span
          className="lp-eyebrow-dark mb-6"
          {...fadeUp(0)}
        >
          Your business is ready
        </motion.span>

        <motion.h2
          className="font-heading font-extrabold text-[34px] md:text-[52px] text-white leading-[1.04] tracking-[-0.04em] mt-6"
          {...fadeUp(0.05)}
        >
          Ready to run your business
          <br />
          the way it deserves?
        </motion.h2>

        <motion.p
          className="font-body text-[17px] md:text-[19px] text-white/65 max-w-2xl mx-auto mt-7 leading-[1.55]"
          {...fadeUp(0.12)}
        >
          Start your 30-day free trial today. No card. No commitment.
          <br />
          Just clarity. From day one.
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mt-11"
          {...fadeUp(0.2)}
        >
          <MotionLink
            to="/signup"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            transition={spring.snappy}
            className="lp-btn-primary-light text-[#0A0F1C] px-9 py-3.5 rounded-full font-semibold transition-colors duration-200 inline-flex items-center justify-center text-[15px]"
          >
            Start 30-Day Free Trial
          </MotionLink>
          <motion.a
            href="https://wa.me/918138084689?text=Hi%20Asha%2C%20I%27d%20like%20to%20learn%20about%20Ledge"
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            transition={spring.snappy}
            className="border border-white/15 bg-white/[0.04] backdrop-blur-md text-white px-9 py-3.5 rounded-full font-semibold hover:border-white/30 hover:bg-white/[0.08] transition-colors duration-200 inline-flex items-center justify-center gap-2 text-[15px]"
          >
            <MessageCircle size={17} />
            Chat on WhatsApp
          </motion.a>
        </motion.div>

        <motion.p
          className="font-body text-[13px] text-white/45 mt-7"
          {...fadeUp(0.28)}
        >
          No card required · Cancel anytime · Built in India
        </motion.p>
      </div>
    </section>
  );
}
