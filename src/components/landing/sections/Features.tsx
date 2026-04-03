import { LayoutGrid, ClipboardCheck, Users, Package, IndianRupee, CloudOff } from "lucide-react";
import { AnimateIn } from "../AnimateIn";

const features = [
  {
    icon: LayoutGrid,
    title: "Live Dashboard",
    description:
      "Revenue, order count, pending dispatches, completed deliveries — four numbers that tell you how your business is doing right now. Filter by day of week to find patterns: maybe Tuesdays are your weakest. Now you know.",
  },
  {
    icon: ClipboardCheck,
    title: "Complete Order Lifecycle",
    description:
      "Multi-line orders with auto-pricing from your rate list. Every order moves through Placed → Dispatched → Delivered with clear status badges. And yes — confetti when an order is complete, because small joys matter.",
  },
  {
    icon: Users,
    title: "Dealer & Sales Team Hub",
    description:
      "Every dealer card shows region, recent orders, outstanding payments, and lifetime value. Every salesperson card shows territory, today's activity, and performance trend. No more keeping this in your head.",
  },
  {
    icon: Package,
    title: "Godown-Level Stock",
    description:
      "Real inventory across multiple warehouses. Health badges — Healthy (green), Low (amber), Critical (red). Catch a stockout days before it costs you an order.",
  },
  {
    icon: IndianRupee,
    title: "Indian Payment Tracking",
    description:
      "Cash, UPI, cheque, credit — tracked the way Indian businesses actually transact. See what's paid, what's partial, what's overdue. No more maintaining a separate khata.",
  },
  {
    icon: CloudOff,
    title: "Offline-First. Everywhere.",
    description:
      "Installs like WhatsApp from a link. Takes up almost no storage. Works without internet. Your salesperson places orders offline in a village with zero signal. When connectivity returns, everything syncs. No data lost.",
  },
];

export function Features() {
  return (
    <section className="bg-midnight py-16 md:py-32">
      <div className="max-w-7xl mx-auto px-6">
        <AnimateIn>
          <h2 className="font-heading font-bold text-[28px] md:text-[44px] text-white text-center mb-4 tracking-[-0.03em]">
            Everything you need. Nothing you don't.
          </h2>
          <p className="font-body text-lg text-silver text-center mb-16">
            Built from the ground up for Indian FMCG distribution.
          </p>
        </AnimateIn>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <AnimateIn key={feature.title} delay={i * 0.08}>
              <div className="bg-onyx border border-slate-border rounded-2xl p-8 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#3F3F46]">
                <feature.icon size={24} className="text-violet mb-5" strokeWidth={1.5} />
                <h3 className="font-heading font-bold text-[20px] text-white mb-3">
                  {feature.title}
                </h3>
                <p className="font-body text-base text-silver leading-[1.65]">
                  {feature.description}
                </p>
              </div>
            </AnimateIn>
          ))}
        </div>
      </div>
    </section>
  );
}
