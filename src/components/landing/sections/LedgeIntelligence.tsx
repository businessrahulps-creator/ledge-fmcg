import { Camera, Sunrise, Sparkles, Mic } from "lucide-react";
import { ExpandableCard } from "@/components/arc/expandable-card/expandable-card";
import { Badge } from "@/components/arc/badge/badge";
import { Section, SectionHead, Reveal, Btn } from "../kit";

const capabilities = [
  { icon: Camera, title: "Photo-to-Order", desc: "Photograph a handwritten chit. Ledge fills the order instantly.", detail: "Snap chit · Order draft · ~6 sec. You check the lines, then save." },
  { icon: Mic, title: "Voice Order Entry", desc: "Speak the order in English or Hindi. Done in 20 seconds.", detail: "Say the dealer and items. Ledge writes the order for you to confirm." },
  { icon: Sparkles, title: "Smart Scheme Suggestions", desc: "AI tells you who’ll buy - before you pitch. The right scheme, every time.", detail: "Based on each dealer’s past orders and the offers you run." },
  { icon: Sunrise, title: "Natural Language Queries", desc: "Ask in English or Hindi. Get instant answers - no reports needed.", detail: "“Who owes me more than 30 days?” gets you the list, not a report." },
];

const SPOTS_CLAIMED = 87;
const SPOTS_TOTAL = 100;

export function LedgeIntelligence() {
  return (
    <Section id="intelligence" ground="dark" labelledBy="intel-title">
      <SectionHead
        num="04"
        eyebrow="Ledge Intelligence"
        id="intel-title"
        title="Ledge Co-Pilot."
        lede={<>Ledge thinks. You lead. <span className="lpx-strong">Launching in 3 months</span> · Founding members get early access free.</>}
      />

      <div className="lpx-grid lpx-grid-2 max-w-4xl mx-auto">
        {capabilities.map((c, i) => (
          <Reveal key={c.title} delay={i * 0.06}>
            <ExpandableCard title={c.title} description={c.desc}>
              <div className="flex items-start gap-3">
                <span className="lpx-icon shrink-0"><c.icon size={18} strokeWidth={1.75} /></span>
                <p className="text-[14px] leading-[1.55]">{c.detail}</p>
              </div>
            </ExpandableCard>
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.15}>
        <div className="lpx-card max-w-4xl mx-auto mt-4 md:mt-5 flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex-1 min-w-0">
            <Badge tone="neutral" size="sm">Limited · {SPOTS_CLAIMED} / {SPOTS_TOTAL} spots claimed</Badge>
            <p className="font-heading text-[20px] md:text-[22px] font-semibold mt-4 leading-[1.3]">
              Founding 100 - lock in 6 months free.
            </p>
            <p className="lpx-body mt-1.5">
              Today’s customers are auto-enrolled. Only {SPOTS_TOTAL - SPOTS_CLAIMED} spots left before this offer closes forever.
            </p>
            <div className="lpx-bar mt-4 max-w-md" role="progressbar" aria-valuenow={SPOTS_CLAIMED} aria-valuemin={0} aria-valuemax={SPOTS_TOTAL} aria-label="Founding spots claimed">
              <span style={{ width: `${SPOTS_CLAIMED}%` }} />
            </div>
          </div>
          <div className="shrink-0"><Btn to="/signup">Claim my spot</Btn></div>
        </div>
      </Reveal>
    </Section>
  );
}
