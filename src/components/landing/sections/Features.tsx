import { AnimateIn, StaggerContainer, StaggerItem } from "../AnimateIn";
import { LandingCard, type LandingCardVariant } from "../LandingCard";
import {
  DealerRosterVisual,
  StockHealthVisual,
  SchemeArcVisual,
  TeamBarsVisual,
  GstInvoiceVisual,
  ClaimTimelineVisual,
} from "../visuals/FeatureVisuals";

type Card = {
  key: string;
  visual: React.ReactNode;
  lede: string;
  caption: string;
  variant: LandingCardVariant;
  /** lg column span out of 6 */
  span: string;
  wellMinHeight?: number;
};

const cards: Card[] = [
  {
    key: "dealers",
    visual: <DealerRosterVisual />,
    lede: "Know every dealer.",
    caption: "Full history, credit and behaviour in one profile — no digging.",
    variant: "forest",
    span: "lg:col-span-3",
    wellMinHeight: 208,
  },
  {
    key: "stock",
    visual: <StockHealthVisual />,
    lede: "See stock before it hurts.",
    caption: "Green, amber, red — per SKU, per godown, updated live.",
    variant: "neutral",
    span: "lg:col-span-3",
    wellMinHeight: 208,
  },
  {
    key: "schemes",
    visual: <SchemeArcVisual />,
    lede: "Schemes track themselves.",
    caption: "Always accurate. No end-of-month surprises.",
    variant: "bone",
    span: "lg:col-span-2",
  },
  {
    key: "team",
    visual: <TeamBarsVisual />,
    lede: "Watch the team, live.",
    caption: "Every rep's orders and targets against plan.",
    variant: "neutral",
    span: "lg:col-span-2",
  },
  {
    key: "gst",
    visual: <GstInvoiceVisual />,
    lede: "GST in one tap.",
    caption: "Invoices, estimates and credit notes — CGST, SGST, IGST done.",
    variant: "neutral",
    span: "lg:col-span-2",
  },
  {
    key: "claims",
    visual: <ClaimTimelineVisual />,
    lede: "Claims settled cleanly.",
    caption: "A full paper trail from submitted to paid — no arguments.",
    variant: "terracotta",
    span: "lg:col-span-6",
    wellMinHeight: 140,
  },
];

export function Features() {
  return (
    <section id="features" className="relative lp-section-paper py-24 md:py-32 lg:py-36 overflow-hidden">
      <div className="relative max-w-6xl mx-auto px-6 md:px-8 lg:px-10">
        <AnimateIn variant="blurFadeUp">
          <div className="text-center mb-16 md:mb-20 max-w-3xl mx-auto">
            <span className="lp-eyebrow">Features</span>
            <h2 className="font-heading font-semibold text-[30px] md:text-[40px] text-foreground tracking-[-0.022em] leading-[1.1] mt-6">
              Simple tools.
              <br />
              Extraordinary results.
            </h2>
          </div>
        </AnimateIn>

        <StaggerContainer
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-5 lg:gap-6"
          staggerTime={0.05}
        >
          {cards.map((c) => (
            <StaggerItem key={c.key} className={c.span}>
              <LandingCard
                visual={c.visual}
                lede={c.lede}
                caption={c.caption}
                variant={c.variant}
                wellMinHeight={c.wellMinHeight}
              />
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
