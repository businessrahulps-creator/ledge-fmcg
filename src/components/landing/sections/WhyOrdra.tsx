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
    <section className="bg-white py-24 md:py-32">
      <div className="max-w-6xl mx-auto px-6">
        <AnimateIn variant="blurFadeUp">
          <div className="text-center mb-12 max-w-3xl mx-auto">
            <span className="lp-eyebrow mb-5">Built different</span>
            <h2 className="font-heading font-extrabold text-[30px] md:text-[44px] text-[#0A0F1C] tracking-[-0.035em] leading-[1.05] mt-5">
              Powerful tools exist.
              <br />
              None were built for you.
            </h2>
          </div>
        </AnimateIn>

        {/* Legacy comparison row — pill chips */}
        <AnimateIn delay={0.1}>
          <div className="flex flex-wrap items-center justify-center gap-2.5 mb-16">
            {legacy.map((name) => (
              <span
                key={name}
                className="font-body text-[13px] font-medium text-[#94A3B8] line-through decoration-[#94A3B8]/50 px-3.5 py-1.5 rounded-full bg-[#F8FAFC] border border-[#E2E8F0]"
              >
                {name}
              </span>
            ))}
            <span
              className="relative font-heading font-extrabold text-[15px] text-[#6D28D9] px-4 py-1.5 rounded-full bg-white"
              style={{
                backgroundImage: "linear-gradient(white, white), linear-gradient(135deg, #7C3AED 0%, #2563EB 100%)",
                backgroundOrigin: "border-box",
                backgroundClip: "padding-box, border-box",
                border: "1.5px solid transparent",
                boxShadow: "0 4px 16px -4px rgba(124,58,237,0.25)",
              }}
            >
              <span className="lp-gradient-text-cool">Ledge</span>
            </span>
          </div>
        </AnimateIn>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5" staggerTime={0.05}>
          {blocks.map((block, i) => (
            <StaggerItem key={block.title}>
              <div className="lp-card p-7 h-full flex flex-col">
                <div className="flex items-center gap-3 mb-5">
                  <span className="font-heading font-extrabold text-[20px] lp-gradient-text-cool opacity-70">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="h-px flex-1 bg-gradient-to-r from-[#E2E8F0] to-transparent" />
                  <block.icon size={18} strokeWidth={1.75} className="text-[#0A0F1C]" />
                </div>
                <h3 className="font-heading font-bold text-[17px] text-[#0A0F1C] mb-2 tracking-tight leading-snug">
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
