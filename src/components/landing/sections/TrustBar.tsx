import { AnimateIn, StaggerContainer, StaggerItem } from "../AnimateIn";

const companies = [
  "Aryan Beverages",
  "Nova Retail Co.",
  "Coastal Naturals",
  "Horizon Foods",
  "Sterling FMCG",
  "Crest Agencies",
];

const stats = [
  { value: "2–3 hrs", label: "Gained daily, per field rep" },
  { value: "15–20 hrs", label: "Freed weekly for owners" },
  { value: "80%", label: "Admin work eliminated" },
  { value: "Zero", label: "Stockouts after Ledge" },
];

export function TrustBar() {
  return (
    <section className="py-16 md:py-20 bg-white border-y border-[#E5E7EB]">
      <div className="max-w-7xl mx-auto px-6">
        {/* Logo Marquee */}
        <div className="overflow-hidden group">
          <div className="flex gap-14 animate-marquee w-max items-center group-hover:[animation-play-state:paused]">
            {[...companies, ...companies].map((name, i) => (
              <span key={i} className="text-base md:text-lg font-semibold text-[#94A3B8] whitespace-nowrap shrink-0 tracking-tight">
                {name}
              </span>
            ))}
          </div>
        </div>

        {/* Stat Row */}
        <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto mt-14">
          {stats.map((stat) => (
            <StaggerItem key={stat.value}>
              <div className="text-center">
                <div className="font-heading font-extrabold text-[28px] md:text-[34px] text-[#0A0F1C] tracking-[-0.03em] leading-none">
                  {stat.value}
                </div>
                <div className="font-body text-[13px] md:text-[14px] text-[#64748B] mt-2">
                  {stat.label}
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
