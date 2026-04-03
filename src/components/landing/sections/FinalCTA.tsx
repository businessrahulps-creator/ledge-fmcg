import { Link } from "react-router-dom";
import { AnimateIn } from "../AnimateIn";


export function FinalCTA() {
  return (
    <section className="bg-[#FAFAFA] py-20 md:py-32">
      <div className="max-w-7xl mx-auto px-6 text-center">
        <AnimateIn>
          <h2 className="font-heading font-extrabold text-[28px] md:text-[48px] text-midnight max-w-3xl mx-auto leading-[1.1]">
            Right now, your salesperson is placing an order somewhere. Can you see it?
          </h2>
        </AnimateIn>

        <p className="font-body text-[20px] text-graphite max-w-xl mx-auto mt-6">
          Set up Ordra in 15 minutes. Your team starts placing orders today.
        </p>

        <div className="flex justify-center gap-4 mt-10 flex-wrap">
          <Link
            to="/signup"
            className="bg-ink text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-ink-light hover:scale-[1.02] transition-all duration-200 inline-flex items-center"
          >
            Start Free. Takes 2 Minutes
          </Link>
          <a
            href="mailto:hello@ordra.in"
            className="text-midnight border border-fog px-8 py-4 rounded-full hover:border-midnight transition-all duration-200 inline-flex items-center"
          >
            Book a 15-Min Walkthrough
          </a>
        </div>

        <div className="flex justify-center gap-4 md:gap-6 flex-wrap mt-10">
          {badges.map((badge) => (
            <span
              key={badge}
              className="bg-white border border-fog text-graphite text-sm px-4 py-2 rounded-full flex items-center gap-2"
            >
              {badge}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
