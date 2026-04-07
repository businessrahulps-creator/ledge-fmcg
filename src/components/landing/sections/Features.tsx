import { LayoutGrid, ClipboardCheck, Users, Package, IndianRupee, CloudOff } from "lucide-react";
import { AnimateIn } from "../AnimateIn";

const features = [
  {
    icon: LayoutGrid,
    title: "Your business, at a glance",
    description:
      "Open your dashboard to instantly track daily revenue, total orders, and dispatch statuses without calling anyone.",
  },
  {
    icon: ClipboardCheck,
    title: "Orders that track themselves",
    description:
      "Watch every order move cleanly from pending to dispatched to delivered in real time.",
  },
  {
    icon: Users,
    title: "Complete dealer intelligence",
    description:
      "Access lifetime value, outstanding payments, and past order history for any retail dealer immediately.",
  },
  {
    icon: Package,
    title: "Multi-warehouse visibility",
    description:
      "Monitor inventory health across all your locations with alerts to prevent unexpected stock-outs.",
  },
  {
    icon: IndianRupee,
    title: "Native payment tracking",
    description:
      "Track cash, UPI, and cheque collections exactly how Indian distribution businesses operate.",
  },
  {
    icon: CloudOff,
    title: "Zero-friction installation",
    description:
      "Give your field team a fast, lightweight web app that installs directly to their home screen in seconds.",
  },
];

export function Features() {
  return (
    <section id="features" className="bg-violet-50/20 py-16 md:py-32">
      <div className="max-w-7xl mx-auto px-6">
        <AnimateIn>
          <h2 className="font-heading font-bold text-[28px] md:text-[44px] text-midnight text-center mb-16 tracking-[-0.03em]">
            Built for the way your business actually runs.
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
