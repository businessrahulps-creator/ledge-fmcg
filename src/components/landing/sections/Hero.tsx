import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { spring } from "@/lib/motion";
import { BrowserFrame } from "../DeviceFrames";
import { DashboardSvg } from "../illustrations/SvgIllustrations";

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 20, filter: "blur(4px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  transition: { ...spring.default as object, delay },
});

const MotionLink = motion.create(Link);

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center px-6 bg-white pt-32 pb-24 md:py-36 overflow-hidden">
      {/* Ambient cool-gradient wash */}
      <div
        className="absolute inset-0 pointer-events-none opacity-60"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 80% 30%, rgba(124,58,237,0.10) 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 10% 80%, rgba(37,99,235,0.08) 0%, transparent 60%)",
        }}
      />

      <div className="relative max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full">
        {/* Left - Text */}
        <div className="lg:col-span-7">
          <motion.div {...fadeUp(0)}>
            <span className="inline-block font-body text-[12px] md:text-[13px] font-semibold tracking-[0.18em] brand-gradient-cool-text uppercase">
              The Operating System for Factory + Field
            </span>
          </motion.div>

          <motion.h1
            className="font-heading font-extrabold text-[40px] md:text-[68px] text-[#0A0F1C] leading-[1.02] tracking-[-0.045em] mt-5"
            {...fadeUp(0.08)}
          >
            Run your factory and field
            <br />
            the way they deserve.
          </motion.h1>

          <motion.p
            className="font-body text-[18px] md:text-[22px] text-[#1F2937] leading-[1.45] max-w-xl mt-7"
            {...fadeUp(0.16)}
          >
            Orders, payments, stock, GST invoices, production — one mobile app.
            Recover the <span className="font-semibold text-[#0A0F1C]">5–10% that leaks every year between your factory and your field</span>.
          </motion.p>

          <motion.div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-10" {...fadeUp(0.24)}>
            <MotionLink
              to="/signup"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              transition={spring.snappy}
              className="font-body font-semibold text-white bg-[#0A0F1C] hover:bg-[#1F2937] w-full sm:w-auto text-base px-9 py-4 rounded-full text-center transition-colors duration-200"
              style={{ boxShadow: "0 8px 24px -8px rgba(10,15,28,0.4), 0 2px 6px rgba(10,15,28,0.12)" }}
            >
              Start 30-Day Free Trial
            </MotionLink>
            <motion.a
              href="#how-it-works"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              transition={spring.snappy}
              className="font-body font-semibold text-base text-[#0A0F1C] border border-[#E5E7EB] hover:border-[#0A0F1C] bg-white w-full sm:w-auto px-9 py-4 rounded-full text-center transition-colors duration-200"
            >
              See How It Works
            </motion.a>
          </motion.div>

          <motion.p
            className="font-body text-sm text-[#64748B] mt-7"
            {...fadeUp(0.32)}
          >
            No card required · Setup in 15 minutes · Built in India
          </motion.p>
        </div>

        {/* Right - Dashboard Mockup */}
        <div className="lg:col-span-5 w-full" style={{ perspective: "1200px" }}>
          <motion.div
            initial={{ x: 40, opacity: 0, rotateY: 0, rotateX: 0 }}
            animate={{ x: 0, opacity: 1, rotateY: -4, rotateX: 2 }}
            transition={{ ...spring.gentle as object, delay: 0.15 }}
          >
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            >
              <div
                className="relative rounded-3xl p-5 md:p-8"
                style={{
                  background:
                    "radial-gradient(ellipse at 30% 20%, rgba(124,58,237,0.12) 0%, transparent 55%), radial-gradient(ellipse at 70% 80%, rgba(37,99,235,0.10) 0%, transparent 55%), linear-gradient(135deg, #F5F6F8 0%, #FFFFFF 100%)",
                }}
              >
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
    </section>
  );
}
