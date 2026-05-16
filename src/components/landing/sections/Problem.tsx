import { useRef } from "react";
import { motion } from "framer-motion";
import { MessageCircle, Table, Compass, Laptop } from "lucide-react";
import { useParallaxY } from "@/lib/motion";
import { AnimateIn, StaggerContainer, StaggerItem } from "../AnimateIn";

const cards = [
  {
    icon: MessageCircle,
    title: "Lost Orders",
    description: "WhatsApp chits. Half get lost. You still don't know what sold today.",
  },
  {
    icon: Table,
    title: "Payment Chaos",
    description: "Cash, UPI, cheque. No single source of truth. Always one version behind.",
  },
  {
    icon: Compass,
    title: "Blind Stock",
    description: "Empty shelf? You find out last — when the dealer calls to complain.",
  },
  {
    icon: Laptop,
    title: "Excel Nights",
    description: "Two days to build one report. Every week. Your weekends are gone.",
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
              The old way is bleeding you dry.
            </h2>
            <p className="font-body text-[15px] md:text-[17px] text-muted-foreground mt-5 leading-[1.55]">
              You're running on yesterday's data. Your competitors aren't.
            </p>
          </div>
        </AnimateIn>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6 max-w-6xl mx-auto" staggerTime={0.05}>
          {cards.map((card, i) => {
            const isFeatured = i === 3; // "Excel Nights" — emotional peak
            return (
              <StaggerItem key={card.title}>
                <div className={`${isFeatured ? "lp-card-tinted lp-card-terracotta" : "lp-card"} p-7 h-full flex flex-col`}>
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
            );
          })}
        </StaggerContainer>
      </div>
    </section>
  );
}
