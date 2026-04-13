import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BrowserFrame, GradientStage } from "../DeviceFrames";
import dashboardShot from "@/assets/dashboard-shot.webp";

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { type: "spring" as const, damping: 26, stiffness: 200, delay },
});

function DashboardMockup() {
  return (
    <BrowserFrame url="app.ledge.in/dashboard">
      <img src={dashboardShot} alt="Ledge dashboard showing revenue, orders, and dealer analytics" className="w-full block" loading="eager" />
    </BrowserFrame>
  );
}

export function Hero() {
  return (
    <section className="min-h-screen flex items-center pt-16 px-6 bg-[#F8F7F5] py-28 md:py-36">
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
            {...fadeUp(0.2)}
          >
            Ledge is a complete distribution management platform - order capture, inventory, payments, GST invoicing, dealer intelligence, and sales performance, all in one place. Your field team uses it on their phone. You run the whole business from your dashboard.
          </motion.p>

          <motion.div className="flex flex-wrap gap-4 mt-8" {...fadeUp(0.3)}>
            <Link
              to="/signup"
              className="font-body font-semibold text-sm text-white bg-[#0D9488] hover:bg-[#0F766E] px-7 py-3 rounded-3xl hover:scale-[1.01] transition-all duration-200"
              style={{ boxShadow: "0 2px 8px rgba(13,148,136,0.18), 0 1px 3px rgba(0,0,0,0.06)" }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 6px 20px rgba(13,148,136,0.25), 0 2px 6px rgba(0,0,0,0.08)")}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 2px 8px rgba(13,148,136,0.18), 0 1px 3px rgba(0,0,0,0.06)")}
            >
              Get Started Free
            </Link>
            <a
              href="#how-it-works"
              className="font-body font-medium text-sm text-[#1A1A1A] border border-[#D4D1CC] hover:border-[#A8A29E] px-7 py-3 rounded-3xl transition-all duration-200"
              style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 3px 12px rgba(0,0,0,0.1)")}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.06)")}
            >
              See How It Works
            </a>
          </motion.div>

          <motion.p
            className="font-body text-sm text-[#71717A] mt-8"
            {...fadeUp(0.4)}
          >
            Used by FMCG distribution businesses across India to replace spreadsheets, WhatsApp threads, and ERPs their teams hated.
          </motion.p>

        </div>

        {/* Right - Dashboard Mockup */}
        <motion.div
          initial={{ x: 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: "spring", damping: 26, stiffness: 200, delay: 0.2 }}
          className="w-full max-w-lg mx-auto"
          style={{ transform: "perspective(1200px) rotateY(-4deg) rotateX(2deg)" }}
        >
          <GradientStage variant="indigo">
            <DashboardMockup />
          </GradientStage>
        </motion.div>
      </div>
    </section>
  );
}
