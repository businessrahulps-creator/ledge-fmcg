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
      "Orders in one sheet. Payments in another. Stock in a third. None of them talk to each other. None of them update in real time. And when your accountant goes on leave, everything stops - because the whole operation lives inside one person's laptop.",
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
      "₹40,000 a year. Six-hour onboarding sessions. A system so complicated your field salesperson gave up after the second visit and went straight back to WhatsApp. The software wasn't wrong for everyone - just wrong for how distribution businesses in India actually run.",
  },
];

export function Problem() {
  return (
    <section className="bg-[#F8F7F5] py-28 md:py-36">
      <div className="max-w-7xl mx-auto px-6">
        <AnimateIn>
          <h2 className="font-heading font-bold text-[26px] md:text-[38px] text-[#1A1A1A] text-center mb-16 leading-[1.08] tracking-[-0.04em] max-w-3xl mx-auto">
            Distribution is complex enough. Your software shouldn't make it worse.
          </h2>
        </AnimateIn>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {cards.map((card, i) => (
            <AnimateIn key={card.title} delay={i * 0.08}>
              <div className="bg-white rounded-3xl p-10 border border-[#E8E5E0] h-full flex flex-col" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05), 0 4px 12px rgba(0,0,0,0.03)" }}>
                <card.icon size={24} strokeWidth={1.5} className="text-[#0D9488] mb-4" />
                <h3 className="font-heading font-bold text-[18px] text-[#1A1A1A] mb-3">
                  {card.title}
                </h3>
                <p className="font-body text-[15px] text-[#52525B] leading-[1.7] flex-1">
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
