import { MessageCircle, Table, Compass, Laptop } from "lucide-react";
import { AnimateIn, StaggerContainer, StaggerItem } from "../AnimateIn";

const cards = [
  {
    icon: MessageCircle,
    title: "WhatsApp orders get lost",
    description: "Voice notes, paper chits, four phone calls. You still don't know what sold today.",
  },
  {
    icon: Table,
    title: "Excel is always one version behind",
    description: "Orders, payments and stock live in three sheets that never talk to each other.",
  },
  {
    icon: Compass,
    title: "Stock-outs hit before you see them",
    description: "You learn a godown is empty when the dealer calls to complain.",
  },
  {
    icon: Laptop,
    title: "ERPs your team won't open",
    description: "Tally and SAP were built for desktops. Your field team gave up by week two.",
  },
];

export function Problem() {
  return (
    <section className="relative lp-mesh-light py-24 md:py-32 overflow-hidden">
      <div className="absolute inset-0 lp-noise pointer-events-none" />
      <div className="relative max-w-6xl mx-auto px-6">
        <AnimateIn variant="blurFadeUp">
          <div className="text-center mb-14 md:mb-16 max-w-3xl mx-auto">
            <span className="lp-eyebrow mb-5">The old way</span>
            <h2 className="font-heading font-extrabold text-[30px] md:text-[44px] text-[#0A0F1C] leading-[1.05] tracking-[-0.035em] mt-5">
              Running both sides is hard.
              <br />
              Your software shouldn't be.
            </h2>
          </div>
        </AnimateIn>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto" staggerTime={0.05}>
          {cards.map((card) => (
            <StaggerItem key={card.title}>
              <div className="lp-card p-7 h-full flex flex-col">
                <div className="lp-icon-tile mb-5">
                  <card.icon size={20} strokeWidth={1.75} className="text-[#6D28D9]" />
                </div>
                <h3 className="font-heading font-bold text-[17px] text-[#0A0F1C] mb-2 tracking-tight">
                  {card.title}
                </h3>
                <p className="font-body text-[14px] text-[#64748B] leading-[1.55]">
                  {card.description}
                </p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
