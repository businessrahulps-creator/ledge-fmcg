import { MessageCircle, Table, Compass, Laptop } from "lucide-react";
import { AnimateIn } from "../AnimateIn";

const cards = [
  {
    icon: MessageCircle,
    title: "The WhatsApp chain you have to decode every evening.",
    description:
      "Your salesperson sends a voice note. Your office manager transcribes it wrong. The dealer says a different number. By 9 PM you've made four calls and you still don't know what actually sold today. This isn't a communication problem. It's a missing system.",
  },
  {
    icon: Table,
    title: "The Excel file that's always one version behind.",
    description:
      "Orders in one sheet. Payments in another. Stock in a third. None of them talk to each other. None of them update in real time. And when your accountant goes on leave, everything stops — because the whole operation lives inside one person's laptop.",
  },
  {
    icon: Compass,
    title: "You find out a godown ran out after the dealer already complained.",
    description:
      "No alert. No signal. By the time you know, the order is lost and the relationship is bruised. You're making restocking decisions based on what you remember from last week's call, not actual numbers. Gut feeling is expensive when you're managing multiple locations.",
  },
  {
    icon: Laptop,
    title: "The enterprise software your team opened twice and abandoned.",
    description:
      "₹40,000 a year. Six-hour onboarding sessions. A system so complicated your field salesperson gave up after the second visit and went straight back to WhatsApp. The software wasn't wrong for everyone — just wrong for how distribution businesses in India actually run.",
  },
];

export function Problem() {
  return (
    <section className="bg-violet-50/30 py-16 md:py-32">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-16">
        {/* Left — Sticky headline */}
        <div className="lg:col-span-4 lg:sticky lg:top-32 self-start">
          <AnimateIn>
            <h2 className="font-heading font-bold text-[28px] md:text-[44px] text-midnight leading-[1.08] tracking-[-0.03em]">
              Distribution is complex enough. Your software shouldn't make it worse.
            </h2>
          </AnimateIn>
        </div>

        {/* Right — Pain point cards */}
        <div className="lg:col-span-8 space-y-6">
          {cards.map((card, i) => (
            <AnimateIn key={card.title} delay={i * 0.08}>
              <div className="bg-white rounded-2xl p-8 border border-indigo-100">
                <card.icon className="text-accent-indigo mb-4" size={24} />
                <h3 className="font-heading font-bold text-[20px] text-midnight mb-3">
                  {card.title}
                </h3>
                <p className="font-body text-base text-graphite leading-[1.7]">
                  {card.description}
                </p>
              </div>
            </AnimateIn>
          ))}
        </div>
      </div>
    </section>
  );
}
