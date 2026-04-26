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
    <section className="relative bg-[#0A0F1C] py-32 md:py-44 overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 30%, rgba(124,58,237,0.22) 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 80% 80%, rgba(37,99,235,0.20) 0%, transparent 60%)",
        }}
      />

      <div className="relative max-w-4xl mx-auto px-6 text-center">
        <motion.span
          className="inline-block font-body text-[12px] font-semibold tracking-[0.18em] brand-gradient-cool-text uppercase mb-6"
          {...fadeUp(0)}
        >
          Your business is ready
        </motion.span>

        <motion.h2
          className="font-heading font-extrabold text-[36px] md:text-[64px] text-white leading-[1.04] tracking-[-0.045em]"
          {...fadeUp(0.05)}
        >
          Ready to run your business
          <br />
          the way it deserves?
        </motion.h2>

        <motion.p
          className="font-body text-[18px] md:text-[22px] text-white/70 max-w-2xl mx-auto mt-8 leading-[1.5]"
          {...fadeUp(0.12)}
        >
          Start your 30-day free trial today. No card. No commitment.
          <br />
          Just clarity — from day one.
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mt-12"
          {...fadeUp(0.2)}
        >
          <MotionLink
            to="/signup"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            transition={spring.snappy}
            className="bg-white text-[#0A0F1C] px-10 py-4 rounded-full font-semibold hover:bg-[#F5F6F8] transition-colors duration-200 inline-flex items-center justify-center text-base"
            style={{ boxShadow: "0 8px 24px -8px rgba(255,255,255,0.3), 0 2px 6px rgba(0,0,0,0.2)" }}
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
            className="border border-white/25 text-white px-10 py-4 rounded-full font-semibold hover:border-white/60 hover:bg-white/5 transition-colors duration-200 inline-flex items-center justify-center gap-2 text-base"
          >
            <MessageCircle size={18} />
            Chat on WhatsApp
          </motion.a>
        </motion.div>

        <motion.p
          className="font-body text-sm text-white/50 mt-7"
          {...fadeUp(0.28)}
        >
          No card required · Cancel anytime · Built in India
        </motion.p>
      </div>
    </section>
  );
}
