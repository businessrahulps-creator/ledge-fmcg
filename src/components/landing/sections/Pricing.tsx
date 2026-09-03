import { Check, Gift, TrendingUp, Layers } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { AnimateIn } from "../AnimateIn";
import { PressableCard } from "../PressableCard";
import { spring } from "@/lib/motion";

const MotionLink = motion.create(Link);

const plans = [
  {
    name: "Free",
    icon: Gift,
    price: "0",
    priceLabel: "₹",
    period: "/month",
    tagline: "Try it on your business.",
    features: ["3 users", "50 orders / month", "1 warehouse", "Dashboard + orders", "Dealer catalogue"],
    cta: "Start Free",
    highlighted: false,
  },
  {
    name: "Growth",
    icon: TrendingUp,
    price: "2,499",
    priceLabel: "₹",
    period: "/month",
    tagline: "Replace the spreadsheet.",
    features: [
      "Up to 15 users",
      "Unlimited orders",
      "Multi-warehouse stock alerts",
      "Full dealer profiles",
      "Payment tracking, all modes",
      "Schemes & targets",
      "GST invoices, PDFs",
      "CSV reports",
    ],
    cta: "Start Free Trial",
    highlighted: true,
  },
  {
    name: "Scale",
    icon: Layers,
    price: "5,999",
    priceLabel: "₹",
    period: "/month",
    tagline: "Multiple teams, serious volume.",
    features: [
      "Unlimited users",
      "Everything in Growth",
      "5 report modules",
      "Targets per salesperson",
      "Claims & returns workflow",
      "Secondary sales tracking",
      "Audit trail",
      "Priority support",
    ],
    cta: "Start Free Trial",
    highlighted: false,
  },
];

