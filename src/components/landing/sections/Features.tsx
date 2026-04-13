import { BarChart3, ClipboardCheck, Users, Package, IndianRupee, CloudOff } from "lucide-react";
import { AnimateIn } from "../AnimateIn";

const features = [
  {
    icon: BarChart3,
    title: "Your entire business on one dashboard.",
    description:
      "Today's revenue, orders placed, pending dispatch, delivery rate - the moment you log in. Pull-to-refresh on mobile. Weekly revenue chart to spot patterns. No morning call to the office. No waiting for someone to send you a file.",
  },
  {
    icon: ClipboardCheck,
    title: "Orders that move through their full lifecycle - tracked.",
    description:
      "Pending → Dispatched → Delivered. Each step logged with who did what and when. Vehicle number, driver name, dispatch date, remarks - all captured. Stock deducts from the assigned godown the moment dispatch is marked. Nothing falls out of the system.",
  },
  {
    icon: Users,
    title: "Complete intelligence on every dealer you work with.",
    description:
      "Lifetime value. Outstanding amount. Full order history. Payment history. Credit limit. GSTIN. Bank details. Everything on one profile page. Your salesperson walks into a dealer meeting knowing exactly where things stand - what they owe, what they usually buy, when they last ordered.",
  },
  {
    icon: Package,
    title: "Every godown. Every SKU. Color-coded by health.",
    description:
      "Green, Amber, Red - per product, per warehouse, against thresholds you set. When something is about to run out, you know before the dealer calls. Stock movements are logged against every dispatch. Your accountant sees value summaries. Your ops team sees quantities. Right access for the right role.",
  },
  {
    icon: IndianRupee,
    title: "Payments tracked the way Indian distribution actually works.",
    description:
      "Cash. UPI. Cheque. Bank transfer. Each payment mode captured against each order. Outstanding balances update as collections come in. Your accountant reconciles from the same system your salesperson used to take the order - not from a separate sheet built the next morning.",
  },
  {
    icon: CloudOff,
    title: "Schemes, targets, claims - the whole ops layer, not just orders.",
    description:
      "Run percentage discounts, flat deals, or buy-X-get-Y-free schemes on any product or dealer combination, with validity dates and minimum order values. Set daily, weekly, or monthly targets for each salesperson. Log damage or return claims against orders and resolve them with a workflow - stock restores automatically when you approve.",
  },
];

export function Features() {
  return (
    <section id="features" className="bg-violet-50/20 py-16 md:py-32">
      <div className="max-w-7xl mx-auto px-6">
        <AnimateIn>
          <h2 className="font-heading font-bold text-[28px] md:text-[44px] text-midnight text-center mb-16 tracking-[-0.03em]">
            Built for the way Indian distribution businesses actually run. Not for how someone in a boardroom imagined they do.
          </h2>
        </AnimateIn>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <AnimateIn key={feature.title} delay={i * 0.08}>
              <div className="bg-white border border-indigo-100 rounded-2xl p-8 transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-200">
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
