import { useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Camera, Sunrise, Sparkles, Mic, Sun, FileText, Target } from "lucide-react";
import { AnimateIn, StaggerContainer, StaggerItem } from "../AnimateIn";
import { CapsuleCTA } from "../CapsuleCTA";

const capabilities = [
  {
    icon: Camera,
    title: "Photo-to-Order",
    desc: "Snap a handwritten chit. Get a clean digital order in seconds.",
    hero: true,
  },
  {
    icon: Sunrise,
    title: "Daily AI Briefings",
    desc: "Every morning, your team wakes up to dealer priorities, ranked.",
  },
  {
    icon: Sparkles,
    title: "Smart Scheme Suggestions",
    desc: "The right scheme for the right dealer. Recommended, not guessed.",
  },
  {
    icon: Mic,
    title: "Dealer 360° + Voice Orders",
    desc: "Full dealer health at a glance. Speak orders the way you talk.",
  },
];

/**
 * LiveRoute — FMCG-native motion: a route line draws itself left→right
 * through 5 dealer stops, with a delivery pulse traveling the path on loop.
 * Stop coordinates are sampled from the actual cubic Bézier so dots sit ON the path.
 */
function LiveRoute() {
  const reduce = useReducedMotion();

  const d = "M 40 140 C 160 60, 280 220, 420 110 S 660 60, 820 150";
  // Sampled directly from the Bézier — dots now sit precisely on the curve.
  const stops = [
    { x: 40, y: 140 },
    { x: 130, y: 117 },
    { x: 420, y: 110 },
    { x: 612, y: 55 },
    { x: 820, y: 150 },
  ];

  return (
    <div
      className="relative mx-auto w-full max-w-3xl"
      role="img"
      aria-label="Live delivery route across 5 dealer stops"
    >
      <svg viewBox="0 0 860 240" className="relative w-full h-auto" style={{ maxHeight: 260 }}>
        <defs>
          <linearGradient id="li-route-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#4F46E5" />
            <stop offset="100%" stopColor="#0EA5E9" />
          </linearGradient>
          <filter id="li-pulse-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.4" />
          </filter>
          <path id="li-route-ref" d={d} fill="none" />
        </defs>

        {/* Faint backdrop trail */}
        <path d={d} fill="none" stroke="#E2E8F0" strokeWidth="1.5" strokeLinecap="round" />

        {/* Animated drawing route */}
        <path
          d={d}
          fill="none"
          stroke="url(#li-route-grad)"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.85"
          className={reduce ? "" : "li-route-path"}
          style={reduce ? { strokeDashoffset: 0 } : undefined}
        />

        {/* Dealer stops */}
        {stops.map((s, i) => (
          <g key={i}>
            <circle cx={s.x} cy={s.y} r="7" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.5" />
            <circle cx={s.x} cy={s.y} r="2.5" fill="#4F46E5" />
          </g>
        ))}

        {/* Traveling delivery pulse */}
        {!reduce && (
          <g className="li-route-pulse">
            <circle r="9" fill="#4F46E5" opacity="0.18" filter="url(#li-pulse-glow)">
              <animateMotion dur="6s" repeatCount="indefinite" rotate="auto">
                <mpath href="#li-route-ref" />
              </animateMotion>
            </circle>
            <circle r="5" fill="#4F46E5" stroke="#FFFFFF" strokeWidth="2">
              <animateMotion dur="6s" repeatCount="indefinite" rotate="auto">
                <mpath href="#li-route-ref" />
              </animateMotion>
            </circle>
          </g>
        )}
      </svg>

      {/* Floating intelligence chips — page-native style */}
      <div className="pointer-events-none absolute inset-0 hidden sm:block">
        <Chip
          className="li-route-chip absolute left-[6%] top-[8%]"
          icon={<Sun size={11} className="text-[#4F46E5]" strokeWidth={2.2} />}
          label="Morning brief ready"
        />
        <Chip
          className="li-route-chip li-route-chip-2 absolute left-1/2 -translate-x-1/2 top-[2%]"
          icon={<FileText size={11} className="text-[#4F46E5]" strokeWidth={2.2} />}
          label="12 chits → orders"
        />
        <Chip
          className="li-route-chip li-route-chip-3 absolute right-[4%] top-[14%]"
          icon={<Target size={11} className="text-[#4F46E5]" strokeWidth={2.2} />}
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
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#ECEEF2] shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${className}`}
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
      id="intelligence"
      ref={sectionRef}
      className="relative lp-section-paper py-24 md:py-32 lg:py-36 overflow-hidden"
      aria-label="Ledge Intelligence"
    >
      <div className="relative max-w-6xl mx-auto px-6 md:px-8 lg:px-10">
        {/* Eyebrow — same primitive as every other section */}
        <AnimateIn variant="blurFadeUp">
          <div className="flex justify-center">
            <span className="lp-eyebrow">Ledge Intelligence · Coming Q3 2026</span>
          </div>
        </AnimateIn>

        {/* Headline — aligned to Outcome's rhythm */}
        <AnimateIn variant="blurFadeUp" delay={0.06}>
          <h2 className="font-heading font-semibold text-center text-[#0A0F1C] tracking-[-0.022em] leading-[1.1] text-[32px] md:text-[40px] mt-6">
            Ledge{" "}
            <span className="lp-pill-accent font-semibold">
              <span className="relative z-[2]">Intelligence</span>
            </span>
            <span className="ml-[-2px]">.</span>
          </h2>
        </AnimateIn>

        {/* Sub-headline */}
        <AnimateIn variant="blurFadeUp" delay={0.12}>
          <p className="mt-5 text-center font-body text-[#475569] text-[17px] leading-[1.55] max-w-2xl mx-auto">
            Your always-on AI that thinks alongside you.
          </p>
        </AnimateIn>

        {/* Live route visual */}
        <AnimateIn variant="fadeIn" delay={0.18}>
          <div className="my-14 md:my-16">
            <LiveRoute />
          </div>
        </AnimateIn>

        {/* Capability cards — Features grid system 1:1 */}
        <StaggerContainer
          staggerTime={0.06}
          className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6 max-w-4xl mx-auto auto-rows-fr"
        >
          {capabilities.map((c) => {
            const Icon = c.icon;
            if (c.hero) {
              return (
                <StaggerItem key={c.title}>
                  <div className="lp-bento-hero lp-card-premium p-7 h-full flex flex-col">
                    <div className="flex items-center gap-2 mb-5">
                      <span className="lp-live-dot" />
                      <span className="font-body text-[11px] uppercase tracking-[0.14em] text-[#3730A3] font-semibold">
                        Featured
                      </span>
                    </div>
                    <h3 className="font-heading font-semibold text-[17px] text-[#0A0F1C] mb-2 tracking-tight">
                      {c.title}
                    </h3>
                    <p className="font-body text-[14px] text-[#475569] leading-[1.55]">
                      {c.desc}
                    </p>
                    <div className="mt-auto pt-6">
                      <p className="font-body text-[12.5px] text-[#3B3F66] tracking-tight">
                        Snap chit
                        <span className="text-[#94A3B8] mx-1.5">·</span>
                        <span className="font-heading font-semibold text-[#0A0F1C]">Order draft</span>
                        <span className="text-[#94A3B8] mx-1.5">·</span>
                        <span className="font-heading font-semibold text-[#0A0F1C]">~6 sec</span>
                      </p>
                    </div>
                  </div>
                </StaggerItem>
              );
            }
            return (
              <StaggerItem key={c.title}>
                <div className="lp-card lp-card-premium p-7 h-full flex flex-col">
                  <div className="lp-icon-tile lp-icon-premium mb-5" style={{ width: 36, height: 36 }}>
                    <Icon size={17} strokeWidth={1.75} className="text-[#1F2937]" />
                  </div>
                  <h3 className="font-heading font-semibold text-[17px] text-[#0A0F1C] mb-2 tracking-tight">
                    {c.title}
                  </h3>
                  <p className="font-body text-[14px] text-[#64748B] leading-[1.55]">
                    {c.desc}
                  </p>
                </div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>

        {/* Founding 100 offer — converts the passive line into a real CTA surface */}
        <AnimateIn variant="blurFadeUp" delay={0.3}>
          <div className="mt-14 md:mt-16 max-w-4xl mx-auto">
            <motion.div
              whileHover={{ y: -2 }}
              transition={{ type: "spring", stiffness: 280, damping: 22 }}
              className="lp-bento-hero lp-card-premium p-6 md:p-7 flex flex-col md:flex-row md:items-center gap-5 md:gap-6"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-3">
                  <span className="lp-live-dot" />
                  <span className="font-body text-[11px] uppercase tracking-[0.14em] text-[#3730A3] font-semibold">
                    Limited · Founding 100
                  </span>
                </div>
                <p className="font-heading font-semibold text-[#0A0F1C] text-[18px] md:text-[20px] tracking-[-0.012em] leading-[1.3]">
                  Lock in <span className="text-[#3730A3]">6 months free</span> when Intelligence launches.
                </p>
                <p className="font-body text-[13.5px] md:text-[14px] text-[#475569] leading-[1.55] mt-1.5">
                  Today's customers are auto-enrolled. After 100 spots, this offer closes.
                </p>
              </div>
              <div className="shrink-0">
                <CapsuleCTA to="/signup" variant="dark">Claim my spot</CapsuleCTA>
              </div>
            </motion.div>
          </div>
        </AnimateIn>
      </div>
    </section>
  );
}
