import { Carousel } from "@/components/arc/carousel/carousel";
import { AvatarGroup } from "@/components/arc/avatar-group/avatar-group";
import arnav from "@/assets/landing/testimonial-arnav.webp";
import priya from "@/assets/landing/testimonial-priya.webp";
import dev from "@/assets/landing/testimonial-dev.webp";
import rohan from "@/assets/landing/testimonial-rohan.webp";
import { Section, SectionHead, Reveal } from "../kit";

const testimonials = [
  { quote: "I check the dashboard before I start my day. That’s it. The whole operation used to live in my head.", name: "Arnav Sethi", role: "Owner, Aryan Beverages, Pune", avatar: arnav },
  { quote: "I showed my team Ledge on Monday. By Wednesday, the Excel file hadn’t been opened once.", name: "Priya Anand", role: "Operations Head, Coastal Naturals, Kochi", avatar: priya },
  { quote: "Caught a critical low on our top SKU four days early. Festival season went perfectly.", name: "Dev Sharma", role: "Warehouse Lead, Nova Retail Co., Chennai", avatar: dev },
  { quote: "I open the dealer profile in the car. I walk in knowing everything. Dealers notice.", name: "Rohan Nair", role: "Senior Sales Executive, Sterling FMCG, Bangalore", avatar: rohan },
];

export function Testimonials() {
  return (
    <Section ground="light" labelledBy="voices-title">
      <SectionHead bot="voices" num="07" eyebrow="Customers" id="voices-title" title="Owners who stopped guessing." />
      <Reveal>
        <div className="flex justify-center -mt-4 mb-10 md:mb-12">
          <AvatarGroup members={testimonials.map((t) => ({ name: t.name, src: t.avatar }))} max={4} size="md" label="People who use Ledge" />
        </div>
      </Reveal>
      <Reveal delay={0.08}>
        <Carousel label="What customers say" slideSize="min(86cqw, 420px)">
          {testimonials.map((t) => (
            <figure key={t.name} className="lpx-card lpx-card--flat h-full">
              <blockquote className="font-heading text-[19px] md:text-[21px] leading-[1.5] tracking-[-0.01em] flex-1">
                “{t.quote}”
              </blockquote>
              <figcaption className="mt-6 pt-5 flex items-center gap-3.5 border-t" style={{ borderColor: "hsl(var(--mono-line))" }}>
                <img src={t.avatar} alt="" width={48} height={48} loading="lazy" className="w-12 h-12 rounded-full object-cover grayscale" />
                <span>
                  <span className="block text-[14.5px] font-semibold">{t.name}</span>
                  <span className="block text-[13px] lpx-muted mt-0.5">{t.role}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </Carousel>
      </Reveal>
    </Section>
  );
}
