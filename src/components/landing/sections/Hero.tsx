import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ShoppingCart, IndianRupee, PackageMinus, FileText, Truck } from "lucide-react";
import { InViewTitle } from "@/components/arc/in-view-title/in-view-title";
import { AnimatedCounter } from "@/components/arc/animated-counter/animated-counter";
import { AnnouncementBar } from "@/components/arc/announcement-bar/announcement-bar";
import { Btn, Reveal } from "../kit";

type FeedEvent = { id: number; icon: typeof ShoppingCart; title: string; meta: string; amount: string; solid?: boolean };

const SOURCE: Omit<FeedEvent, "id">[] = [
  { icon: ShoppingCart, title: "New order · Kayamkulam Traders", meta: "Anil, sales rep · 24 items", amount: "₹38,420" },
  { icon: IndianRupee, title: "Payment received · Sree Agencies", meta: "UPI · bill ABD-0099", amount: "₹72,476", solid: true },
  { icon: PackageMinus, title: "Running low · Coconut oil 1L", meta: "Kochi godown · 18 left", amount: "Reorder" },
  { icon: FileText, title: "GST bill sent · Malabar Stores", meta: "CGST + SGST worked out", amount: "₹54,910" },
  { icon: Truck, title: "Out for delivery · 6 orders", meta: "Vehicle KL-07 · Route 3", amount: "6 stops" },
  { icon: ShoppingCart, title: "New order · Thrissur Mart", meta: "Priya, sales rep · 11 items", amount: "₹19,880" },
  { icon: IndianRupee, title: "Payment received · Hari & Sons", meta: "Cash · 2 bills cleared", amount: "₹1,12,300", solid: true },
];

/** Live "today" feed: the hero’s product picture, built in the Arc realtime-stream style. */
function LiveFeed() {
  const reduce = useReducedMotion();
  const [events, setEvents] = useState<FeedEvent[]>(() => SOURCE.slice(0, 4).map((e, i) => ({ ...e, id: i })));
  const [orders, setOrders] = useState(46);
  const [collected, setCollected] = useState(824600);

  // Sample screen only · no pretend live activity (keeps the page honest).
  void setEvents; void setOrders; void setCollected; void useEffect;

  return (
    <div className="lpx-card lpx-card--pad-lg" role="img" aria-label="Sample screen showing a day of orders, payments, stock and bills in Ledge">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-2.5 text-[13px] font-semibold">
          <span className="lpx-dot" aria-hidden />
          Sample day
        </span>
        <span className="text-[12px] lpx-faint lpx-num">Example business</span>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-5" aria-hidden>
        <div className="lpx-well min-w-0">
          <div className="text-[11.5px] lpx-muted">Orders today</div>
          <div className="lpx-stat mt-2 text-[22px] sm:text-[26px]"><AnimatedCounter value={orders} locale="en-IN" /></div>
        </div>
        <div className="lpx-well min-w-0">
          <div className="text-[11.5px] lpx-muted">Money collected</div>
          <div className="lpx-stat mt-2 text-[22px] sm:text-[26px] truncate"><AnimatedCounter value={collected} prefix="₹" locale="en-IN" /></div>
        </div>
      </div>

      <ul className="lpx-feed mt-4" aria-hidden>
        <AnimatePresence initial={false}>
          {events.map((e) => (
            <motion.li
              key={e.id}
              layout={!reduce}
              initial={reduce ? false : { opacity: 0, y: -12, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
              transition={{ type: "spring", stiffness: 340, damping: 34 }}
              className="lpx-feed__row"
            >
              <span className={`lpx-feed__glyph ${e.solid ? "lpx-feed__glyph--solid" : ""}`}>
                <e.icon size={16} strokeWidth={1.9} />
              </span>
              <span className="min-w-0">
                <span className="block text-[13.5px] font-semibold truncate">{e.title}</span>
                <span className="block text-[12px] lpx-muted truncate">{e.meta}</span>
              </span>
              <span className="text-[13px] font-semibold lpx-num whitespace-nowrap">{e.amount}</span>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}

export function Hero() {
  return (
    <section className="lpx-section lpx-light pt-28 md:pt-36" aria-labelledby="hero-title">
      <div className="lpx-container">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
          <div className="lg:col-span-7">
            <Reveal>
              <div className="max-w-[460px]">
                <AnnouncementBar
                  id="lp-copilot"
                  label="News"
                  tone="neutral"
                  dismissible={false}
                  controls={false}
                  autoPlay
                  interval={6000}
                  messages={[
                    { id: "copilot", message: "Ledge Co-Pilot is coming. Founding members get early access free.", action: { label: "Claim a spot", href: "#intelligence" } },
                    { id: "gst", message: "GST bills, credit notes and Tally export are built in.", action: { label: "See features", href: "#features" } },
                  ]}
                />
              </div>
            </Reveal>

            <span className="lpx-eyebrow mt-8 flex">
              <span className="hidden sm:inline">The operating system for India’s distribution businesses</span>
              <span className="sm:hidden">OS for India’s distributors</span>
            </span>

            <InViewTitle
              as="h1"
              id="hero-title"
              variant="word"
              text="Orders. Payments. Stock. Invoices. Reports. One mobile app."
              lines={["Orders. Payments. Stock.", "Invoices. Reports.", "One mobile app."]}
              className="lpx-title lpx-title--hero"
            />

            <Reveal delay={0.15}>
              <p className="lpx-lede" style={{ marginInline: 0 }}>
                Built for Indian manufacturers, distributors and wholesalers who sell through dealers and a field team.
                FMCG, building materials, agri-inputs, pharma, auto parts, electricals. Recover the{" "}
                <span className="lpx-strong">5–10% that quietly leaks between your godown and your field</span>.
              </p>
            </Reveal>

            <Reveal delay={0.25}>
              <div className="flex flex-col sm:flex-row gap-3 mt-10">
                <Btn to="/signup">Start Free Trial <ArrowRight size={16} strokeWidth={2.2} /></Btn>
                <Btn to="#how-it-works" ghost>See how it works</Btn>
              </div>
              <p className="text-[13px] lpx-faint mt-5">30-day free trial · No card · Cancel anytime</p>
            </Reveal>
          </div>

          <Reveal delay={0.2} className="lg:col-span-5">
            <LiveFeed />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
