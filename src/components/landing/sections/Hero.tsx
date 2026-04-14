import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { spring } from "@/lib/motion";
import { BrowserFrame, GradientStage } from "../DeviceFrames";
import { DashboardSvg } from "../illustrations/SvgIllustrations";

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 20, filter: "blur(4px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  transition: { ...spring.default as object, delay },
});

function DashboardMockup() {
  return (
    <BrowserFrame url="app.ledge.in/dashboard">
      <div className="p-4 bg-white">
        <DashboardSvg />
      </div>
    </BrowserFrame>
  );
}

const MotionLink = motion.create(Link);

export function Hero() {
  return (
    <section className="min-h-screen flex items-center px-6 bg-[#F8F7F5] pt-32 pb-28 md:py-36 overflow-hidden">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left - Text */}
        <div>
          <motion.h1
            className="font-heading font-extrabold text-[28px] md:text-[46px] text-[#1A1A1A] leading-[1.08] tracking-[-0.04em]"
            {...fadeUp(0)}
          >
            Every order your team placed today. Do you actually know about it?
          </motion.h1>

          <motion.p
            className="font-body text-[16px] md:text-[18px] text-[#52525B] leading-[1.6] max-w-xl mt-6"
            {...fadeUp(0.12)}
          >
            Ledge is a complete distribution management platform - order capture, inventory, payments, GST invoicing, dealer intelligence, and sales performance, all in one place. Your field team uses it on their phone. You run the whole business from your dashboard.
          </motion.p>

          <motion.div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-8" {...fadeUp(0.2)}>
            <MotionLink
              to="/signup"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              transition={spring.snappy}
              className="font-body font-semibold text-white bg-[#27272A] hover:bg-[#1A1A1A] w-full sm:w-auto text-base px-8 py-4 rounded-full text-center transition-colors duration-200"
              style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.06)" }}
            >
              Get Started Free
            </MotionLink>
            <motion.a
              href="#how-it-works"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              transition={spring.snappy}
              className="font-body font-semibold text-base text-[#1A1A1A] border border-[#D4D1CC] hover:border-[#A8A29E] w-full sm:w-auto px-8 py-4 rounded-full text-center transition-colors duration-200"
              style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
            >
              See How It Works
            </motion.a>
          </motion.div>

          <motion.p
            className="font-body text-sm text-[#71717A] mt-8"
            {...fadeUp(0.28)}
          >
            Used by FMCG distribution businesses across India to replace spreadsheets, WhatsApp threads, and ERPs their teams hated.
          </motion.p>

        </div>

        {/* Right - Dashboard Mockup */}
        <div
          className="w-full max-w-2xl mx-auto"
          style={{ perspective: "1200px" }}
        >
          <motion.div
            initial={{ x: 40, opacity: 0, rotateY: 0, rotateX: 0 }}
            animate={{ x: 0, opacity: 1, rotateY: -4, rotateX: 2 }}
            transition={{ ...spring.gentle as object, delay: 0.15 }}
          >
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            >
              <GradientStage variant="indigo">
                <DashboardMockup />
              </GradientStage>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
