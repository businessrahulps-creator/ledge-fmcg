import { Smartphone, WifiOff, ShieldCheck, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { AnimateIn, StaggerContainer, StaggerItem } from "../AnimateIn";

const blocks = [
  { icon: Smartphone, title: "Installs from a link in 90 seconds.", content: "PWA. No app store. No IT team. No training day." },
  { icon: WifiOff, title: "Works when the network doesn't.", content: "Offline orders queue and sync the moment signal returns." },
  { icon: ShieldCheck, title: "Four roles. One system.", content: "Owner, manager, accountant, salesperson. Each sees what they should." },
  { icon: FileText, title: "GST invoices that build themselves.", content: "CGST, SGST, IGST auto-calculated. PDF in one click." },
];

const legacy = ["Tally", "Zoho Books", "Vyapar", "SAP"];

export function WhyOrdra() {
  return (
    <section className="bg-white py-28 md:py-36">
      <div className="max-w-7xl mx-auto px-6">
        <AnimateIn variant="blurFadeUp">
          <div className="text-center mb-12 max-w-3xl mx-auto">
            <span className="inline-block font-body text-[12px] font-semibold tracking-[0.18em] text-[#2563EB] uppercase mb-4">
              Built different
            </span>
            <h2 className="font-heading font-extrabold text-[32px] md:text-[52px] text-[#0A0F1C] tracking-[-0.04em] leading-[1.05]">
              Powerful tools exist.
              <br />
              None were built for you.
            </h2>
          </div>
        </AnimateIn>

        {/* Legacy comparison row */}
        <AnimateIn delay={0.1}>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 mb-16 text-center">
            {legacy.map((name) => (
              <span key={name} className="font-body text-[15px] md:text-[17px] text-[#94A3B8] line-through decoration-[#94A3B8]/60">
                {name}
              </span>
            ))}
            <span className="font-heading font-extrabold text-[20px] md:text-[24px] brand-gradient-cool-text tracking-tight">
              Ledge
            </span>
          </div>
        </AnimateIn>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {blocks.map((block, i) => (
            <StaggerItem key={block.title}>
              <motion.div
                className="bg-white rounded-2xl p-7 border border-[#E5E7EB] h-full flex flex-col"
                whileHover={{ y: -4, boxShadow: "0 12px 32px -8px rgba(10,15,28,0.10)" }}
                transition={{ type: "spring", damping: 20, stiffness: 300 }}
              >
                <div className="flex items-center gap-3 mb-5">
                  <span className="font-heading font-extrabold text-[14px] text-[#94A3B8]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <block.icon size={20} strokeWidth={1.75} className="text-[#0A0F1C]" />
                </div>
                <h3 className="font-heading font-bold text-[17px] text-[#0A0F1C] mb-2 tracking-tight leading-snug">
                  {block.title}
                </h3>
                <p className="font-body text-[14px] text-[#64748B] leading-[1.55]">
                  {block.content}
                </p>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
