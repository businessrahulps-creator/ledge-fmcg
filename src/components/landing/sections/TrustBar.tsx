// Motion v3 — stillness for stats. Logos still marquee; stats are simply present.

const companies = [
  "Aryan Beverages",
  "Nova Retail Co.",
  "Coastal Naturals",
  "Horizon Foods",
  "Sterling FMCG",
  "Crest Agencies",
];

const stats = [
  { value: "2–3 hrs", label: "Wasted daily per salesperson — on paperwork, not selling" },
  { value: "5–10%", label: "Revenue lost to missed orders, wrong schemes, late collections" },
  { value: "₹10L–₹1Cr", label: "Quietly gone every year. Silent. Invisible. Until it's too late." },
  { value: "80%", label: "Admin work eliminated once Ledge is live" },
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
                className="font-body text-[13px] md:text-[14px] font-medium text-muted-foreground whitespace-nowrap shrink-0 px-4 py-2 rounded-full bg-card border border-border shadow-depth-2"
              >
                {name}
              </span>
            ))}
          </div>
        </div>

        {/* Stat Row — with hairline dividers + gradient numbers */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-8 max-w-5xl mx-auto mt-14 md:mt-16">
          {stats.map((stat, i) => (
            <div
              key={stat.value}
              className={`text-center px-4 ${
                i > 0 ? "md:border-l md:border-border" : ""
              }`}
            >
              <div className="font-heading font-semibold text-[26px] md:text-[32px] text-foreground tracking-[-0.025em] leading-none">
                {stat.value}
              </div>
              <div className="font-body text-[12px] md:text-[13px] text-muted-foreground mt-2.5 tracking-tight">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
