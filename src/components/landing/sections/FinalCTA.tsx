import { Link } from "react-router-dom";
import { AnimateIn } from "../AnimateIn";


export function FinalCTA() {
  return (
    <section className="bg-[#FAFAFA] py-20 md:py-32">
      <div className="max-w-7xl mx-auto px-6 text-center">
        <AnimateIn>
          <h2 className="font-heading font-extrabold text-[28px] md:text-[48px] text-midnight max-w-3xl mx-auto leading-[1.1]">
            Right now, your team is taking an order. Can you see it?
          </h2>
        </AnimateIn>

        <p className="font-body text-[20px] text-graphite max-w-xl mx-auto mt-6">
          Set up Ledge in 15 minutes. Regain complete control over your daily distribution.
        </p>

        <div className="flex justify-center gap-4 mt-10 flex-wrap">
          <Link
            to="/signup"
            className="bg-ink text-white px-8 py-4 rounded-full font-semibold hover:bg-ink-light hover:scale-[1.02] transition-all duration-200 inline-flex items-center text-base"
          >
            Start Free. Takes 2 Minutes
          </Link>
        </div>
      </div>
    </section>
  );
}
