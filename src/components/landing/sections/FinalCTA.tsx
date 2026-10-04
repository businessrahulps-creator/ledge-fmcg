import { ArrowRight } from "lucide-react";
import { InViewTitle } from "@/components/arc/in-view-title/in-view-title";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { Btn, Reveal } from "../kit";

export function FinalCTA() {
  return (
    <section className="lpx-section lpx-dark arc-dark" aria-labelledby="final-title">
      <div className="lpx-container">
        <div className="max-w-3xl mx-auto text-center">
          <span className="lpx-eyebrow">
            <span className="lpx-dot lpx-dot--live" aria-hidden />
            Used by Indian businesses across 12 states
          </span>
          <InViewTitle
            as="h2"
            id="final-title"
            variant="blur"
            text="One app. Every role. Total clarity."
            lines={["One app. Every role.", "Total clarity."]}
            className="lpx-title lpx-title--hero"
          />
          <Reveal delay={0.1}>
            <p className="lpx-lede">
              Run your distribution business from one app. Start free for 30&nbsp;days.
              Owner, manager, accountant, salesperson - one screen, one truth.
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 mt-10">
              <Btn to="/signup">Start Free Trial <ArrowRight size={16} strokeWidth={2.2} /></Btn>
              <Btn
                to="https://wa.me/918714249485?text=Hi%20Ledge%2C%20I%27d%20like%20to%20learn%20about%20Ledge"
                ghost
                ariaLabel="Chat with Ledge sales on WhatsApp"
              >
                <WhatsAppIcon className="w-4 h-4" /> Chat on WhatsApp
              </Btn>
            </div>
            <p className="text-[13px] lpx-faint mt-8">No card required · Cancel anytime · Built in Kerala</p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
