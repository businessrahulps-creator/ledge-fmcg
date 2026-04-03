import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: "easeOut" as const },
});

const trustChips = [
  "✦ Works offline",
  "✦ Any Android or iPhone",
  "✦ Setup in 5 minutes",
];

export function Hero() {
  return (
    <section className="min-h-screen bg-white pt-36 py-20 md:py-32 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left — Text */}
        <div>
          <motion.h1
            className="font-heading font-extrabold text-[34px] md:text-[60px] text-midnight leading-[1.08] tracking-[-0.03em]"
            {...fadeUp(0)}
          >
            You shouldn't have to call 6 people
          </motion.h1>
          <motion.h1
            className="font-heading font-extrabold text-[34px] md:text-[60px] text-midnight leading-[1.08] tracking-[-0.03em]"
            {...fadeUp(0.1)}
          >
            to know how today went.
          </motion.h1>

          <motion.p
            className="font-body text-[17px] md:text-[20px] text-graphite leading-[1.6] max-w-xl mt-6"
            {...fadeUp(0.2)}
          >
            Your salespeople place orders on their phone. You see every order,
            every dealer, every rupee — live on your dashboard. Works offline.
            Replaces your WhatsApp groups, Excel sheets, and nightly phone calls.
          </motion.p>

          <motion.div className="flex flex-wrap gap-4 mt-8" {...fadeUp(0.3)}>
            <Link
              to="/signup"
              className="font-body font-semibold text-white bg-ink hover:bg-ink-light px-8 py-3.5 rounded-full hover:scale-[1.02] transition-all duration-150"
            >
              Try Ordra Free
            </Link>
            <a
              href="#features"
              className="font-body font-medium text-midnight border border-fog hover:border-midnight px-8 py-3.5 rounded-full transition-all duration-150"
            >
              Watch a 2-min demo →
            </a>
          </motion.div>

          <motion.div className="flex flex-wrap gap-3 mt-8" {...fadeUp(0.4)}>
            {trustChips.map((chip) => (
              <span
                key={chip}
                className="font-body text-sm text-graphite bg-[#F5F5F5] px-4 py-1.5 rounded-full"
              >
                {chip}
              </span>
            ))}
          </motion.div>
        </div>

        {/* Right — Mockup frame */}
        <motion.div
          initial={{ x: 60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full max-w-md mx-auto"
        >
          <div
            className="w-full aspect-[9/16] md:aspect-[3/4] bg-[#FAFAFA] rounded-3xl border border-fog flex items-center justify-center"
            style={{
              boxShadow: "0 8px 40px rgba(0, 0, 0, 0.06)",
              transform: "perspective(1200px) rotateY(-4deg)",
            }}
          >
            <span className="font-body text-graphite text-sm">
              Dashboard Screenshot
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
