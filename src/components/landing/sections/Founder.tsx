import { Section, SectionHead, Reveal } from "../kit";

export function Founder() {
  return (
    <Section id="founder" ground="grey" labelledBy="founder-title">
      <SectionHead bot="founder" num="08" eyebrow="From the founder" id="founder-title" title="Built in India, for the way you work." />
      <Reveal>
        <figure className="lpx-card lpx-card--pad-lg max-w-3xl mx-auto">
          <blockquote className="lpx-quote">
            <p>“I built Ledge because I watched too many Indian business owners juggle a factory on one side and a field team on the other. The software ignored both.</p>
            <p className="mt-6">Your team is in the field right now. Your floor is running. Your business deserves a system that keeps up. Built in India. Designed for the way you actually work.</p>
            <p className="mt-6 font-semibold">Start free. If it’s not running your business in 30&nbsp;days, walk away.”</p>
          </blockquote>
          <figcaption className="mt-8 pt-6 border-t flex items-center gap-4" style={{ borderColor: "hsl(var(--mono-line))" }}>
            <span className="lpx-icon font-heading text-[18px] font-semibold" aria-hidden>R</span>
            <span>
              <span className="block text-[15px] font-semibold">Rahul Ps</span>
              <span className="block text-[13px] lpx-muted">Founder, Ledge</span>
            </span>
          </figcaption>
        </figure>
      </Reveal>
    </Section>
  );
}
