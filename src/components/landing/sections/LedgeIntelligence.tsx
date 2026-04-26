import { useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Camera, Sunrise, Sparkles, Mic, Gift } from "lucide-react";
import { AnimateIn, StaggerContainer, StaggerItem } from "../AnimateIn";
import { useParallaxY } from "@/lib/motion";

const capabilities = [
  {
    n: "01",
    icon: Camera,
    title: "Photo-to-Order",
    desc: "Turn handwritten chits into digital orders instantly.",
  },
  {
    n: "02",
    icon: Sunrise,
    title: "Daily AI Briefings",
    desc: "Every morning your team gets personalized dealer priorities.",
  },
  {
    n: "03",
    icon: Sparkles,
    title: "Smart Scheme Suggestions",
    desc: "AI recommends the right scheme for each dealer.",
  },
  {
    n: "04",
    icon: Mic,
    title: "Dealer 360° + Voice Orders",
    desc: "Full dealer health at a glance. Speak orders naturally.",
  },
];

function AIOrb() {
  const reduce = useReducedMotion();

  return (
    <div className="relative mx-auto" style={{ width: 320, height: 320 }} aria-hidden>
      {/* Outer breathing aura */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(79,70,229,0.45) 0%, rgba(14,165,233,0.18) 40%, transparent 70%)",
          filter: "blur(40px)",
        }}
        animate={reduce ? undefined : { scale: [1, 1.04, 1], opacity: [0.7, 0.95, 0.7] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Light rays */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 320 320">
        <defs>
          <linearGradient id="li-ray-grad" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#A5B4FC" stopOpacity="0" />
            <stop offset="50%" stopColor="#A5B4FC" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#A5B4FC" stopOpacity="0" />
          </linearGradient>
        </defs>
        {Array.from({ length: 6 }).map((_, i) => (
          <g key={i} transform={`rotate(${i * 60} 160 160)`}>
            <rect
              x="158.5"
              y="20"
              width="3"
              height="280"
              fill="url(#li-ray-grad)"
              className={reduce ? "" : "li-ray"}
              style={{ animationDelay: `${i * 0.6}s` }}
            />
          </g>
        ))}
      </svg>

      {/* Rotating outer ring */}
      <motion.div
        className="absolute inset-6 rounded-full border border-white/10"
        animate={reduce ? undefined : { rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        style={{
          background:
            "conic-gradient(from 0deg, rgba(79,70,229,0) 0deg, rgba(79,70,229,0.3) 90deg, rgba(14,165,233,0.3) 180deg, rgba(79,70,229,0) 360deg)",
          maskImage: "radial-gradient(circle, transparent 60%, #000 62%, #000 100%)",
          WebkitMaskImage: "radial-gradient(circle, transparent 60%, #000 62%, #000 100%)",
        }}
      />

      {/* Counter-rotating inner ring */}
      <motion.div
        className="absolute inset-16 rounded-full border border-white/[0.08]"
        animate={reduce ? undefined : { rotate: -360 }}
        transition={{ duration: 90, repeat: Infinity, ease: "linear" }}
        style={{
          background:
            "conic-gradient(from 180deg, rgba(14,165,233,0) 0deg, rgba(14,165,233,0.35) 120deg, rgba(255,255,255,0) 240deg, rgba(14,165,233,0) 360deg)",
          maskImage: "radial-gradient(circle, transparent 65%, #000 67%, #000 100%)",
          WebkitMaskImage: "radial-gradient(circle, transparent 65%, #000 67%, #000 100%)",
        }}
      />

      {/* Core orb */}
      <motion.div
        className="absolute inset-[28%] rounded-full"
        style={{
          background:
            "radial-gradient(circle at 35% 30%, #ffffff 0%, #C7D2FE 18%, #6366F1 45%, #1E1B4B 90%)",
          boxShadow:
            "0 0 60px 10px rgba(99,102,241,0.45), inset 0 0 30px rgba(255,255,255,0.25), inset -10px -20px 40px rgba(15,23,42,0.6)",
        }}
        animate={reduce ? undefined : { scale: [1, 1.03, 1] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Specular highlight */}
      <div
        aria-hidden
        className="absolute rounded-full pointer-events-none"
        style={{
          top: "32%",
          left: "34%",
          width: "14%",
          height: "10%",
          background: "radial-gradient(ellipse, rgba(255,255,255,0.85) 0%, transparent 70%)",
          filter: "blur(2px)",
        }}
      />

      {/* Orbiting micro-dots */}
      {!reduce && (
        <>
          {[
            { dur: 8, size: 4, radius: 130, delay: 0 },
            { dur: 11, size: 3, radius: 110, delay: -2 },
            { dur: 14, size: 5, radius: 145, delay: -4 },
            { dur: 9, size: 3, radius: 120, delay: -1 },
          ].map((o, i) => (
            <motion.div
              key={i}
              className="absolute top-1/2 left-1/2"
              style={{ width: 0, height: 0 }}
              animate={{ rotate: 360 }}
              transition={{ duration: o.dur, repeat: Infinity, ease: "linear", delay: o.delay }}
            >
              <div
                className="absolute rounded-full"
                style={{
                  width: o.size,
                  height: o.size,
                  background: "#A5B4FC",
                  boxShadow: "0 0 8px 2px rgba(165,180,252,0.7)",
                  transform: `translate(${o.radius}px, -${o.size / 2}px)`,
                }}
              />
            </motion.div>
          ))}
        </>
      )}
    </div>
  );
}

export function LedgeIntelligence() {
  const sectionRef = useRef<HTMLElement>(null);
  const ambientY = useParallaxY(sectionRef, 40);

  return (
    <section
      ref={sectionRef}
      className="relative bg-[#0A0F1C] overflow-hidden"
      aria-label="Ledge Intelligence"
    >
      {/* Top fade — lifts off white section above */}
      <div
        aria-hidden
        className="absolute top-0 inset-x-0 h-24 z-10 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, #ffffff, transparent)" }}
      />
      {/* Bottom fade — into white section below */}
      <div
        aria-hidden
        className="absolute bottom-0 inset-x-0 h-24 z-10 pointer-events-none"
        style={{ background: "linear-gradient(to top, #ffffff, transparent)" }}
      />

      {/* Soft grid */}
      <div className="absolute inset-0 lp-grid-soft-dark opacity-40 pointer-events-none" aria-hidden />
      {/* Noise film */}
      <div className="absolute inset-0 lp-noise opacity-[0.5] pointer-events-none" aria-hidden />

      {/* Ambient parallax orbs */}
      <motion.div
        aria-hidden
        style={{ y: ambientY }}
        className="absolute -top-32 -left-32 w-[520px] h-[520px] rounded-full pointer-events-none"
      >
        <div
          className="w-full h-full rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(79,70,229,0.22) 0%, transparent 65%)",
            filter: "blur(40px)",
          }}
        />
      </motion.div>
      <motion.div
        aria-hidden
        style={{ y: ambientY }}
        className="absolute -bottom-40 -right-32 w-[560px] h-[560px] rounded-full pointer-events-none"
      >
        <div
          className="w-full h-full rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(245,158,11,0.10) 0%, transparent 65%)",
            filter: "blur(50px)",
          }}
        />
      </motion.div>

      <div className="relative z-20 max-w-6xl mx-auto px-6 md:px-8 lg:px-10 py-32 md:py-40 lg:py-48">
        {/* Eyebrow */}
        <AnimateIn variant="blurFadeUp">
          <div className="flex justify-center mb-10">
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-md">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-400" />
              </span>
              <span className="font-body text-[11.5px] tracking-[0.18em] uppercase text-white/70 font-medium">
                New · Coming Q3 2026
              </span>
            </div>
          </div>
        </AnimateIn>

        {/* Headline */}
        <AnimateIn variant="blurFadeUp" delay={0.08}>
          <h2 className="font-heading font-semibold text-center text-white leading-[1.02] tracking-[-0.03em] text-[44px] sm:text-[60px] md:text-[76px] lg:text-[84px]">
            Ledge{" "}
            <span className="li-headline-gradient">Intelligence</span>
          </h2>
        </AnimateIn>

        {/* Sub-headline */}
        <AnimateIn variant="blurFadeUp" delay={0.18}>
          <p className="mt-6 text-center font-body text-white/70 text-[17px] md:text-[21px] leading-[1.5] max-w-2xl mx-auto">
            Your always-on{" "}
            <span className="li-ai-glyph">AI</span>{" "}
            that thinks alongside you.
          </p>
        </AnimateIn>

        {/* AI Orb */}
        <AnimateIn variant="fadeIn" delay={0.25}>
          <div className="my-16 md:my-20">
            <AIOrb />
          </div>
        </AnimateIn>

        {/* Capability cards */}
        <StaggerContainer staggerTime={0.08} className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 max-w-4xl mx-auto">
          {capabilities.map((c) => {
            const Icon = c.icon;
            return (
              <StaggerItem key={c.n} variant="fadeUp">
                <motion.div
                  whileHover={{ y: -3 }}
                  transition={{ type: "spring", stiffness: 280, damping: 22 }}
                  className="li-card-dark group relative h-full rounded-2xl p-6 md:p-7"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center bg-white/[0.04] border border-white/[0.08] text-indigo-300 group-hover:text-indigo-200 group-hover:border-white/[0.16] transition-colors duration-300"
                      style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)" }}
                    >
                      <Icon size={18} strokeWidth={1.6} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-[11px] tracking-[0.16em] text-white/35 mb-1.5">
                        {c.n}
                      </div>
                      <h3 className="font-heading font-semibold text-white text-[18px] md:text-[20px] tracking-[-0.01em] leading-[1.25]">
                        {c.title}
                      </h3>
                      <p className="font-body text-white/65 text-[14.5px] md:text-[15px] leading-[1.55] mt-2">
                        {c.desc}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>

        {/* Special offer strip */}
        <AnimateIn variant="blurFadeUp" delay={0.4}>
          <div className="mt-14 md:mt-16 flex justify-center">
            <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-white/[0.04] border border-white/[0.10] backdrop-blur-md">
              <Gift size={14} strokeWidth={1.8} className="text-amber-300/90" />
              <span className="font-body text-[13.5px] text-white/85">
                Existing customers get{" "}
                <span className="font-semibold text-white">6 months free</span> when it launches
              </span>
            </div>
          </div>
        </AnimateIn>
      </div>
    </section>
  );
}
