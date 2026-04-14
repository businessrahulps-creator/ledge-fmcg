import { Link } from "react-router-dom";
import { AnimateIn } from "../AnimateIn";


export function FinalCTA() {
  return (
    <section className="bg-[#F8F7F5] py-28 md:py-36">
      <div className="max-w-7xl mx-auto px-6 text-center">
        <AnimateIn>
          <h2 className="font-heading font-extrabold text-[24px] md:text-[36px] text-[#1A1A1A] max-w-3xl mx-auto leading-[1.1] tracking-[-0.04em]">
            Your team is in the field right now. Orders are moving. Are you watching?
          </h2>
        </AnimateIn>

        <p className="font-body text-[18px] text-[#52525B] max-w-xl mx-auto mt-8 leading-[1.6]">
          Set up Ledge in under 15 minutes. See your first live order before the hour is up.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mt-12">
          <Link
            to="/signup"
            className="bg-[#27272A] text-white px-10 py-4 rounded-full font-semibold hover:bg-[#1A1A1A] hover:scale-[1.01] transition-all duration-200 inline-flex items-center justify-center text-base"
            style={{ boxShadow: "0 4px 14px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.08)" }}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 8px 28px rgba(0,0,0,0.18), 0 3px 10px rgba(0,0,0,0.1)")}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 4px 14px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.08)")}
          >
            Get Started Free
          </Link>
          <a
            href="/#features"
            className="border border-[#D4D1CC] text-[#1A1A1A] px-10 py-4 rounded-full font-semibold hover:border-[#A8A29E] transition-all duration-200 inline-flex items-center justify-center text-base"
          >
            See How It Works
          </a>
        </div>

        <p className="font-body text-sm text-[#71717A] mt-6">
          No credit card required · Setup in 15 minutes · Cancel anytime
        </p>
      </div>
    </section>
  );
}
