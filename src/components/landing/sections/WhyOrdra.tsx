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
          {blocks.map((block, i) => (
            <StaggerItem key={block.title}>
              <div className="lp-card p-7 h-full flex flex-col">
                <div className="flex items-center gap-3 mb-5">
                  <span className="font-heading font-semibold text-[18px] text-[#94A3B8] tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="h-px flex-1 bg-[#ECEEF2]" />
                  <block.icon size={18} strokeWidth={1.75} className="text-[#0A0F1C]" />
                </div>
                <h3 className="font-heading font-semibold text-[17px] text-[#0A0F1C] mb-2 tracking-tight leading-snug">
                  {block.title}
                </h3>
                <p className="font-body text-[14px] text-[#64748B] leading-[1.55]">
                  {block.content}
                </p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
