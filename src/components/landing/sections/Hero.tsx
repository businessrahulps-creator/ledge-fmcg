import { useRef } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { spring, useParallaxY } from "@/lib/motion";
import { BrowserFrame } from "../DeviceFrames";
import { CapsuleCTA } from "../CapsuleCTA";
import heroDashboard from "@/assets/landing/hero-dashboard.png";

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 20, filter: "blur(4px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  transition: { ...spring.default as object, delay },
});

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const gridY = useParallaxY(sectionRef, 30);

  return (
    <section ref={sectionRef} className="relative min-h-screen flex items-center px-6 md:px-8 lg:px-10 lp-mesh-soft-warm pt-24 md:pt-28 pb-20 md:pb-24 overflow-hidden">
      {/* Soft dot grid, masked — subtle parallax */}
      <motion.div style={{ y: gridY, willChange: "transform" }} className="absolute inset-0 lp-grid-soft pointer-events-none" />

      <div className="relative max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center w-full">
        {/* Left - Text */}
        <div className="lg:col-span-7">
          <motion.div {...fadeUp(0)}>
            <span className="lp-eyebrow">
              <span className="hidden sm:inline">The Operating System for Kerala's FMCG Businesses</span>
              <span className="sm:hidden">OS for Kerala's FMCG</span>
            </span>
          </motion.div>

          <motion.h1
            className="font-heading font-semibold text-[40px] md:text-[52px] text-foreground leading-[1.08] tracking-[-0.025em] mt-7"
            {...fadeUp(0.08)}
          >
            Orders. Payments. Stock.
            <br />
            Invoices. Reports. One mobile app.
          </motion.h1>

          <motion.p
            className="font-body text-[17px] md:text-[19px] text-muted-foreground leading-[1.55] max-w-xl mt-7"
            {...fadeUp(0.16)}
          >
            Built for distributors and FMCG owners in Kerala. Mobile-first. Works offline.
            Recover the <span className="font-semibold text-foreground">5–10% that quietly leaks every year between your factory and your field</span>.
          </motion.p>

          <motion.div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-7 mt-10" {...fadeUp(0.24)}>
            <CapsuleCTA to="/signup">Start 30-Day Free Trial</CapsuleCTA>
            <motion.a
              href="#how-it-works"
              whileHover={{ x: 2 }}
              transition={spring.snappy}
              className="font-body font-semibold text-[14.5px] text-foreground inline-flex items-center gap-1.5 group"
            >
              See how it works
              <ArrowRight size={15} strokeWidth={2.2} className="text-muted-foreground group-hover:text-accent transition-colors" />
            </motion.a>
          </motion.div>

          <motion.p
            className="font-body text-[13px] text-muted-foreground mt-8"
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
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="relative"
            >
              {/* Layer 1 — neutral graphite ambient shadow */}
              <div
                aria-hidden
                className="absolute -inset-8 rounded-[2.5rem] blur-3xl opacity-30 pointer-events-none"
                style={{
                  background:
                    "radial-gradient(ellipse at 50% 50%, hsl(var(--primary) / 0.18) 0%, transparent 65%)",
                }}
              />
              {/* Layer 2 — Bone-tinted glass stage */}
              <div className="relative lp-card-glass p-3 md:p-4 rounded-md">
                {/* Layer 3 — browser frame with real product UI */}
                <BrowserFrame url="app.ledge.in/dashboard">
                  <div className="relative">
                    <img
                      src={heroDashboard}
                      alt="Ledge dashboard showing revenue, KPIs, and recent orders"
                      width={1600}
                      height={1024}
                      className="block w-full h-auto"
                    />
                    {/* Proof chip — anchored inside the frame like a real product notification */}
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ ...spring.gentle as object, delay: 0.6 }}
                      className="absolute bottom-3 right-3 z-10"
                    >
                      <span className="lp-proof-chip">
                        <span className="lp-proof-chip__dot" />
                        ₹2.4Cr tracked this week
                      </span>
                    </motion.div>
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
