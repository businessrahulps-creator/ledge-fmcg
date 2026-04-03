import { AnimateIn } from "../AnimateIn";

const steps = [
  {
    badge: "Step 1",
    title: "Your salesperson places the order.",
    description:
      "They open Ordra on their phone — it works like an app, no Play Store needed. Select the dealer, tap the products, confirm pricing. Done in under a minute. Even if they're in a village with no signal, it saves locally and syncs the moment connectivity returns.",
    placeholder: "Order Creation Screenshot",
    reversed: false,
  },
  {
    badge: "Step 2",
    title: "You see everything, instantly.",
    description:
      "The order appears on your dashboard. Revenue updates. Pending count changes. That dealer's order history grows. No phone call. No WhatsApp message. No delay. You see what your team sold today the same way you check the weather — just open the app.",
    placeholder: "Dashboard KPI Screenshot",
    reversed: true,
  },
  {
    badge: "Step 3",
    title: "You spot what matters before it becomes a problem.",
    description:
      "Your Surat godown is at 12% stock on your best-selling SKU. Your newest salesperson hasn't logged an order in 3 days. A dealer's payment has been partial for 2 weeks. Ordra surfaces these things. You act on data, not hunches.",
    placeholder: "Stock Health Screenshot",
    reversed: false,
  },
];

export function HowItWorks() {
  return (
    <section className="bg-white py-16 md:py-32">
      <div className="max-w-7xl mx-auto px-6">
        <AnimateIn>
          <h2 className="font-heading font-bold text-[28px] md:text-[44px] text-midnight text-center mb-16 tracking-[-0.03em]">
            Three steps. Sixty seconds. Total clarity.
          </h2>
        </AnimateIn>

        <div className="space-y-24">
          {steps.map((step, i) => (
            <AnimateIn key={step.badge} delay={i * 0.1}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className={step.reversed ? "lg:order-2" : ""}>
                  <span className="bg-accent-wash text-accent-indigo text-sm font-semibold px-3 py-1 rounded-full inline-block mb-4">
                    {step.badge}
                  </span>
                  <h3 className="font-heading font-bold text-[24px] md:text-[28px] text-midnight">
                    {step.title}
                  </h3>
                  <p className="font-body text-[17px] text-graphite leading-[1.7] mt-4">
                    {step.description}
                  </p>
                </div>
                <div className={step.reversed ? "lg:order-1" : ""}>
                  <div className="bg-snow rounded-2xl aspect-video border border-fog flex items-center justify-center">
                    <span className="font-body text-sm text-silver">
                      {step.placeholder}
                    </span>
                  </div>
                </div>
              </div>
            </AnimateIn>
          ))}
        </div>
      </div>
    </section>
  );
}
