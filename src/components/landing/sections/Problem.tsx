import { MessageCircle, Table, Compass, Laptop } from "lucide-react";
import { Section, SectionHead, Reveal } from "../kit";

const cards = [
  { icon: MessageCircle, title: "Lost Orders", description: "WhatsApp chits. Half get lost. You still don’t know what sold today.", tag: "9:40 AM" },
  { icon: Table, title: "Payment Chaos", description: "Cash, UPI, cheque. No single source of truth. Always one version behind.", tag: "1:15 PM" },
  { icon: Compass, title: "Blind Stock", description: "Empty shelf? You find out last - when the dealer calls to complain.", tag: "5:30 PM" },
  { icon: Laptop, title: "Excel Nights", description: "Two days to build one report. Every week. Your weekends are gone.", tag: "11:47 PM · Sunday" },
];

export function Problem() {
  return (
    <Section ground="light" labelledBy="problem-title">
      <SectionHead
        num="01"
        eyebrow="The problem"
        id="problem-title"
        title="The old way is bleeding you dry."
        lede="You’re running on yesterday’s data. Your competitors aren’t."
      />
      <div className="lpx-grid lpx-grid-4">
        {cards.map((c, i) => {
          const ink = i === cards.length - 1;
          return (
            <Reveal key={c.title} delay={i * 0.06}>
              <div className={`lpx-card ${ink ? "lpx-card--ink" : "lpx-card--hover"}`}>
                <div className="flex items-center justify-between">
                  <span className="lpx-icon"><c.icon size={18} strokeWidth={1.75} /></span>
                  <span className="text-[11.5px] font-semibold lpx-muted lpx-num">{c.tag}</span>
                </div>
                <h3 className="lpx-h3 mt-8">{c.title}</h3>
                <p className="lpx-body mt-2">{c.description}</p>
              </div>
            </Reveal>
          );
        })}
      </div>
    </Section>
  );
}
