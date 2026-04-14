import { Check, Gift, TrendingUp, Layers, Building2 } from "lucide-react";
import { Link } from "react-router-dom";
import { AnimateIn } from "../AnimateIn";

const plans = [
  {
    name: "Free",
    icon: Gift,
    price: "0",
    priceLabel: "₹",
    period: "/month",
    tagline: "Try it on your actual business. No card required.",
    features: [
      "3 users",
      "50 orders per month",
      "1 warehouse",
      "Dashboard + order management",
      "Dealer and product catalogue",
    ],
    cta: "Start Free",
    highlighted: false,
    ctaStyle: "border border-[#D4D1CC] text-[#1A1A1A] hover:border-[#A8A29E]",
  },
  {
    name: "Growth",
    icon: TrendingUp,
    price: "2,499",
    priceLabel: "₹",
    period: "/month",
    tagline: "For distribution businesses ready to replace the spreadsheet.",
    features: [
      "Up to 15 users",
      "Unlimited orders",
      "Multi-warehouse inventory with stock health alerts",
      "Full dealer profiles - lifetime value, outstanding, order history",
      "Payment tracking across Cash, UPI, Cheque, Bank Transfer",
      "Promotional scheme management",
      "Sales team performance tracking",
      "CSV export for all reports",
      "All 4 GST document types with PDF generation",
    ],
    cta: "Start 14-Day Free Trial",
    highlighted: true,
    ctaStyle: "bg-[#27272A] text-white hover:bg-[#1A1A1A]",
  },
  {
    name: "Scale",
    icon: Layers,
    price: "5,999",
    priceLabel: "₹",
    period: "/month",
    tagline: "For mid-size operations managing multiple teams and serious volume.",
    features: [
      "Unlimited users",
      "Everything in Growth",
      "5 report modules - Dealer, Product, Payment, Dispatch, Sales Team",
      "Revenue and order targets per salesperson and dealer",
      "Claims and returns management with resolution workflow",
      "Secondary sales tracking (distributor to retailer)",
      "Full activity log and audit trail",
      "Custom permissions",
      "Priority support",
    ],
    cta: "Start 14-Day Free Trial",
    highlighted: false,
    ctaStyle: "border border-[#D4D1CC] text-[#1A1A1A] hover:border-[#A8A29E]",
  },
  {
    name: "Enterprise",
    icon: Building2,
    price: "Custom",
    priceLabel: "",
    period: "",
    tagline: "For large distribution operations that need dedicated setup and integrations.",
    features: [
      "Everything in Scale",
      "Tally / SAP integration",
      "Multi-brand workspace support",
      "On-premise deployment option",
      "Dedicated onboarding",
      "SLA-backed support",
    ],
    cta: "Talk to Us",
    highlighted: false,
    ctaStyle: "border border-[#D4D1CC] text-[#1A1A1A] hover:border-[#A8A29E]",
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="bg-white py-28 md:py-36">
      <div className="max-w-7xl mx-auto px-6">
        <AnimateIn>
          <h2 className="font-heading font-bold text-[24px] md:text-[34px] text-[#1A1A1A] text-center mb-2 tracking-[-0.04em]">
            Start free. Pay when it's running your business.
          </h2>
          <p className="font-body text-lg text-[#71717A] text-center mb-16">
            No setup fees. No annual lock-in. Cancel anytime. Every plan includes PWA install, offline support, and automatic updates.
          </p>
        </AnimateIn>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, i) => (
            <AnimateIn key={plan.name} delay={i * 0.08}>
              <div
                className={`bg-white rounded-3xl p-10 flex flex-col h-full ${
                  plan.highlighted
                    ? "border-2 border-[#27272A] relative"
                    : "border border-[#E8E5E0]"
                }`}
                style={{
                  boxShadow: plan.highlighted
                    ? "0 1px 3px rgba(0,0,0,0.05), 0 8px 24px rgba(0,0,0,0.06)"
                    : "0 1px 3px rgba(0,0,0,0.05), 0 4px 12px rgba(0,0,0,0.03)",
                }}
              >
                {plan.highlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#27272A] text-white text-xs font-semibold px-4 py-1 rounded-full whitespace-nowrap">
                    Most Popular
                  </span>
                )}

                <div className="w-14 h-14 rounded-full bg-[#F4F4F5] flex items-center justify-center mb-5">
                  <plan.icon size={28} strokeWidth={1.5} className="text-[#27272A]" />
                </div>

                <h3 className="font-heading font-bold text-[20px] text-[#1A1A1A]">
                  {plan.name}
                </h3>

                <p className="font-body text-sm text-[#52525B] mt-1">
                  {plan.tagline}
                </p>

                <div className="mt-3">
                  {plan.price === "Custom" ? (
                    <span className="font-heading font-extrabold text-[32px] text-[#1A1A1A]">
                      Custom
                    </span>
                  ) : (
                    <>
                      <span className="text-[#71717A] text-base font-normal">
                        {plan.priceLabel}
                      </span>
                      <span className="font-heading font-extrabold text-[32px] text-[#1A1A1A]">
                        {plan.price}
                      </span>
                      <span className="text-[#71717A] text-base font-normal">
                        {plan.period}
                      </span>
                    </>
                  )}
                </div>

                <div className="mt-6 space-y-3 flex-1">
                  {plan.features.map((f) => (
                    <div key={f} className="flex items-start gap-2">
                       <Check
                        size={16}
                        className="text-[#27272A] shrink-0 mt-0.5"
                      />
                      <span className="font-body text-[15px] text-[#52525B]">
                        {f}
                      </span>
                    </div>
                  ))}
                </div>

                <Link
                  to="/signup"
                  className={`mt-8 w-full py-3.5 rounded-2xl text-center font-semibold text-base transition-all duration-200 hover:scale-[1.01] block ${plan.ctaStyle}`}
                  style={{
                    boxShadow: plan.highlighted
                      ? "0 2px 8px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.06)"
                      : "0 1px 4px rgba(0,0,0,0.06)",
                  }}
                >
                  {plan.cta}
                </Link>
              </div>
            </AnimateIn>
          ))}
        </div>

        <div className="text-center mt-10 space-y-2">
          <p className="font-body text-[15px] text-[#71717A]">
            All plans include offline support, PWA install, automatic updates, and role-based access control.
          </p>
          <p className="font-body text-[15px] text-[#27272A] font-medium hover:underline cursor-pointer">
            Need help deciding? Chat on WhatsApp →
          </p>
        </div>
      </div>
    </section>
  );
}
