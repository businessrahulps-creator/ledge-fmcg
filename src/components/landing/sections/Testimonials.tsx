import { AnimateIn, StaggerContainer, StaggerItem } from "../AnimateIn";
import { motion, useReducedMotion } from "framer-motion";
import arnav from "@/assets/landing/testimonial-arnav.jpg";
import priya from "@/assets/landing/testimonial-priya.jpg";
import dev from "@/assets/landing/testimonial-dev.jpg";
import rohan from "@/assets/landing/testimonial-rohan.jpg";

const testimonials = [
  {
    quote: "I check the dashboard before I start my day. That's it. The whole operation used to live in my head.",
    name: "Arnav Sethi",
    role: "Owner, Aryan Beverages, Pune",
    avatar: arnav,
  },
  {
    quote: "I showed my team Ledge on Monday. By Wednesday, the Excel file hadn't been opened once.",
    name: "Priya Anand",
    role: "Operations Head, Coastal Naturals, Kochi",
    avatar: priya,
  },
  {
    quote: "Caught a critical low on our top SKU four days early. Festival season went perfectly.",
    name: "Dev Sharma",
    role: "Warehouse Lead, Nova Retail Co., Chennai",
    avatar: dev,
  },
  {
    quote: "I open the dealer profile in the car. I walk in knowing everything. Dealers notice.",
    name: "Rohan Nair",
    role: "Senior Sales Executive, Sterling FMCG, Bangalore",
    avatar: rohan,
  },
];

export function Testimonials() {
  const reduce = useReducedMotion();

  return (
    <section className="relative lp-section-paper py-20 md:py-28 overflow-hidden">
      <div className="relative max-w-6xl mx-auto px-6 md:px-8 lg:px-10">
        <AnimateIn variant="blurFadeUp">
          <div className="text-center mb-16 md:mb-20 max-w-3xl mx-auto">
            <span className="lp-eyebrow">From the field</span>
            <h2 className="font-heading font-semibold text-[30px] md:text-[40px] text-foreground tracking-[-0.022em] leading-[1.1] mt-6">
              Owners who stopped guessing.
            </h2>
          </div>
        </AnimateIn>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-8 max-w-5xl mx-auto" staggerTime={0.06}>
          {testimonials.map((t, i) => {
            const isFeatured = i === 0;
            return (
              <StaggerItem key={t.name} variant="scaleUp">
                <motion.div
                  className="relative h-full"
                  whileHover={reduce ? undefined : { rotateX: -1.5, rotateY: 2, y: -4 }}
                  transition={{ type: "spring", stiffness: 200, damping: 22 }}
                  style={{ transformStyle: "preserve-3d", perspective: 1000 }}
                >
                  {/* Tilted depth layers (skip for tinted feature card) */}
                  {!isFeatured && (
                    <>
                      <div aria-hidden className="absolute inset-0 lp-card opacity-40 -rotate-2 translate-x-1.5 translate-y-1.5 pointer-events-none" />
                      <div aria-hidden className="absolute inset-0 lp-card opacity-70 rotate-1 -translate-x-1 translate-y-0.5 pointer-events-none" />
                    </>
                  )}
                  {/* Front card */}
                  <div className={`relative ${isFeatured ? "lp-card-tinted lp-card-bone" : "lp-glass-frost"} p-7 md:p-8 h-full flex flex-col overflow-hidden`}>
                    {/* Decorative quote glyph watermark */}
                    <span
                      aria-hidden
                      className="absolute -top-6 -left-2 font-heading text-[120px] leading-none text-foreground/[0.05] select-none pointer-events-none"
                      style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                    >
                      "
                    </span>

                    <p className="relative font-body text-[16px] md:text-[17px] text-foreground leading-[1.6] tracking-[-0.005em] flex-1">
                      {t.quote}
                    </p>
                    <div className="relative mt-6 pt-5 border-t border-border flex items-center gap-3.5">
                      <img
                        src={t.avatar}
                        alt={t.name}
                        width={64}
                        height={64}
                        loading="lazy"
                        className="w-12 h-12 rounded-full object-cover border border-border shadow-depth-2"
                      />
                      <div>
                        <p className="font-body font-semibold text-[14.5px] text-foreground">{t.name}</p>
                        <p className="font-body text-[12.5px] text-muted-foreground mt-0.5">{t.role}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </div>
    </section>
  );
}