export function Pricing() {
  const reduce = useReducedMotion();
  return (
    <section id="pricing" className="relative lp-section-paper lp-rhythm-lg overflow-hidden">
      <div className="relative max-w-6xl mx-auto px-6 md:px-8 lg:px-10">
        <AnimateIn variant="blurFadeUp">
          <div className="text-center mb-12 md:mb-14 max-w-3xl mx-auto">
            <span className="lp-eyebrow">Pricing</span>
            <h2 className="font-heading font-semibold text-[30px] md:text-[40px] text-foreground tracking-[-0.022em] leading-[1.1] mt-6">
              The offer that makes saying no
              <br />
              feel irrational.
            </h2>
            <p className="font-body text-[15px] md:text-[17px] text-muted-foreground mt-6 leading-[1.55]">
              Competitors charge ₹5,000–₹15,000+. Ledge delivers more for 50–80% less.
              <br className="hidden md:inline" />
              <span className="text-foreground font-medium"> Commit 1 year → pay only 10 months. Two months free.</span>
            </p>

            {/* Subtle benefits chip */}
            <div className="flex justify-center mt-6">
              <span className="lp-pricing-trust-chip">
                <span className="lp-pricing-trust-chip__item">
                  <Check size={12} strokeWidth={3} className="text-success" />
                  30-day free trial
                </span>
                <span className="lp-pricing-trust-chip__divider" />
                <span className="lp-pricing-trust-chip__item">
                  <Check size={12} strokeWidth={3} className="text-success" />
                  No card
                </span>
                <span className="lp-pricing-trust-chip__divider" />
                <span className="lp-pricing-trust-chip__item">
                  <Check size={12} strokeWidth={3} className="text-success" />
                  Cancel anytime
                </span>
              </span>
            </div>
          </div>
        </AnimateIn>

        {/* Motion v3 — cards are still on entrance; presence over performance.
            Hover/tap = unified 120ms intent. Highlighted card gets the only ambient delight on the page. */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6 max-w-5xl mx-auto pt-4 lp-grid-stretch">
          {plans.map((plan, i) => {
            const tintMidnight = i === 2;     // Scale → Midnight authority
            const cardClass = plan.highlighted
              ? "lp-card lp-card--xl border border-primary/40 shadow-depth-8"
              : tintMidnight
              ? "lp-card lp-card--ink"
              : "lp-card";
            return (
              <PressableCard key={plan.name} className="relative h-full">
                <div
                  className={`relative ${cardClass} p-7 flex flex-col h-full`}
                  style={plan.highlighted ? { overflow: "visible" } : undefined}
                >
                  {plan.highlighted && (
                    <>
                      {/* Slow breathing glow — the one "delight" moment on the page. */}
                      <motion.span
                        aria-hidden
                        className="pointer-events-none absolute -inset-px rounded-[inherit]"
                        style={{
                          boxShadow: "0 0 0 1px hsl(var(--primary) / 0.35), 0 30px 80px -30px hsl(var(--primary) / 0.45)",
                        }}
                        animate={reduce ? undefined : { opacity: [0.55, 1, 0.55] }}
                        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                      />
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-primary-foreground text-[11px] font-semibold px-3.5 py-1 rounded-full whitespace-nowrap tracking-[0.04em] bg-primary shadow-depth-4 z-10">
                        Most Popular
                      </span>
                    </>
                  )}

                  <div
                    className={`lp-icon-tile lp-icon-premium mb-5 ${plan.highlighted ? "lp-icon-tile-accent" : ""}`}
                    style={plan.highlighted ? { background: "rgba(255,255,255,0.85)", borderColor: "rgba(255,255,255,0.95)" } : undefined}
                  >
                    <plan.icon size={20} strokeWidth={1.75} className={plan.highlighted ? "text-primary" : "text-foreground"} />
                  </div>

                  <h3 className="font-heading font-semibold text-[19px] text-foreground tracking-tight">{plan.name}</h3>
                  <p className="font-body text-[13.5px] mt-1 text-muted-foreground">{plan.tagline}</p>

                  <div className="mt-5 flex items-baseline">
                    {plan.price === "Custom" ? (
                      <span className="font-heading font-semibold text-[36px] text-foreground tracking-[-0.025em] leading-none">Custom</span>
                    ) : (
                      <>
                        {plan.priceLabel && (
                          <span className="font-heading font-semibold text-[22px] text-foreground mr-0.5 leading-none">{plan.priceLabel}</span>
                        )}
                        <span className="font-heading font-semibold text-[40px] text-foreground tracking-[-0.025em] leading-none">{plan.price}</span>
                        <span className="text-muted-foreground text-[14px] font-normal ml-1">{plan.period}</span>
                      </>
                    )}
                  </div>

                  <div className="mt-6 space-y-2.5 flex-1">
                    {plan.features.map((f) => (
                      <div key={f} className="flex items-start gap-2.5">
                        <span className={`shrink-0 mt-0.5 w-4 h-4 rounded-full flex items-center justify-center border ${
                          plan.highlighted ? "bg-white border-white" :
                          tintMidnight ? "bg-white/15 border-white/25" :
                          "bg-secondary border-border"
                        }`}>
                          <Check size={10} className={plan.highlighted ? "text-primary" : tintMidnight ? "text-primary-foreground" : "text-foreground"} strokeWidth={3} />
                        </span>
                        <span className="font-body text-[13.5px] text-foreground leading-[1.45]">{f}</span>
                      </div>
                    ))}
                  </div>

                  <MotionLink
                    to="/signup"
                    whileTap={{ scale: 0.97 }}
                    transition={spring.snappy}
                    className={`mt-7 w-full py-3 rounded-full text-center font-semibold text-[13.5px] transition-colors duration-200 block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                      plan.highlighted
                        ? "lp-btn-primary-dark"
                        : tintMidnight
                        ? "bg-white text-primary hover:bg-white/90"
                        : "border border-border text-foreground hover:border-primary bg-card"
                    }`}
                  >
                    {plan.cta}
                  </MotionLink>
                </div>
              </PressableCard>
            );
          })}
        </div>

        <div className="text-center mt-14 md:mt-16">
          <a
            href="https://wa.me/918714249485?text=Hi%2C%20I%27d%20like%20to%20discuss%20a%20custom%20Ledge%20plan%20for%20my%20business."
            target="_blank"
            rel="noopener noreferrer"
            className="font-body text-[14px] text-foreground font-medium hover:text-primary transition-colors inline-block"
          >
            Need something custom — Tally/SAP, on-prem, multi-brand? Chat on WhatsApp →
          </a>
        </div>
      </div>
    </section>
  );
}
