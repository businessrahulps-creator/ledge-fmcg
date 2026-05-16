import { useRef } from "react";
import { motion } from "framer-motion";
import { MessageCircle, Table, Compass, Laptop } from "lucide-react";
import { useParallaxY } from "@/lib/motion";
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
  const sectionRef = useRef<HTMLElement>(null);
  const noiseY = useParallaxY(sectionRef, 15);

  return (
    <section ref={sectionRef} className="relative lp-section-paper py-20 md:py-28 overflow-hidden">
      <div className="relative max-w-6xl mx-auto px-6 md:px-8 lg:px-10">
        <AnimateIn variant="blurFadeUp">
          <div className="text-center mb-16 md:mb-20 max-w-3xl mx-auto">
            <span className="lp-eyebrow">The old way</span>
            <h2 className="font-heading font-semibold text-[30px] md:text-[40px] text-foreground leading-[1.1] tracking-[-0.022em] mt-6">
              Running both sides is hard.
              <br />
              Your software shouldn't be.
            </h2>
          </div>
        </AnimateIn>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6 max-w-6xl mx-auto" staggerTime={0.05}>
          {cards.map((card, i) => (
            <StaggerItem key={card.title}>
              <div className="lp-card p-7 h-full flex flex-col">
                <div className="lp-icon-tile mb-5" style={{ width: 36, height: 36 }}>
                  <card.icon size={17} strokeWidth={1.75} className="text-foreground" />
                </div>
                <h3 className="font-heading font-semibold text-[17px] text-foreground mb-2 tracking-tight">
                  {card.title}
                </h3>
                <p className="font-body text-[14px] text-muted-foreground leading-[1.55]">
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
