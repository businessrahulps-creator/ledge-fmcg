import { Smartphone, WifiOff, ShieldCheck, FileText } from "lucide-react";
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
    <section className="bg-white py-24 md:py-32 lg:py-36">
      <div className="max-w-6xl mx-auto px-6 md:px-8 lg:px-10">
        <AnimateIn variant="blurFadeUp">
          <div className="text-center mb-16 md:mb-20 max-w-3xl mx-auto">
            <span className="lp-eyebrow">Built different</span>
            <h2 className="font-heading font-semibold text-[30px] md:text-[40px] text-[#0A0F1C] tracking-[-0.022em] leading-[1.1] mt-6">
              Powerful tools exist.
              <br />
              None were built for you.
            </h2>
          </div>
        </AnimateIn>

        {/* Legacy comparison row — pill chips */}
        <AnimateIn delay={0.1}>
          <div className="flex flex-wrap items-center justify-center gap-2.5 mb-14 md:mb-16">
            {legacy.map((name) => (
              <span
                key={name}
                className="font-body text-[13px] font-medium text-[#94A3B8] line-through decoration-[#94A3B8]/50 px-3.5 py-1.5 rounded-full bg-[#F8FAFC] border border-[#ECEEF2]"
              >
                {name}
              </span>
            ))}
            <span className="font-heading font-semibold text-[14px] text-white px-4 py-1.5 rounded-full bg-[#0A0F1C]">
              Ledge
            </span>
          </div>
        </AnimateIn>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6" staggerTime={0.05}>
          {blocks.map((block, i) => {
            const isHero = i === 1; // "Works when the network doesn't"
            return (
              <StaggerItem key={block.title}>
                <div className={`${isHero ? "lp-bento-hero" : "lp-card"} p-7 h-full flex flex-col relative`}>
                  <div className="flex items-start justify-between mb-7">
                    <span className="lp-bento-numeral--lg">[ {String(i + 1).padStart(2, "0")} ]</span>
                    {isHero && (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#3730A3] bg-white/70 px-2.5 py-1 rounded-full border border-white/80">
                        <span className="lp-live-dot" /> Offline-ready
                      </span>
                    )}
                  </div>
                  <h3 className="font-heading font-semibold text-[17px] text-[#0A0F1C] mb-2 tracking-tight leading-snug">
                    {block.title}
                  </h3>
                  <p className="font-body text-[14px] text-[#475569] leading-[1.55]">
                    {block.content}
                  </p>
                  <div className="mt-auto pt-6 flex justify-end">
                    <block.icon size={16} strokeWidth={1.6} className={isHero ? "text-[#4F46E5]/70" : "text-[#94A3B8]"} />
                  </div>
                </div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </div>
    </section>
  );
}
