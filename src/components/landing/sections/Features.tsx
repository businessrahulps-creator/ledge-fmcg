import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/arc/tabs/tabs";
import {
  DealerRosterVisual,
  StockHealthVisual,
  SchemeArcVisual,
  TeamBarsVisual,
  GstInvoiceVisual,
  ClaimTimelineVisual,
} from "../visuals/FeatureVisuals";
import { Section, SectionHead, Reveal } from "../kit";

const features = [
  { key: "dealers", tab: "Dealers", visual: <DealerRosterVisual />, lede: "Know every dealer.", caption: "Full history, credit and behaviour in one profile - no digging." },
  { key: "stock", tab: "Stock", visual: <StockHealthVisual />, lede: "See stock before it hurts.", caption: "Green, amber, red - per SKU, per godown, updated live." },
  { key: "schemes", tab: "Schemes", visual: <SchemeArcVisual />, lede: "Schemes track themselves.", caption: "Always accurate. No end-of-month surprises." },
  { key: "team", tab: "Team", visual: <TeamBarsVisual />, lede: "Watch the team, live.", caption: "Every rep’s orders and targets against plan." },
  { key: "gst", tab: "GST bills", visual: <GstInvoiceVisual />, lede: "GST in one tap.", caption: "Invoices, estimates and credit notes - CGST, SGST, IGST done." },
  { key: "claims", tab: "Claims", visual: <ClaimTimelineVisual />, lede: "Claims settled cleanly.", caption: "A full paper trail from submitted to paid - no arguments." },
];

export function Features() {
  return (
    <Section id="features" ground="light" labelledBy="features-title">
      <SectionHead
        num="05"
        eyebrow="Features"
        id="features-title"
        title="Simple tools. Extraordinary results."
        lines={["Simple tools.", "Extraordinary results."]}
        lede="Dealers, stock, schemes, team, GST bills and claims - kept together in one app."
      />

      <Reveal>
        <Tabs defaultValue="dealers" className="lpx-tabs">
          <div className="flex justify-center mb-6 md:mb-8">
            <TabsList aria-label="Ledge features">
              {features.map((f) => (
                <TabsTrigger key={f.key} value={f.key}>{f.tab}</TabsTrigger>
              ))}
            </TabsList>
          </div>
          {features.map((f) => (
            <TabsContent key={f.key} value={f.key}>
              <div className="lpx-card">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                  <div className="md:col-span-5">
                    <h3 className="font-heading text-[28px] md:text-[34px] font-semibold leading-[1.1] tracking-[-0.02em]">{f.lede}</h3>
                    <p className="lpx-body mt-4 text-[16px]">{f.caption}</p>
                  </div>
                  <div className="md:col-span-7">
                    <div className="lpx-well min-h-[240px] flex flex-col justify-center">{f.visual}</div>
                  </div>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </Reveal>
    </Section>
  );
}
