import { Link } from "react-router-dom";
import { AnimateIn } from "./AnimateIn";

export function FinalCTA() {
  return (
    <section className="py-24 md:py-32 px-6 bg-[#0F0F18]">
      <div className="max-w-[1200px] mx-auto text-center">
        <AnimateIn>
          <h2 className="text-3xl md:text-[48px] font-bold text-[#F2F2F5] tracking-tight mb-4">
            Replace the spreadsheet.
            <br />
            Replace the WhatsApp thread.
          </h2>
          <p className="text-base md:text-lg text-[#8888A0] mb-10">
            Give your team the tool they actually need.
          </p>

          <div className="flex items-center justify-center gap-4 mb-6">
            <Link
              to="/signup"
              className="h-12 px-8 rounded-xl bg-[#3D6FFF] text-white font-medium flex items-center hover:bg-[#5585FF] hover:scale-[1.02] transition-all duration-150"
            >
              Start your free trial
            </Link>
            <a
              href="mailto:hello@ledge.in"
              className="h-12 px-8 rounded-xl border border-[#1E1E2C] text-[#F2F2F5] font-medium flex items-center hover:border-[#2E2E3E] transition-all duration-150"
            >
              Contact us
            </a>
          </div>

          <p className="text-sm text-[#55556A]">
            30 days free · No credit card needed · Cancel anytime · No credit card needed · Cancel anytime
          </p>
        </AnimateIn>
      </div>
    </section>
  );
}
