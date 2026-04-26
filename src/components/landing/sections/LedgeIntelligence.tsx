import { useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Camera, Sunrise, Sparkles, Mic, Gift, Sun, FileText, Target } from "lucide-react";
import { AnimateIn, StaggerContainer, StaggerItem } from "../AnimateIn";

const capabilities = [
  {
    n: "01",
    icon: Camera,
    title: "Photo-to-Order",
    desc: "Turn handwritten chits into digital orders instantly.",
    hero: true,
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

/**
 * LiveRoute — FMCG-native motion: a route line draws itself left→right
 * through 5 dealer stops, with a delivery pulse traveling the path on loop.
 * Pure SVG. Reduced-motion safe.
 */
function LiveRoute() {
  const reduce = useReducedMotion();

  // Single curved path (left→right)
  const d = "M 40 140 C 160 60, 280 220, 420 110 S 660 60, 820 150";
  // Approx stop coordinates along the path
  const stops = [
    { x: 40, y: 140 },
    { x: 240, y: 122 },
    { x: 430, y: 112 },
    { x: 620, y: 96 },
    { x: 820, y: 150 },
  ];

  return (
    <div className="relative mx-auto w-full max-w-3xl" aria-hidden>
      {/* Soft indigo focal wash, only behind the visual */}
      <div
        className="absolute inset-x-10 top-1/2 -translate-y-1/2 h-48 rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(79,70,229,0.10) 0%, rgba(14,165,233,0.05) 45%, transparent 75%)",
          filter: "blur(28px)",
        }}
      />

      <svg
        viewBox="0 0 860 240"
        className="relative w-full h-auto"
        style={{ maxHeight: 260 }}
      >
        <defs>
          <linearGradient id="li-route-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#4F46E5" />
            <stop offset="100%" stopColor="#0EA5E9" />
          </linearGradient>
          <radialGradient id="li-stop-grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="55%" stopColor="#E0E7FF" />
            <stop offset="100%" stopColor="#C7D2FE" />
          </radialGradient>
          {/* Hidden reference path for animateMotion */}
          <path id="li-route-ref" d={d} fill="none" />
        </defs>

        {/* Faint backdrop trail */}
        <path
          d={d}
          fill="none"
          stroke="#E2E8F0"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Animated drawing route */}
        <path
          d={d}
          fill="none"
          stroke="url(#li-route-grad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          className={reduce ? "" : "li-route-path"}
          style={reduce ? { strokeDashoffset: 0 } : undefined}
        />

        {/* Dealer stops */}
        {stops.map((s, i) => (
          <g key={i}>
            <circle
              cx={s.x}
              cy={s.y}
              r="9"
              fill="url(#li-stop-grad)"
              stroke="#4F46E5"
              strokeOpacity="0.35"
              strokeWidth="1"
            />
            <circle cx={s.x} cy={s.y} r="3" fill="#4F46E5" />
          </g>
        ))}

        {/* Traveling delivery pulse */}
        <g className="li-route-pulse">
          <circle r="6" fill="#FFFFFF" stroke="#4F46E5" strokeWidth="2">
            {!reduce && (
              <animateMotion dur="6s" repeatCount="indefinite" rotate="auto">
                <mpath href="#li-route-ref" />
              </animateMotion>
            )}
            {reduce && <animate attributeName="opacity" values="1" dur="1s" />}
          </circle>
        </g>
      </svg>

      {/* Floating intelligence chips */}
      <div className="pointer-events-none absolute inset-0 hidden sm:block">
        <Chip
          className="li-route-chip absolute left-[6%] top-[8%]"
          icon={<Sun size={12} className="text-indigo-500" />}
          label="Morning brief ready"
        />
        <Chip
          className="li-route-chip li-route-chip-2 absolute left-1/2 -translate-x-1/2 top-[2%]"
          icon={<FileText size={12} className="text-indigo-500" />}
          label="12 chits → orders"
        />
        <Chip
          className="li-route-chip li-route-chip-3 absolute right-[4%] top-[14%]"
          icon={<Target size={12} className="text-indigo-500" />}
          label="Scheme suggested"
        />
      </div>
    </div>
  );
}

