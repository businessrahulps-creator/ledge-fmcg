import { Smartphone, WifiOff, ShieldCheck, FileText } from "lucide-react";
import { Section, SectionHead, Reveal } from "../kit";

const blocks = [
  { icon: Smartphone, title: "Mobile-first. Any phone.", content: "PWA. No app store. No IT team. Installs from a link in 90 seconds.", tag: "90 sec" },
  { icon: WifiOff, title: "Works when the network doesn’t.", content: "Offline orders queue and sync the moment signal returns.", tag: "Offline-ready" },
  { icon: ShieldCheck, title: "Schemes, warehouses, credit control.", content: "The whole distribution layer - built in. Not bolted on.", tag: "Built in" },
  { icon: FileText, title: "Basics in 30 minutes. No trainer.", content: "Your team is live by lunch. No desktop. No IT. No excuses.", tag: "30 min" },
];

const legacy = ["Tally", "Zoho Books", "Vyapar", "Khatabook"];

export function WhyLedge() {
  return (
    <Section ground="grey" labelledBy="why-title">
      <SectionHead
        num="06"
        eyebrow="Why Ledge"
        id="why-title"
        title="Every tool exists. None built for you."
        lines={["Every tool exists.", "None built for you."]}
      />

      <Reveal>
        <div className="flex flex-wrap items-center justify-center gap-2.5 -mt-4 mb-10 md:mb-12">
          {legacy.map((name) => (
            <span key={name} className="lpx-chip lpx-chip--strike">{name}</span>
          ))}
          <span className="lpx-chip lpx-chip--solid">Ledge</span>
        </div>
      </Reveal>

      <div className="lpx-grid lpx-grid-4">
        {blocks.map((b, i) => {
          const ink = i === 1;
          return (
            <Reveal key={b.title} delay={i * 0.06}>
              <div className={`lpx-card ${ink ? "lpx-card--ink" : "lpx-card--hover"}`}>
                <div className="flex items-center justify-between">
                  <span className="lpx-icon"><b.icon size={18} strokeWidth={1.75} /></span>
                  <span className="text-[11.5px] font-semibold lpx-muted">{b.tag}</span>
                </div>
                <h3 className="lpx-h3 mt-8">{b.title}</h3>
                <p className="lpx-body mt-2">{b.content}</p>
                {ink && (
                  <div className="lpx-well mt-6 text-[13px] leading-[1.5]">
                    <span className="font-semibold">Field signal</span>
                    <span className="block lpx-muted mt-1">3 orders queued in Wayanad. Will sync the moment signal returns.</span>
                  </div>
                )}
              </div>
            </Reveal>
          );
        })}
      </div>
    </Section>
  );
}
