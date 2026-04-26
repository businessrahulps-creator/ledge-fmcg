import { AnimateIn, StaggerContainer, StaggerItem } from "../AnimateIn";

const testimonials = [
  {
    quote: "I check the dashboard before I start my day. That's it. The whole operation used to live in my head.",
    name: "Arnav Sethi",
    role: "Owner, Aryan Beverages, Pune",
  },
  {
    quote: "I showed my team Ledge on Monday. By Wednesday, the Excel file hadn't been opened once.",
    name: "Priya Anand",
    role: "Operations Head, Coastal Naturals, Kochi",
  },
  {
    quote: "Caught a critical low on our top SKU four days early. Festival season went perfectly.",
    name: "Dev Sharma",
    role: "Warehouse Lead, Nova Retail Co., Chennai",
  },
  {
    quote: "I open the dealer profile in the car. I walk in knowing everything. Dealers notice.",
    name: "Rohan Nair",
    role: "Senior Sales Executive, Sterling FMCG, Bangalore",
  },
];

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("");
}

const avatarShades = ["#1F2937", "#334155", "#0A0F1C", "#475569"];

export function Testimonials() {
  return (
    <section className="relative lp-section-paper py-24 md:py-32 lg:py-36 overflow-hidden">
      <div className="relative max-w-6xl mx-auto px-6 md:px-8 lg:px-10">
        <AnimateIn variant="blurFadeUp">
          <div className="text-center mb-16 md:mb-20 max-w-3xl mx-auto">
            <span className="lp-eyebrow">From the field</span>
            <h2 className="font-heading font-semibold text-[30px] md:text-[40px] text-[#0A0F1C] tracking-[-0.022em] leading-[1.1] mt-6">
              Owners who stopped guessing.
            </h2>
          </div>
        </AnimateIn>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-8 max-w-5xl mx-auto" staggerTime={0.06}>
          {testimonials.map((t, i) => (
            <StaggerItem key={t.name} variant="scaleUp">
              <div className="relative h-full">
                {/* Tilted depth layers */}
                <div aria-hidden className="absolute inset-0 lp-card opacity-40 -rotate-2 translate-x-1.5 translate-y-1.5 pointer-events-none" />
                <div aria-hidden className="absolute inset-0 lp-card opacity-70 rotate-1 -translate-x-1 translate-y-0.5 pointer-events-none" />
                {/* Front frosted card */}
                <div className="relative lp-glass-frost p-8 md:p-10 h-full flex flex-col">
                  <span className="lp-bento-numeral absolute top-5 right-6">[ {String(i + 1).padStart(2, "0")} ]</span>
                  <p className="relative font-heading font-medium text-[18px] md:text-[20px] text-[#0A0F1C] leading-[1.5] tracking-[-0.01em] flex-1">
                    "{t.quote}"
                  </p>
                  <div className="relative mt-7 pt-5 border-t border-[#ECEEF2] flex items-center gap-3.5">
                    <span
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-heading font-semibold text-[13px] shrink-0"
                      style={{ background: avatarShades[i % avatarShades.length] }}
                    >
                      {initials(t.name)}
                    </span>
                    <div>
                      <p className="font-body font-semibold text-[14.5px] text-[#0A0F1C]">{t.name}</p>
                      <p className="font-body text-[12.5px] text-[#64748B] mt-0.5">{t.role}</p>
                    </div>
                  </div>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
