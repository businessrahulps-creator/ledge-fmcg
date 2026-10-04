import { ArrowRight } from "lucide-react";
import { LedgeFlowHub } from "../visuals/LedgeFlowHub";
import { Btn, Reveal, Title } from "../kit";

export function Hero() {
  return (
    <section className="lpx-section lpx-light pt-28 md:pt-36" aria-labelledby="hero-title">
      <div className="lpx-container">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
          <div className="lg:col-span-6">
            <span className="lpx-eyebrow flex">
              <span className="hidden sm:inline">The operating system for India’s distribution businesses</span>
              <span className="sm:hidden">OS for India’s distributors</span>
            </span>

            <Reveal>
              <Title as="h1" id="hero-title" hero text="Orders. Payments. Stock. Invoices. Reports. One mobile app." lines={["Orders. Payments. Stock.", "Invoices. Reports.", "One mobile app."]} />
            </Reveal>

            <Reveal delay={0.15}>
              <p className="lpx-lede" style={{ marginInline: 0 }}>
                Built for Indian manufacturers, distributors and wholesalers who sell through dealers and a field team.
                FMCG, building materials, agri-inputs, pharma, auto parts, electricals. Recover the{" "}
                <span className="lpx-strong">5–10% that quietly leaks between your godown and your field</span>.
              </p>
            </Reveal>

            <Reveal delay={0.25}>
              <div className="flex flex-col sm:flex-row gap-3 mt-10">
                <Btn to="/signup">Start Free Trial <ArrowRight size={16} strokeWidth={2.2} /></Btn>
                <Btn to="#how-it-works" ghost>See how it works</Btn>
              </div>
              <p className="text-[13px] lpx-faint mt-5">30-day free trial · No card · Cancel anytime</p>
            </Reveal>
          </div>

          <Reveal delay={0.2} className="lg:col-span-6">
            <LedgeFlowHub />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
