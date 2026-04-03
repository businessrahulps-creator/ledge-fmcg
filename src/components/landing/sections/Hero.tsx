import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: "easeOut" as const },
});

const trustChips = [
  "✦ Works offline",
  "✦ Installs in 30 seconds",
  "✦ Built for Indian FMCG",
];

export function Hero() {
  return (
    <section className="min-h-screen bg-midnight pt-36 py-20 md:py-32 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left — Text */}
        <div>
          <motion.h1
            className="font-heading font-extrabold text-[34px] md:text-[60px] text-white leading-[1.08] tracking-[-0.03em]"
            {...fadeUp(0)}
          >
            Your distribution,
          </motion.h1>
          <motion.h1
            className="font-heading font-extrabold text-[34px] md:text-[60px] text-white leading-[1.08] tracking-[-0.03em]"
            {...fadeUp(0.1)}
          >
            finally in your hands.
          </motion.h1>

          <motion.p
            className="font-body text-[17px] md:text-[20px] text-silver leading-[1.6] max-w-xl mt-6"
            {...fadeUp(0.2)}
          >
            One app replaces your 14 WhatsApp groups, 3 Excel sheets, and
            nightly phone calls. Orders, stock, dealers, payments — live on
            your phone, even without internet.
          </motion.p>

          <motion.div className="flex flex-wrap gap-4 mt-8" {...fadeUp(0.3)}>
            <Link
              to="/signup"
              className="font-body font-semibold text-white bg-violet hover:bg-violet-hover px-8 py-3.5 rounded-full hover:scale-[1.02] transition-all duration-150"
            >
              Start Free — No Card Needed
            </Link>
            <a
              href="#features"
              className="font-body font-medium text-white border border-white/25 hover:border-white/50 px-8 py-3.5 rounded-full transition-all duration-150"
            >
              See It In Action →
            </a>
          </motion.div>

          <motion.div className="flex flex-wrap gap-3 mt-8" {...fadeUp(0.4)}>
            {trustChips.map((chip) => (
              <span
                key={chip}
                className="font-body text-sm text-silver bg-onyx px-4 py-1.5 rounded-full"
              >
                {chip}
              </span>
            ))}
          </motion.div>
        </div>

        {/* Right — Mockup frame */}
        <motion.div
          initial={{ x: 60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full max-w-md mx-auto"
        >
          <div
            className="w-full aspect-[9/16] md:aspect-[3/4] bg-onyx rounded-3xl border border-[rgba(124,58,237,0.15)] flex items-center justify-center"
            style={{
              boxShadow: "0 0 80px rgba(124, 58, 237, 0.12)",
              transform: "perspective(1200px) rotateY(-4deg)",
            }}
          >
            <span className="font-body text-silver text-sm">
              Dashboard Screenshot
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
