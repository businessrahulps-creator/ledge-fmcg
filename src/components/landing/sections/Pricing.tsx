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
    <section id="pricing" className="bg-[#F5F6F8] py-28 md:py-36">
      <div className="max-w-7xl mx-auto px-6">
        <AnimateIn variant="blurFadeUp">
          <div className="text-center mb-4 max-w-3xl mx-auto">
            <span className="inline-block font-body text-[12px] font-semibold tracking-[0.18em] text-[#2563EB] uppercase mb-4">
              Pricing
            </span>
            <h2 className="font-heading font-extrabold text-[32px] md:text-[52px] text-[#0A0F1C] tracking-[-0.04em] leading-[1.05]">
              Start free. Pay when it's
              <br />
              running your business.
            </h2>
            <p className="font-body text-[16px] md:text-[18px] text-[#64748B] mt-6">
              Competitors charge ₹5,000–₹15,000+ for less. <span className="text-[#0A0F1C] font-semibold">30-day free trial. No card. Cancel anytime.</span>
            </p>
          </div>
        </AnimateIn>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto mt-14">
          {plans.map((plan) => (
            <StaggerItem key={plan.name}>
              <motion.div
                className={`relative bg-white rounded-2xl p-8 flex flex-col h-full ${
                  plan.highlighted
                    ? "border-2 border-transparent"
                    : "border border-[#E5E7EB]"
                }`}
                style={
                  plan.highlighted
                    ? {
                        backgroundImage:
                          "linear-gradient(white, white), linear-gradient(135deg, #7C3AED 0%, #2563EB 100%)",
                        backgroundOrigin: "border-box",
                        backgroundClip: "padding-box, border-box",
                        boxShadow: "0 24px 60px -16px rgba(124,58,237,0.25)",
                      }
                    : { boxShadow: "0 1px 3px rgba(10,15,28,0.04)" }
                }
                whileHover={{ y: -4 }}
                transition={{ type: "spring", damping: 20, stiffness: 300 }}
              >
                {plan.highlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 brand-gradient-cool-bg text-white text-xs font-semibold px-4 py-1 rounded-full whitespace-nowrap">
                    Most Popular
                  </span>
                )}

                <div className="w-11 h-11 rounded-xl bg-[#F5F6F8] flex items-center justify-center mb-5">
                  <plan.icon size={22} strokeWidth={1.75} className={plan.highlighted ? "text-[#7C3AED]" : "text-[#0A0F1C]"} />
                </div>

                <h3 className="font-heading font-bold text-[20px] text-[#0A0F1C] tracking-tight">{plan.name}</h3>
                <p className="font-body text-[14px] text-[#64748B] mt-1">{plan.tagline}</p>

                <div className="mt-4">
                  {plan.price === "Custom" ? (
                    <span className="font-heading font-extrabold text-[36px] text-[#0A0F1C] tracking-[-0.03em]">Custom</span>
                  ) : (
                    <>
                      <span className="text-[#64748B] text-base font-normal">{plan.priceLabel}</span>
                      <span className="font-heading font-extrabold text-[40px] text-[#0A0F1C] tracking-[-0.03em]">{plan.price}</span>
                      <span className="text-[#64748B] text-base font-normal">{plan.period}</span>
                    </>
                  )}
                </div>

                <div className="mt-6 space-y-2.5 flex-1">
                  {plan.features.map((f) => (
                    <div key={f} className="flex items-start gap-2.5">
                      <Check size={16} className="text-[#06B6A4] shrink-0 mt-0.5" strokeWidth={2.5} />
                      <span className="font-body text-[14px] text-[#1F2937]">{f}</span>
                    </div>
                  ))}
                </div>

                <MotionLink
                  to="/signup"
                  whileTap={{ scale: 0.97 }}
                  transition={spring.snappy}
                  className={`mt-8 w-full py-3.5 rounded-full text-center font-semibold text-sm transition-colors duration-200 block ${
                    plan.highlighted
                      ? "bg-[#0A0F1C] text-white hover:bg-[#1F2937]"
                      : "border border-[#E5E7EB] text-[#0A0F1C] hover:border-[#0A0F1C]"
                  }`}
                >
                  {plan.cta}
                </MotionLink>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        <div className="text-center mt-12">
          <a
            href="https://wa.me/918138084689?text=Hi%2C%20I%20have%20a%20question%20about%20Ledge%20pricing"
            target="_blank"
            rel="noopener noreferrer"
            className="font-body text-[15px] text-[#0A0F1C] font-medium hover:text-[#7C3AED] transition-colors inline-block"
          >
            Need help deciding? Chat on WhatsApp →
          </a>
        </div>
      </div>
    </section>
  );
}
