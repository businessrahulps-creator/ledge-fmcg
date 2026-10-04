import { Accordion } from "@/components/arc/accordion/accordion";
import { Section, SectionHead, Reveal } from "../kit";

const items = [
  { title: "Is there really a free trial?", content: "Yes. You get 30 days free with no card. Keep using the Free plan after that, or move to Growth or Scale when you’re ready. Cancel anytime." },
  { title: "Do I need to install anything?", content: "No app store and no IT team. Ledge opens in the phone’s browser and installs from a link in about 90 seconds. It works on any phone, tablet or computer." },
  { title: "Can Ledge make GST bills?", content: "Yes. Ledge makes GST invoices, estimates and credit notes, and works out CGST, SGST and IGST for you. Bills can be shared as PDFs and exported for Tally." },
  { title: "Who in my team can see what?", content: "Each person gets a job: owner, manager, accountant, sales rep or viewer. The owner can give extra access per person, and every change is saved in the activity history." },
  { title: "Is my business data kept separate and safe?", content: "Every business has its own private workspace. Nobody outside your business can see your dealers, orders or money, and bills can only be corrected with credit notes, never edited." },
  { title: "How long does it take to get started?", content: "The basics take about 30 minutes, with no trainer. Most teams place their first order the same day." },
];

export function FAQ() {
  return (
    <Section id="faq" ground="grey" labelledBy="faq-title">
      <SectionHead bot="faq" num="10" eyebrow="Questions" id="faq-title" title="Answers, before you ask." />
      <Reveal>
        <div className="lpx-card max-w-3xl mx-auto lpx-arc-fill">
          <Accordion items={items} defaultOpen={0} size="lg" />
        </div>
      </Reveal>
    </Section>
  );
}
