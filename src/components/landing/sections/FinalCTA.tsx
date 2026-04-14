import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { spring } from "@/lib/motion";
import { AnimateIn } from "../AnimateIn";

const MotionLink = motion.create(Link);

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 20, filter: "blur(4px)" },
  whileInView: { opacity: 1, y: 0, filter: "blur(0px)" },
  viewport: { once: true, margin: "-80px" as const },
  transition: { ...spring.default as object, delay },
});

export function FinalCTA() {
  return (
    <section className="bg-[#F8F7F5] py-28 md:py-36">
      <div className="max-w-7xl mx-auto px-6 text-center">
        <motion.h2
          className="font-heading font-extrabold text-[24px] md:text-[36px] text-[#1A1A1A] max-w-3xl mx-auto leading-[1.1] tracking-[-0.04em]"
          {...fadeUp(0)}
        >
          Your team is in the field right now. Orders are moving. Are you watching?
        </motion.h2>

        <motion.p
          className="font-body text-[18px] text-[#52525B] max-w-xl mx-auto mt-8 leading-[1.6]"
          {...fadeUp(0.1)}
        >
          Set up Ledge in under 15 minutes. See your first live order before the hour is up.
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mt-12"
          {...fadeUp(0.18)}
        >
          <MotionLink
            to="/signup"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            transition={spring.snappy}
            className="bg-[#27272A] text-white px-10 py-4 rounded-full font-semibold hover:bg-[#1A1A1A] transition-colors duration-200 inline-flex items-center justify-center text-base"
            style={{ boxShadow: "0 4px 14px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.08)" }}
          >
            Get Started Free
          </MotionLink>
          <motion.a
            href="/#features"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            transition={spring.snappy}
            className="border border-[#D4D1CC] text-[#1A1A1A] px-10 py-4 rounded-full font-semibold hover:border-[#A8A29E] transition-colors duration-200 inline-flex items-center justify-center text-base"
          >
            See How It Works
          </motion.a>
        </motion.div>

        <motion.p
          className="font-body text-sm text-[#71717A] mt-6"
          {...fadeUp(0.24)}
        >
          No credit card required · Setup in 15 minutes · Cancel anytime
        </motion.p>
      </div>
    </section>
  );
}
