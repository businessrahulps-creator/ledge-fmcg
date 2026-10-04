import { Badge } from "@/components/arc/badge/badge";
import { Section, SectionHead, Reveal } from "../kit";

const industries = ["FMCG", "Building materials", "Agri-inputs", "Pharma distribution", "Auto parts", "Electricals & durables"];

export function WhoItsFor() {
  return (
    <Section ground="grey" tight labelledBy="who-its-for">
      <SectionHead
        id="who-its-for"
        eyebrow="Who it’s for"
        title="If you sell through dealers, Ledge fits."
        lede="Not a shop billing app. Ledge is for businesses with dealers, salesmen and stock in more than one place."
      />
      <Reveal>
        <ul className="flex flex-wrap justify-center gap-2.5 -mt-6 md:-mt-8">
          {industries.map((name) => (
            <li key={name}><Badge tone="neutral" size="md">{name}</Badge></li>
          ))}
        </ul>
      </Reveal>
    </Section>
  );
}
