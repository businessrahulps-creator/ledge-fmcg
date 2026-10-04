import { WifiOff, FileCheck2, MapPin } from "lucide-react";
import { Reveal } from "../kit";

const companies = ["Aryan Beverages", "Nova Retail Co.", "Coastal Naturals", "Horizon Foods", "Sterling FMCG", "Crest Agencies"];

const stats = [
  { value: "2–3 hrs", label: "Wasted daily per salesperson - on paperwork, not selling" },
  { value: "5–10%", label: "Revenue lost to missed orders, wrong schemes, late collections" },
  { value: "₹10L–₹1Cr", label: "Quietly gone every year. Silent. Invisible. Until it’s too late." },
  { value: "80%", label: "Admin work eliminated once Ledge is live" },
];

export function TrustBar() {
  return (
    <section className="lpx-section lpx-section--tight lpx-light lpx-ruled" aria-label="Who uses Ledge and what it fixes">
      <div className="lpx-container">
        <div className="lpx-marquee" aria-label="Businesses using Ledge">
          <div className="lpx-marquee__track">
            {[...companies, ...companies].map((name, i) => (
              <span key={i} aria-hidden={i >= companies.length} className="font-heading text-[18px] md:text-[20px] font-semibold lpx-faint whitespace-nowrap">
                {name}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 mt-10">
          <span className="lpx-chip"><WifiOff size={14} strokeWidth={2} /> Offline-ready</span>
          <span className="lpx-chip"><FileCheck2 size={14} strokeWidth={2} /> GST-ready</span>
          <span className="lpx-chip"><MapPin size={14} strokeWidth={2} /> Built in Kerala</span>
        </div>

        <Reveal delay={0.05}>
          <div className="lpx-stats mt-12">
            {stats.map((s) => (
              <div key={s.value}>
                <div className="lpx-stat">{s.value}</div>
                <p className="text-[13px] lpx-muted mt-3 leading-[1.5]">{s.label}</p>
              </div>
            ))}
          </div>
        </Reveal>
        <p className="text-[12px] lpx-faint text-center mt-6">
          Figures from our own interviews with distributors and super-stockists across South India.
        </p>
      </div>
    </section>
  );
}
