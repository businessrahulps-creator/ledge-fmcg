import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { spring, useParallaxY } from "@/lib/motion";
import { BrowserFrame } from "../DeviceFrames";
import { DashboardSvg } from "../illustrations/SvgIllustrations";

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 20, filter: "blur(4px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  transition: { ...spring.default as object, delay },
});

const MotionLink = motion.create(Link);

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const gridY = useParallaxY(sectionRef, 30);

  return (
    <section ref={sectionRef} className="relative min-h-[92vh] flex items-center px-6 md:px-8 lg:px-10 lp-mesh-soft-warm pt-28 md:pt-32 pb-24 md:pb-36 overflow-hidden">
      {/* Soft dot grid, masked — subtle parallax */}
      <motion.div style={{ y: gridY, willChange: "transform" }} className="absolute inset-0 lp-grid-soft pointer-events-none" />

      <div className="relative max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center w-full">
        {/* Left - Text */}
        <div className="lg:col-span-7">
          <motion.div {...fadeUp(0)}>
            <span className="lp-eyebrow">
              The Operating System for Factory + Field
            </span>
          </motion.div>

          <motion.h1
            className="font-heading font-semibold text-[40px] md:text-[52px] text-[#0A0F1C] leading-[1.08] tracking-[-0.025em] mt-7"
            {...fadeUp(0.08)}
          >
            Run your factory and field
            <br />
            the way they deserve.
          </motion.h1>

          <motion.p
            className="font-body text-[17px] md:text-[19px] text-[#475569] leading-[1.55] max-w-xl mt-7"
            {...fadeUp(0.16)}
          >
            Orders, payments, stock, GST invoices, production. One mobile app.
            Recover the <span className="font-semibold text-[#0A0F1C]">5–10% that leaks every year between your factory and your field</span>.
          </motion.p>

          <motion.div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-10" {...fadeUp(0.24)}>
            <MotionLink
              to="/signup"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              transition={spring.snappy}
              className="lp-btn-primary-dark lp-shimmer font-body font-semibold text-white w-full sm:w-auto text-[15px] px-8 py-3.5 rounded-full text-center transition-colors duration-200"
            >
              Start 30-Day Free Trial
            </MotionLink>
            <motion.a
              href="#how-it-works"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              transition={spring.snappy}
              className="font-body font-semibold text-[15px] text-[#0A0F1C] border border-[#E2E8F0] hover:border-[#0A0F1C] bg-white/60 backdrop-blur-sm w-full sm:w-auto px-8 py-3.5 rounded-full text-center transition-colors duration-200"
            >
              See How It Works
            </motion.a>
          </motion.div>

          <motion.p
            className="font-body text-[13px] text-[#64748B] mt-8"
            {...fadeUp(0.32)}
          >
            No card required · Setup in 15 minutes · Built in India
          </motion.p>
        </div>

        {/* Right - Dashboard Mockup with 3-layer treatment */}
        <div className="lg:col-span-5 w-full" style={{ perspective: "1400px" }}>
          <motion.div
            initial={{ x: 30, opacity: 0, rotateY: 0, rotateX: 0 }}
            animate={{ x: 0, opacity: 1, rotateY: -5, rotateX: 3 }}
            transition={{ ...spring.gentle as object, delay: 0.2 }}
          >
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="relative"
            >
              {/* Layer 1 — outer violet glow */}
              <div
                aria-hidden
                className="absolute -inset-8 rounded-[2.5rem] blur-3xl opacity-40 pointer-events-none"
                style={{
                  background:
                    "radial-gradient(ellipse at 30% 30%, rgba(124,58,237,0.45) 0%, transparent 60%), radial-gradient(ellipse at 70% 70%, rgba(37,99,235,0.40) 0%, transparent 60%)",
                }}
              />
              {/* Layer 2 — glass stage */}
              <div className="relative lp-card-glass p-4 md:p-6 rounded-[1.75rem]">
                {/* Layer 3 — browser frame */}
                <BrowserFrame url="app.ledge.in/dashboard">
                  <div className="p-4 bg-white">
                    <DashboardSvg />
                  </div>
                </BrowserFrame>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Hairline section seam */}
      <div className="absolute bottom-0 left-0 right-0 h-12 lp-vignette-top pointer-events-none" />
    </section>
  );
}
