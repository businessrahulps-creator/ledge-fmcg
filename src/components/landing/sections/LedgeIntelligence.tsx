import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useInView } from "framer-motion";
import { Camera, Sunrise, Sparkles, Mic } from "lucide-react";
import { AnimateIn, StaggerContainer, StaggerItem } from "../AnimateIn";
import { CapsuleCTA } from "../CapsuleCTA";

const capabilities = [
  {
    icon: Camera,
    title: "Photo-to-Order",
    desc: "Photograph a handwritten chit. Ledge fills the order instantly.",
    hero: true,
  },
  {
    icon: Mic,
    title: "Voice Order Entry",
    desc: "Speak the order in English or Malayalam. Done in 20 seconds.",
  },
  {
    icon: Sparkles,
    title: "Smart Scheme Suggestions",
    desc: "AI tells you who'll buy — before you pitch. The right scheme, every time.",
  },
  {
    icon: Sunrise,
    title: "Natural Language Queries",
    desc: "Ask in English or Malayalam. Get instant answers — no reports needed.",
  },
];

/**
 * LiveRoute — FMCG-native motion: a route line draws itself left→right
 * through 5 dealer stops, with a delivery pulse traveling the path on loop.
 */
function LiveRoute() {
  const reduce = useReducedMotion();

  const d = "M 40 140 C 160 60, 280 220, 420 110 S 660 60, 820 150";
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
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--accent))" />
          </linearGradient>
          <filter id="li-pulse-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.4" />
          </filter>
          <path id="li-route-ref" d={d} fill="none" />
        </defs>

        <path d={d} fill="none" stroke="hsl(var(--border))" strokeWidth="1.5" strokeLinecap="round" />

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

        {stops.map((s, i) => (
          <g key={i}>
            <circle cx={s.x} cy={s.y} r="7" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="1.5" />
            <circle cx={s.x} cy={s.y} r="2.5" fill="hsl(var(--accent))" />
          </g>
        ))}

        {!reduce && (
          <g className="li-route-pulse">
            <circle r="9" fill="hsl(var(--accent))" opacity="0.18" filter="url(#li-pulse-glow)">
              <animateMotion dur="6s" repeatCount="indefinite" rotate="auto">
                <mpath href="#li-route-ref" />
              </animateMotion>
            </circle>
            <circle r="5" fill="hsl(var(--accent))" stroke="hsl(var(--card))" strokeWidth="2">
              <animateMotion dur="6s" repeatCount="indefinite" rotate="auto">
                <mpath href="#li-route-ref" />
              </animateMotion>
            </circle>
          </g>
        )}
      </svg>

      {/* Telemetry strip — grounds the abstract route in product specifics */}
      <div className="mt-6 max-w-2xl mx-auto lp-glass-frost px-4 py-3 rounded-2xl flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[12.5px]">
        <span className="inline-flex items-center gap-1.5 text-foreground">
          <span className="font-body text-muted-foreground">Photo → Order</span>
          <span className="font-heading font-semibold tracking-tight">~6 sec</span>
        </span>
        <span className="hidden sm:inline text-[#CBD5E1]">·</span>
        <span className="inline-flex items-center gap-1.5 text-foreground">
          <span className="font-body text-muted-foreground">Briefings</span>
          <span className="font-heading font-semibold tracking-tight">06:00 IST daily</span>
        </span>
        <span className="hidden sm:inline text-[#CBD5E1]">·</span>
        <span className="inline-flex items-center gap-1.5 text-foreground">
          <span className="font-body text-muted-foreground">Voice</span>
          <span className="font-heading font-semibold tracking-tight">11 Indian languages</span>
        </span>
      </div>
    </div>
  );
}

