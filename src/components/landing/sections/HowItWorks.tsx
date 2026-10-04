import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";
import { Stepper } from "@/components/arc/stepper/stepper";
import { OrderBuildVisual, StockHealthVisual, DispatchInvoiceVisual } from "../visuals/StepMicroVisuals";
import { Section, SectionHead, Reveal } from "../kit";

const steps = [
  { badge: "01", title: "Field team places an order in 60 seconds.", short: "Order", description: "Pick dealer, add products, submit. Sequential order number, instantly.", Visual: OrderBuildVisual },
  { badge: "02", title: "Your stock health stays in the green.", short: "Stock", description: "Per-SKU, per-godown health bars. Low stock surfaces before the dealer call.", Visual: StockHealthVisual },
  { badge: "03", title: "Dispatch → stock deducts → GST invoice generates.", short: "Bill", description: "One tap. Accountant skips Tally. CGST/SGST/IGST calculated automatically.", Visual: DispatchInvoiceVisual },
];

export function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-120px" });
  const reduce = useReducedMotion();
  const [current, setCurrent] = useState(reduce ? steps.length : 0);

  useEffect(() => {
    if (!inView || reduce) return;
    const timers = steps.map((_, i) => window.setTimeout(() => setCurrent(i + 1), 700 * (i + 1)));
    return () => timers.forEach(clearTimeout);
  }, [inView, reduce]);

  return (
    <Section id="how-it-works" ground="grey" labelledBy="how-title">
      <SectionHead
        num="02"
        eyebrow="How it works"
        id="how-title"
        title="Three things happen. All in under 60 seconds."
        lines={["Three things happen.", "All in under 60 seconds."]}
      />

      <div ref={ref} className="max-w-3xl mx-auto mb-12 md:mb-14">
        <Stepper
          label="From order to bill"
          completeLabel="Order placed, stock updated, bill sent"
          current={current}
          details="current"
          steps={steps.map((s) => ({ id: s.badge, label: s.short, description: s.title }))}
        />
      </div>

      <div className="lpx-grid lpx-grid-3">
        {steps.map((s, i) => (
          <Reveal key={s.badge} delay={i * 0.08}>
            <div className="lpx-card lpx-card--hover">
              <span className="text-[11.5px] font-semibold tracking-[0.18em] lpx-muted">STEP {s.badge}</span>
              <h3 className="lpx-h3 mt-3 text-[19px]">{s.title}</h3>
              <p className="lpx-body mt-2">{s.description}</p>
              <div className="mt-6 flex-1 flex"><s.Visual /></div>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
