import { Check } from "lucide-react";
import { Link } from "react-router-dom";
import { AnimateIn } from "../AnimateIn";

const plans = [
  {
    name: "Free",
    price: "0",
    priceLabel: "₹",
    period: "/month",
    features: [
      "Up to 3 users",
      "50 orders/month",
      "1 warehouse",
      "Basic dashboard",
    ],
    cta: "Start Free",
    highlighted: false,
    ctaStyle: "border border-indigo-200 text-indigo-700 hover:border-indigo-400",
  },
  {
    name: "Growth",
    price: "2,499",
    priceLabel: "₹",
    period: "/month",
    features: [
      "Up to 15 users",
      "Unlimited orders",
      "Multi-warehouse stock",
      "Dealer analytics",
      "Payment tracking",
    ],
    cta: "Start 14-Day Trial",
    highlighted: true,
    ctaStyle: "bg-indigo-600 text-white hover:bg-indigo-700",
  },
  {
    name: "Scale",
    price: "5,999",
    priceLabel: "₹",
    period: "/month",
    features: [
      "Unlimited users",
      "Everything in Growth",
      "Advanced reports",
      "Custom permissions",
      "Dedicated support",
    ],
    cta: "Start 14-Day Trial",
    highlighted: false,
    ctaStyle: "border border-indigo-200 text-indigo-700 hover:border-indigo-400",
  },
  {
    name: "Enterprise",
    price: "Custom",
    priceLabel: "",
    period: "",
    features: [
      "Custom integrations (Tally, SAP)",
      "Multi-brand support",
      "On-premise option",
    ],
    cta: "Talk to Us",
    highlighted: false,
    ctaStyle: "border border-indigo-200 text-indigo-700 hover:border-indigo-400",
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="bg-white py-16 md:py-32">
      <div className="max-w-7xl mx-auto px-6">
        <AnimateIn>
          <h2 className="font-heading font-bold text-[28px] md:text-[44px] text-midnight text-center mb-2 tracking-[-0.03em]">
            Simple pricing. Start free. Grow when ready.
          </h2>
          <p className="font-body text-lg text-lp-zinc text-center mb-16">
            No setup fees. No annual lock-in. Cancel anytime.
          </p>
        </AnimateIn>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {plans.map((plan, i) => (
            <AnimateIn key={plan.name} delay={i * 0.08}>
              <div
                className={`bg-white rounded-2xl p-8 flex flex-col h-full ${
                  plan.highlighted
                    ? "border-2 border-indigo-500 relative shadow-[0_0_20px_rgba(79,70,229,0.1)]"
                    : "border border-indigo-100"
                }`}
              >
                {plan.highlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-semibold px-4 py-1 rounded-full whitespace-nowrap">
                    Most Popular
                  </span>
                )}

                <h3 className="font-heading font-bold text-[20px] text-midnight">
                  {plan.name}
                </h3>

                <div className="mt-2">
                  {plan.price === "Custom" ? (
                    <span className="font-heading font-extrabold text-[36px] text-midnight">
                      Custom
                    </span>
                  ) : (
                    <>
                      <span className="text-lp-zinc text-base font-normal">
                        {plan.priceLabel}
                      </span>
                      <span className="font-heading font-extrabold text-[36px] text-midnight">
                        {plan.price}
                      </span>
                      <span className="text-lp-zinc text-base font-normal">
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
                        className="text-emerald-500 shrink-0 mt-0.5"
                      />
                      <span className="font-body text-[15px] text-graphite">
                        {f}
                      </span>
                    </div>
                  ))}
                </div>

                <Link
                  to="/signup"
                  className={`mt-8 w-full py-3 rounded-full text-center font-semibold text-sm transition-all duration-200 block ${plan.ctaStyle}`}
                >
                  {plan.cta}
                </Link>
              </div>
            </AnimateIn>
          ))}
        </div>

        <div className="text-center mt-10 space-y-2">
          <p className="font-body text-[15px] text-lp-zinc">
            All plans include PWA install and automatic updates.
          </p>
          <p className="font-body text-[15px] text-accent-indigo font-medium hover:underline cursor-pointer">
            Need help choosing? Chat on WhatsApp
          </p>
        </div>
      </div>
    </section>
  );
}
