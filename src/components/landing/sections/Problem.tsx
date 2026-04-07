import { MessageCircle, Table, Compass, Laptop } from "lucide-react";
import { AnimateIn } from "../AnimateIn";

const cards = [
  {
    icon: MessageCircle,
    title: "The WhatsApp puzzle",
    description:
      "You spend your evenings deciphering text messages and handwritten notes just to calculate the day's business. You never know the actual revenue until the next morning.",
  },
  {
    icon: Table,
    title: "The fragile spreadsheet",
    description:
      "Your inventory and payment data live in a static file that is always outdated. When your office manager takes a day off, your entire operational flow grinds to a halt.",
  },
  {
    icon: Compass,
    title: "The inventory blind spot",
    description:
      "You have no immediate way of knowing which warehouse is stocking out or which items are sitting idle. You make critical inventory decisions based entirely on gut feeling.",
  },
  {
    icon: Laptop,
    title: "The adoption failure",
    description:
      "You paid for expensive enterprise software, but your field team found it too complicated. You ended up paying a premium for a system your own people abandoned.",
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
              <div className="bg-white rounded-2xl p-8 border border-fog">
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
