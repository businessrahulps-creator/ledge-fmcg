import { MessageCircle, Table, Compass, Laptop } from "lucide-react";
import { AnimateIn } from "../AnimateIn";

const cards = [
  {
    icon: MessageCircle,
    title: "The WhatsApp Scroll",
    description:
      "It's 9pm. You're scrolling through group chats trying to piece together what your 6 salespeople sold today. One sent a photo of a handwritten list. Another typed 'sent 40 cases to Sharma ji.' A third never replied. You won't know today's real number until tomorrow. Maybe.",
  },
  {
    icon: Table,
    title: "The Sheet Nobody Trusts",
    description:
      "Somewhere, there's an Excel file. It has stock numbers from last week, payment statuses that 'someone will update,' and a pivot table only your office manager understands. When she takes leave, the whole system stops.",
  },
  {
    icon: Compass,
    title: "Decisions Made on Feeling",
    description:
      "Which dealer is growing? Which salesperson hasn't visited their territory in a week? Which product has been sitting in your Surat godown for 45 days? You don't know. Not because you don't care — because your current tools don't tell you.",
  },
  {
    icon: Laptop,
    title: "Software That Wasn't Built For You",
    description:
      "You tried Tally. You tried Zoho. Maybe your CA set something up. Your salespeople opened it once, complained, and went back to WhatsApp. The software cost ₹2 lakh. Adoption cost you more.",
  },
];

export function Problem() {
  return (
    <section className="bg-cream py-16 md:py-32">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-16">
        {/* Left — Sticky headline */}
        <div className="lg:col-span-4 lg:sticky lg:top-32 self-start">
          <AnimateIn>
            <h2 className="font-heading font-bold text-[28px] md:text-[44px] text-midnight leading-[1.08] tracking-[-0.03em]">
              You know this routine.
            </h2>
          </AnimateIn>
        </div>

        {/* Right — Pain point cards */}
        <div className="lg:col-span-8 space-y-6">
          {cards.map((card, i) => (
            <AnimateIn key={card.title} delay={i * 0.08}>
              <div className="bg-white rounded-2xl p-8 border border-fog">
                <card.icon className="text-violet mb-4" size={24} />
                <h3 className="font-heading font-bold text-[20px] text-midnight mb-3">
                  {card.title}
                </h3>
                <p className="font-body text-base text-graphite leading-[1.7]">
                  {card.description}
                </p>
              </div>
            </AnimateIn>
          ))}

          <AnimateIn delay={0.32}>
            <p className="mt-8 font-body font-medium text-lg text-violet text-center lg:text-left">
              None of this is your fault. Your tools were never designed for how
              Indian distribution actually works. Ordra was.
            </p>
          </AnimateIn>
        </div>
      </div>
    </section>
  );
}
