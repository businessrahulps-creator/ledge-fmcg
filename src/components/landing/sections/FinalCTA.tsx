import { Link } from "react-router-dom";
import { AnimateIn } from "../AnimateIn";


export function FinalCTA() {
  return (
    <section className="bg-gradient-to-b from-indigo-50 to-white py-20 md:py-32">
      <div className="max-w-7xl mx-auto px-6 text-center">
        <AnimateIn>
          <h2 className="font-heading font-extrabold text-[28px] md:text-[48px] text-midnight max-w-3xl mx-auto leading-[1.1]">
            Your team is in the field right now. Orders are moving. Are you watching?
          </h2>
        </AnimateIn>

        <p className="font-body text-[20px] text-graphite max-w-xl mx-auto mt-6">
          Set up Ledge in under 15 minutes. See your first live order before the hour is up. No credit card. No IT department. No onboarding call.
        </p>

        <div className="flex justify-center gap-4 mt-10 flex-wrap">
          <Link
            to="/signup"
            className="bg-indigo-600 text-white px-8 py-4 rounded-full font-semibold hover:bg-indigo-700 hover:scale-[1.02] transition-all duration-200 inline-flex items-center text-base"
          >
            Get Started Free
          </Link>
        </div>
      </div>
    </section>
  );
}