/** Animated counter that ticks 0 → target on scroll-in. */
function ScrollCounter({ target, duration = 1400 }: { target: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const reduce = useReducedMotion();
  const [val, setVal] = useState(reduce ? target : 0);

  useEffect(() => {
    if (!inView || reduce) return;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(Math.round(eased * target));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, target, duration, reduce]);

  return <span ref={ref}>{val}</span>;
}

export function LedgeIntelligence() {
  const sectionRef = useRef<HTMLElement>(null);
  const SPOTS_CLAIMED = 87;
  const SPOTS_TOTAL = 100;
  const SPOTS_LEFT = SPOTS_TOTAL - SPOTS_CLAIMED;

  return (
    <section
      id="intelligence"
      ref={sectionRef}
      className="relative lp-section-paper py-20 md:py-28 overflow-hidden"
      aria-label="Ledge Intelligence"
    >
      <div className="relative max-w-6xl mx-auto px-6 md:px-8 lg:px-10">
        <AnimateIn variant="blurFadeUp">
          <div className="flex justify-center">
            <span className="lp-eyebrow">Ledge Intelligence</span>
          </div>
        </AnimateIn>

        <AnimateIn variant="blurFadeUp" delay={0.06}>
          <h2 className="font-heading font-semibold text-center text-foreground tracking-[-0.022em] leading-[1.1] text-[32px] md:text-[40px] mt-6">
            Ledge{" "}
            <span className="lp-pill-accent font-semibold">
              <span className="relative z-[2]">Co-Pilot</span>
            </span>
            <span className="ml-[-2px]">.</span>
          </h2>
        </AnimateIn>

        <AnimateIn variant="blurFadeUp" delay={0.1}>
          <div className="mt-4 flex justify-center">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-card border border-border text-[11.5px] font-medium text-muted-foreground shadow-depth-2">
              <span className="lp-live-dot" />
              Launching in 3 months · Founding members get early access free
            </span>
          </div>
        </AnimateIn>

        <AnimateIn variant="blurFadeUp" delay={0.16}>
          <p className="mt-5 text-center font-body text-muted-foreground text-[17px] leading-[1.55] max-w-2xl mx-auto">
            Ledge thinks. You lead.
          </p>
        </AnimateIn>

        {/* Live route + telemetry */}
        <AnimateIn variant="fadeIn" delay={0.22}>
          <div className="my-14 md:my-16">
            <LiveRoute />
          </div>
        </AnimateIn>

        {/* Capability cards */}
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
                      <span className="font-body text-[11px] uppercase tracking-[0.14em] text-accent font-semibold">
                        Featured
                      </span>
                    </div>
                    <h3 className="font-heading font-semibold text-[17px] text-foreground mb-2 tracking-tight">
                      {c.title}
                    </h3>
                    <p className="font-body text-[14px] text-muted-foreground leading-[1.55]">
                      {c.desc}
                    </p>
                    <div className="mt-auto pt-6">
                      <p className="font-body text-[12.5px] text-muted-foreground tracking-tight">
                        Snap chit
                        <span className="text-[hsl(var(--muted-foreground)/0.7)] mx-1.5">·</span>
                        <span className="font-heading font-semibold text-foreground">Order draft</span>
                        <span className="text-[hsl(var(--muted-foreground)/0.7)] mx-1.5">·</span>
                        <span className="font-heading font-semibold text-foreground">~6 sec</span>
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
                    <Icon size={17} strokeWidth={1.75} className="text-foreground" />
                  </div>
                  <h3 className="font-heading font-semibold text-[17px] text-foreground mb-2 tracking-tight">
                    {c.title}
                  </h3>
                  <p className="font-body text-[14px] text-muted-foreground leading-[1.55]">
                    {c.desc}
                  </p>
                </div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>

        {/* Founding 100 — demoted to glass-frost (single bento-hero per section rule) */}
        <AnimateIn variant="blurFadeUp" delay={0.3}>
          <div className="mt-14 md:mt-16 max-w-4xl mx-auto">
            <motion.div
              whileHover={{ y: -2 }}
              transition={{ type: "spring", stiffness: 280, damping: 22 }}
              className="lp-glass-frost lp-card-premium p-6 md:p-7 flex flex-col md:flex-row md:items-center gap-5 md:gap-6"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-3">
                  <span className="lp-live-dot" />
                  <span className="font-body text-[11px] uppercase tracking-[0.14em] text-accent font-semibold">
                    Limited · <ScrollCounter target={SPOTS_CLAIMED} /> / {SPOTS_TOTAL} spots claimed
                  </span>
                </div>
                <p className="font-heading font-semibold text-foreground text-[18px] md:text-[20px] tracking-[-0.012em] leading-[1.3]">
                  Founding 100 — lock in <span className="text-accent">6 months free</span>.
                </p>
                <p className="font-body text-[13.5px] md:text-[14px] text-muted-foreground leading-[1.55] mt-1.5">
                  Today's customers are auto-enrolled. Only {SPOTS_LEFT} spots left before this offer closes forever.
                </p>

                {/* Progress — uses existing lp-progress-glass primitive */}
                <div className="mt-4 max-w-md">
                  <div className="relative h-1.5 rounded-full bg-border overflow-hidden">
                    <motion.div
                      className="lp-progress-glass absolute inset-y-0 left-0 rounded-full"
                      initial={{ width: 0 }}
                      whileInView={{ width: `${SPOTS_CLAIMED}%` }}
                      viewport={{ once: true, margin: "-60px" }}
                      transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>
                </div>
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
