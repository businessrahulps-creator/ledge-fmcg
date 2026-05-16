import { StaggerContainer, StaggerItem } from "../AnimateIn";

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
    <section className="py-16 md:py-20 bg-white border-b border-border">
      <div className="max-w-6xl mx-auto px-6 md:px-8 lg:px-10">
        {/* Logo Marquee — soft pill chips */}
        <div
          className="overflow-hidden group relative"
          style={{
            maskImage: "linear-gradient(90deg, transparent 0%, black 8%, black 92%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(90deg, transparent 0%, black 8%, black 92%, transparent 100%)",
          }}
        >
          <div className="flex gap-3 animate-marquee w-max items-center group-hover:[animation-play-state:paused]">
            {[...companies, ...companies].map((name, i) => (
              <span
                key={i}
                className="font-body text-[13px] md:text-[14px] font-medium text-muted-foreground whitespace-nowrap shrink-0 px-4 py-2 rounded-full bg-white border border-[#E2E8F0]/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(15,23,42,0.03)]"
              >
                {name}
              </span>
            ))}
          </div>
        </div>

        {/* Stat Row — with hairline dividers + gradient numbers */}
        <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-y-8 max-w-5xl mx-auto mt-14 md:mt-16">
          {stats.map((stat, i) => (
            <StaggerItem key={stat.value}>
              <div
                className={`text-center px-4 ${
                  i > 0 ? "md:border-l md:border-[#E2E8F0]/70" : ""
                }`}
              >
                <div className="font-heading font-semibold text-[26px] md:text-[32px] text-foreground tracking-[-0.025em] leading-none">
                  {stat.value}
                </div>
                <div className="font-body text-[12px] md:text-[13px] text-muted-foreground mt-2.5 tracking-tight">
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
