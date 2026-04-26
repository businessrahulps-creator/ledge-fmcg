import { useRef } from "react";
import { motion } from "framer-motion";
import { Clock, TrendingUp, LineChart, Wallet, ArrowRight } from "lucide-react";
import { useParallaxY } from "@/lib/motion";
import { AnimateIn, StaggerContainer, StaggerItem } from "../AnimateIn";

const outcomes = [
  {
    icon: Clock,
    eyebrow: "Time saved",
    value: "80+",
    unit: "hours / month",
    label: "Recovered every month across your team.",
  },
  {
    icon: TrendingUp,
    eyebrow: "Revenue recovered",
    value: "₹10L–₹1Cr",
    unit: "per year",
    label: "Leakage plugged across orders, claims and ledgers.",
  },
  {
    icon: LineChart,
    eyebrow: "Sales lift",
    value: "8–12%",
    unit: "uplift",
    label: "Same team, same dealers, sharper execution.",
  },
  {
    icon: Wallet,
    eyebrow: "Overheads",
    value: "₹10K–₹20K",
    unit: "saved monthly",
    label: "Less spent outsourcing accounting work.",
  },
];

export function Outcome() {
  const sectionRef = useRef<HTMLElement>(null);
  const meshY = useParallaxY(sectionRef, 30);

  return (
    <section ref={sectionRef} className="relative lp-mesh-light py-24 md:py-28 overflow-hidden">
      <motion.div style={{ y: meshY, willChange: "transform" }} className="absolute inset-0 lp-grid-soft pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-6 md:px-8 lg:px-10">
        <AnimateIn variant="blurFadeUp">
          <div className="text-center mb-14 md:mb-16 max-w-3xl mx-auto">
            <span className="lp-eyebrow">The Outcome</span>
            <h2 className="font-heading font-semibold text-[32px] md:text-[40px] text-[#0A0F1C] tracking-[-0.022em] leading-[1.1] mt-6">
              What changes in the first{" "}
              <span className="lp-pill-accent font-semibold">
                <span className="relative z-[2]">90 days</span>
              </span>
              <span className="ml-[-2px]">.</span>
            </h2>
          </div>
        </AnimateIn>

        <AnimateIn variant="blurFadeUp" delay={0.05}>
          <div className="md:rounded-[24px] md:border md:border-[#ECEEF2] md:bg-white md:p-4">
            <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3" staggerTime={0.06}>
              {outcomes.map((o, idx) => {
                const Icon = o.icon;
                const isHero = idx === 1;
                if (isHero) {
                  return (
                    <StaggerItem key={o.value} variant="scaleUp">
                      <div className="lp-bento-hero h-full p-6 flex flex-col">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] bg-white/80 border border-white text-[#4F46E5] shadow-sm">
                            <Icon className="h-4 w-4" strokeWidth={2} />
                          </span>
                          <span className="font-body text-[11px] uppercase tracking-[0.14em] text-[#3730A3] font-semibold">
                            {o.eyebrow}
                          </span>
                        </div>

                        <div className="mt-6">
                          <div className="font-heading font-semibold text-[26px] md:text-[28px] text-[#3730A3] tracking-[-0.022em] leading-[1.05]">
                            {o.value}
                          </div>
                          <div className="font-body text-[13.5px] text-[#475569] mt-1.5">
                            {o.unit}
                          </div>
                        </div>

                        <div className="h-px bg-white/60 my-5" />

                        <p className="font-body text-[13.5px] leading-[1.5] text-[#3B3F66]">
                          {o.label}
                        </p>
                      </div>
                    </StaggerItem>
                  );
                }
                return (
                  <StaggerItem key={o.value} variant="scaleUp">
                    <div className="group relative h-full rounded-[18px] border border-[#ECEEF2] bg-white p-6 transition-colors duration-300 hover:border-[#D4D8E0]">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#F4F4F8] border border-[#ECEEF2] text-[#1F2937]">
                          <Icon className="h-4 w-4" strokeWidth={2} />
                        </span>
                        <span className="font-body text-[11px] uppercase tracking-[0.14em] text-[#94A3B8] font-medium">
                          {o.eyebrow}
                        </span>
                      </div>

                      <div className="mt-6">
                        <div className="font-heading font-semibold text-[26px] md:text-[28px] text-[#0A0F1C] tracking-[-0.022em] leading-[1.05]">
                          {o.value}
                        </div>
                        <div className="font-body text-[13.5px] text-[#64748B] mt-1.5">
                          {o.unit}
                        </div>
                      </div>

                      <div className="h-px bg-[#ECEEF2] my-5" />

                      <p className="font-body text-[13.5px] leading-[1.5] text-[#475569]">
                        {o.label}
                      </p>
                    </div>
                  </StaggerItem>
                );
              })}
            </StaggerContainer>
          </div>
        </AnimateIn>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="flex justify-center mt-14 md:mt-16"
        >
          <span className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-[#FAFAFB] border border-[#ECEEF2] font-body text-[14px] md:text-[15px] text-[#475569]">
            <span>Same factory. Same field.</span>
            <span className="text-[#0A0F1C] font-semibold">More throughput. Better cash flow.</span>
            <ArrowRight className="h-3.5 w-3.5 text-[#94A3B8]" strokeWidth={2.2} />
          </span>
        </motion.div>
      </div>
    </section>
  );
}
