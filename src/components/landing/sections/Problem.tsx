import { MessageCircle, Table, Compass, Laptop } from "lucide-react";
import { motion } from "framer-motion";
import { AnimateIn, StaggerContainer, StaggerItem } from "../AnimateIn";
import { hoverLift } from "@/lib/motion";

const cards = [
  {
    icon: MessageCircle,
    title: "WhatsApp orders get lost",
    description: "Voice notes, paper chits, four phone calls — and you still don't know what sold today.",
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
    description: "Tally, SAP — built for desktops. Your field team gave up by week two.",
  },
];

export function Problem() {
  return (
    <section className="bg-[#F5F6F8] py-28 md:py-36">
      <div className="max-w-7xl mx-auto px-6">
        <AnimateIn variant="blurFadeUp">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <span className="inline-block font-body text-[12px] font-semibold tracking-[0.18em] text-[#7C3AED] uppercase mb-4">
              The old way
            </span>
            <h2 className="font-heading font-extrabold text-[32px] md:text-[52px] text-[#0A0F1C] leading-[1.05] tracking-[-0.04em]">
              Running both sides is hard.
              <br />
              Your software shouldn't be.
            </h2>
          </div>
        </AnimateIn>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {cards.map((card) => (
            <StaggerItem key={card.title}>
              <motion.div
                {...hoverLift}
                className="bg-white rounded-2xl p-7 border border-[#E5E7EB] h-full flex flex-col"
                whileHover={{ y: -4, boxShadow: "0 12px 32px -8px rgba(10,15,28,0.10)" }}
              >
                <div className="w-11 h-11 rounded-xl bg-[#F5F6F8] flex items-center justify-center mb-5">
                  <card.icon size={22} strokeWidth={1.75} className="text-[#0A0F1C]" />
                </div>
                <h3 className="font-heading font-bold text-[17px] text-[#0A0F1C] mb-2 tracking-tight">
                  {card.title}
                </h3>
                <p className="font-body text-[14px] text-[#64748B] leading-[1.55]">
                  {card.description}
                </p>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
