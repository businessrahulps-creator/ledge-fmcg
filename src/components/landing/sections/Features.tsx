import { LayoutGrid, ClipboardCheck, Users, Package, IndianRupee, CloudOff } from "lucide-react";
import { AnimateIn } from "../AnimateIn";

const features = [
  {
    icon: LayoutGrid,
    title: "Your business, at a glance",
    description:
      "Open Ordra and see four numbers: today's revenue, orders placed, pending dispatches, deliveries completed. Filter by day to spot patterns. Maybe Tuesdays are slow in your Pune territory. Now you know, and you didn't have to call anyone.",
  },
  {
    icon: ClipboardCheck,
    title: "Orders that track themselves",
    description:
      "Your salesperson selects the dealer, picks products from your rate list, confirms pricing. Done in under a minute. Every order moves through Placed → Dispatched → Delivered with clear status badges. You see it happen live.",
  },
  {
    icon: Users,
    title: "Every dealer, every salesperson, one tap",
    description:
      "Tap a dealer and see their region, last 20 orders, outstanding payments, and lifetime value. Tap a salesperson and see their territory, today's orders, and whether they've actually been active this week. No more keeping this in your head.",
  },
  {
    icon: Package,
    title: "Stock by godown, not guesswork",
    description:
      "Real inventory across multiple warehouses. Health badges: Healthy (green), Low (amber), Critical (red). Catch a stockout days before it costs you an order.",
  },
  {
    icon: IndianRupee,
    title: "Payments the way India pays",
    description:
      "Cash, UPI, cheque, credit. Tracked how your business actually works. See what's been paid, what's partial, what's overdue at a glance. Replace the separate khata you've been maintaining since 2016.",
  },
  {
    icon: CloudOff,
    title: "No signal? No problem.",
    description:
      "Your salesperson is between Indore and Ujjain. Zero signal. They open Ordra, place the order, it saves locally. The moment connectivity returns — auto sync. No data lost. No order missed. This isn't a feature we bolted on. It's the foundation.",
  },
];

export function Features() {
  return (
    <section className="bg-[#FAFAFA] py-16 md:py-32">
      <div className="max-w-7xl mx-auto px-6">
        <AnimateIn>
          <h2 className="font-heading font-bold text-[28px] md:text-[44px] text-midnight text-center mb-4 tracking-[-0.03em]">
            What your team actually gets.
          </h2>
          <p className="font-body text-lg text-graphite text-center mb-16">
            Every feature exists because an FMCG founder asked for it.
          </p>
        </AnimateIn>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <AnimateIn key={feature.title} delay={i * 0.08}>
              <div className="bg-white border border-fog rounded-2xl p-8 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#D4D4D8]">
                <feature.icon size={24} className="text-accent-indigo mb-5" strokeWidth={1.5} />
                <h3 className="font-heading font-bold text-[20px] text-midnight mb-3">
                  {feature.title}
                </h3>
                <p className="font-body text-base text-graphite leading-[1.65]">
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
