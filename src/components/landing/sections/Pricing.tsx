import { Check, Gift, TrendingUp, Layers, Building2 } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { AnimateIn, StaggerContainer, StaggerItem } from "../AnimateIn";
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
  {
    name: "Enterprise",
    icon: Building2,
    price: "Custom",
    priceLabel: "",
    period: "",
    tagline: "Large operations, custom integrations.",
    features: [
      "Everything in Scale",
      "Tally / SAP integration",
      "Multi-brand workspaces",
      "On-premise option",
      "Dedicated onboarding",
      "SLA support",
    ],
    cta: "Talk to Us",
    highlighted: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="relative bg-white py-24 md:py-32 lg:py-36 overflow-hidden">
      <div className="relative max-w-6xl mx-auto px-6 md:px-8 lg:px-10">
        <AnimateIn variant="blurFadeUp">
          <div className="text-center mb-16 md:mb-20 max-w-3xl mx-auto">
            <span className="lp-eyebrow">Pricing</span>
            <h2 className="font-heading font-semibold text-[30px] md:text-[40px] text-[#0A0F1C] tracking-[-0.022em] leading-[1.1] mt-6">
              Start free. Pay when it's
              <br />
              running your business.
            </h2>
            <p className="font-body text-[15px] md:text-[17px] text-[#64748B] mt-6 leading-[1.55]">
              Competitors charge ₹5,000–₹15,000+ for less. <span className="text-[#0A0F1C] font-semibold">30-day free trial. No card. Cancel anytime.</span>
            </p>
          </div>
        </AnimateIn>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6 max-w-6xl mx-auto" staggerTime={0.05}>
          {plans.map((plan) => (
            <StaggerItem key={plan.name}>
              <div className="relative h-full">
                <div
                  className={`relative ${plan.highlighted ? "lp-bento-hero" : "lp-card"} p-7 flex flex-col h-full`}
                >
                  {plan.highlighted && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-white text-[11px] font-semibold px-3.5 py-1 rounded-full whitespace-nowrap tracking-[0.04em] bg-[#0A0F1C]">
                      Most Popular
                    </span>
                  )}

                  <div className={`lp-icon-tile mb-5 ${plan.highlighted ? "lp-icon-tile-accent" : ""}`} style={plan.highlighted ? { background: "rgba(255,255,255,0.85)", borderColor: "rgba(255,255,255,0.95)" } : undefined}>
                    <plan.icon size={20} strokeWidth={1.75} className={plan.highlighted ? "text-[#4F46E5]" : "text-[#1F2937]"} />
                  </div>

                  <h3 className="font-heading font-semibold text-[19px] text-[#0A0F1C] tracking-tight">{plan.name}</h3>
                  <p className={`font-body text-[13.5px] mt-1 ${plan.highlighted ? "text-[#3B3F66]" : "text-[#64748B]"}`}>{plan.tagline}</p>

                  {plan.highlighted ? (
                    <div className="lp-glass-micro mt-5 px-5 py-4 flex items-baseline">
                      <span className="text-[#94A3B8] text-[15px] font-normal mr-0.5">{plan.priceLabel}</span>
                      <span className="font-heading font-semibold text-[40px] text-[#0A0F1C] tracking-[-0.025em] leading-none">{plan.price}</span>
                      <span className="text-[#94A3B8] text-[14px] font-normal ml-1">{plan.period}</span>
                    </div>
                  ) : (
                    <div className="mt-4 flex items-baseline">
                      {plan.price === "Custom" ? (
                        <span className="font-heading font-semibold text-[36px] text-[#0A0F1C] tracking-[-0.025em]">Custom</span>
                      ) : (
                        <>
                          <span className="text-[#94A3B8] text-[15px] font-normal mr-0.5">{plan.priceLabel}</span>
                          <span className="font-heading font-semibold text-[40px] text-[#0A0F1C] tracking-[-0.025em] leading-none">{plan.price}</span>
                          <span className="text-[#94A3B8] text-[14px] font-normal ml-1">{plan.period}</span>
                        </>
                      )}
                    </div>
                  )}

                  <div className="mt-6 space-y-2.5 flex-1">
                    {plan.features.map((f) => (
                      <div key={f} className="flex items-start gap-2.5">
                        <span className={`shrink-0 mt-0.5 w-4 h-4 rounded-full flex items-center justify-center border ${plan.highlighted ? "bg-white border-white" : "bg-[#F4F4F8] border-[#ECEEF2]"}`}>
                          <Check size={10} className={plan.highlighted ? "text-[#4F46E5]" : "text-[#0A0F1C]"} strokeWidth={3} />
                        </span>
                        <span className="font-body text-[13.5px] text-[#1F2937] leading-[1.45]">{f}</span>
                      </div>
                    ))}
                  </div>

                  <MotionLink
                    to="/signup"
                    whileTap={{ scale: 0.97 }}
                    transition={spring.snappy}
                    className={`mt-7 w-full py-3 rounded-full text-center font-semibold text-[13.5px] transition-colors duration-200 block ${
                      plan.highlighted
                        ? "lp-btn-primary-dark text-white"
                        : "border border-[#ECEEF2] text-[#0A0F1C] hover:border-[#0A0F1C] bg-white"
                    }`}
                  >
                    {plan.cta}
                  </MotionLink>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        <div className="text-center mt-14 md:mt-16">
          <a
            href="https://wa.me/918138084689?text=Hi%2C%20I%20have%20a%20question%20about%20Ledge%20pricing"
            target="_blank"
            rel="noopener noreferrer"
            className="font-body text-[14px] text-[#0A0F1C] font-medium hover:text-[#4F46E5] transition-colors inline-block"
          >
            Need help deciding? Chat on WhatsApp →
          </a>
        </div>
      </div>
    </section>
  );
}
