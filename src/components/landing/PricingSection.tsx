import { Check } from "lucide-react";
import { Link } from "react-router-dom";
import { AnimateIn } from "./AnimateIn";

const plans = [
  {
    name: "Free Trial",
    price: "₹0",
    period: period: "for 30 days",,
    features: [
      "Full access to all features",
      "Up to 3 team members",
      "Unlimited orders",
      "PDF & Excel export",
    ],
    cta: "Start free trial",
    primary: false,
  },
  {
    name: "Pro",
    price: "Custom",
    period: "pricing on request",
    features: [
      "Everything in trial",
      "Unlimited team members",
      "Priority support",
      "Advanced reports",
      "WhatsApp sharing",
    ],
    cta: "Get started",
    primary: true,
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="py-24 md:py-32 px-6">
      <div className="max-w-[1200px] mx-auto">
        <AnimateIn>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-[48px] font-bold text-[#F2F2F5] tracking-tight mb-4">
              Simple, honest pricing.
            </h2>
            <p className="text-base text-[#8888A0]">
              Start free for 30 days. No credit card required.. No credit card required.
            </p>
          </div>
        </AnimateIn>

        <div className="grid md:grid-cols-2 gap-6 max-w-[832px] mx-auto">
          {plans.map((plan, i) => (
            <AnimateIn key={plan.name} delay={i * 0.15}>
              <div
                className={`rounded-xl p-8 h-full flex flex-col ${
                  plan.primary
                    ? "bg-[#16161F] border border-[#3D6FFF]"
                    : "bg-[#0F0F18] border border-[#1E1E2C]"
                }`}
              >
                <div className="text-sm text-[#8888A0] font-medium mb-2">{plan.name}</div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-4xl font-bold text-[#F2F2F5]">{plan.price}</span>
                </div>
                <div className="text-sm text-[#55556A] mb-8">{plan.period}</div>

                <div className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <div key={f} className="flex items-center gap-3 text-sm text-[#8888A0]">
                      <Check size={16} className="text-[#3D6FFF] shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>

                <Link
                  to="/signup"
                  className={`h-12 rounded-xl font-medium text-sm flex items-center justify-center transition-all duration-150 hover:scale-[1.02] ${
                    plan.primary
                      ? "bg-[#3D6FFF] text-white hover:bg-[#5585FF]"
                      : "border border-[#1E1E2C] text-[#F2F2F5] hover:border-[#2E2E3E]"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            </AnimateIn>
          ))}
        </div>
      </div>
    </section>
  );
}