function Chip({
  icon,
  label,
  className = "",
}: {
  icon: React.ReactNode;
  label: string;
  className?: string;
}) {
  return (
    <div
      className={`lp-glass-frost inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${className}`}
      style={{ background: "rgba(255,255,255,0.85)" }}
    >
      {icon}
      <span className="font-body text-[12px] font-medium text-[#0A0F1C] tracking-[-0.005em]">
        {label}
      </span>
    </div>
  );
}

export function LedgeIntelligence() {
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section
      ref={sectionRef}
      className="lp-section-paper relative overflow-hidden"
      aria-label="Ledge Intelligence"
    >
      <div className="relative max-w-6xl mx-auto px-6 md:px-8 lg:px-10 py-24 md:py-32 lg:py-36">
        {/* Eyebrow */}
        <AnimateIn variant="blurFadeUp">
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white border border-[#ECEEF2]">
              <span className="lp-live-dot" style={{ background: "#4F46E5" }} />
              <span className="lp-bento-numeral">[ NEW ]</span>
              <span className="font-body text-[11.5px] tracking-[0.16em] uppercase text-slate-500 font-medium">
                Coming Q3 2026
              </span>
            </div>
          </div>
        </AnimateIn>

        {/* Headline */}
        <AnimateIn variant="blurFadeUp" delay={0.08}>
          <h2 className="font-heading font-semibold text-center text-[#0A0F1C] leading-[1.04] tracking-[-0.028em] text-[40px] sm:text-[52px] md:text-[64px] lg:text-[72px]">
            Ledge <span style={{ color: "#4F46E5" }}>Intelligence</span>
          </h2>
        </AnimateIn>

        {/* Sub-headline */}
        <AnimateIn variant="blurFadeUp" delay={0.16}>
          <p className="mt-5 text-center font-body text-slate-600 text-[17px] md:text-[20px] leading-[1.55] max-w-2xl mx-auto">
            Your always-on AI that thinks alongside you.
          </p>
        </AnimateIn>

        {/* Live route visual */}
        <AnimateIn variant="fadeIn" delay={0.22}>
          <div className="my-14 md:my-16">
            <LiveRoute />
          </div>
        </AnimateIn>

        {/* Capability cards */}
        <StaggerContainer
          staggerTime={0.08}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 max-w-4xl mx-auto"
        >
          {capabilities.map((c) => {
            const Icon = c.icon;
            const heroBg = c.hero
              ? "bg-gradient-to-br from-[#EEF2FF] via-white to-[#F0F9FF]"
              : "";
            return (
              <StaggerItem key={c.n} variant="fadeUp">
                <motion.div
                  whileHover={{ y: -3 }}
                  transition={{ type: "spring", stiffness: 280, damping: 22 }}
                  className={`lp-glass-frost group relative h-full p-6 md:p-7 ${heroBg}`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center bg-white border border-[#ECEEF2] text-[#4F46E5]"
                      style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9)" }}
                    >
                      <Icon size={18} strokeWidth={1.7} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="lp-bento-numeral mb-1.5">[ {c.n} ]</div>
                      <h3 className="font-heading font-semibold text-[#0A0F1C] text-[18px] md:text-[20px] tracking-[-0.012em] leading-[1.25]">
                        {c.title}
                      </h3>
                      <p className="font-body text-slate-600 text-[14.5px] md:text-[15px] leading-[1.55] mt-2">
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
          <div className="mt-12 md:mt-14 flex justify-center">
            <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-white border border-[#ECEEF2] shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <Gift size={14} strokeWidth={1.9} className="text-amber-500" />
              <span className="font-body text-[13.5px] text-[#0A0F1C]">
                Existing customers get{" "}
                <span className="font-semibold">6 months free</span> when it launches
              </span>
            </div>
          </div>
        </AnimateIn>
      </div>
    </section>
  );
}
