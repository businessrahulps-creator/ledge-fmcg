import { SeoHead } from "@/components/SeoHead";
import { Navbar } from "@/components/landing/sections/Navbar";
import { Hero } from "@/components/landing/sections/Hero";
import { WhoItsFor } from "@/components/landing/sections/WhoItsFor";
import { TrustBar } from "@/components/landing/sections/TrustBar";
import { Problem } from "@/components/landing/sections/Problem";
import { HowItWorks } from "@/components/landing/sections/HowItWorks";
import { Outcome } from "@/components/landing/sections/Outcome";
import { LedgeIntelligence } from "@/components/landing/sections/LedgeIntelligence";
import { Features } from "@/components/landing/sections/Features";
import { WhyLedge } from "@/components/landing/sections/WhyLedge";
import { Testimonials } from "@/components/landing/sections/Testimonials";
import { Founder } from "@/components/landing/sections/Founder";
import { Pricing } from "@/components/landing/sections/Pricing";
import { FAQ } from "@/components/landing/sections/FAQ";
import { FinalCTA } from "@/components/landing/sections/FinalCTA";
import { Footer } from "@/components/landing/sections/Footer";
import "@/components/arc/foundation.css";
import "@/components/landing/ledge-mono.css";

// The landing page never redirects: signed-in visitors get "Open Ledge" / "Finish setup" in the menu.
export default function Index() {



  return (
    <div className="lp-theme bg-background text-foreground font-body antialiased light" data-theme="light" style={{ colorScheme: "light", scrollBehavior: "smooth" }}>
      <SeoHead
        title="Ledge — The operating system for India's distribution businesses"
        description="Orders, dealers, stock, GST bills and payments in one mobile app for Indian manufacturers, distributors and wholesalers. Start free for 30 days."
        path="/"
      />
      <a href="#main-content" className="lp-skip-link">Skip to Content</a>
      <Navbar />
      <main id="main-content" className="arc-root lpx" data-accent="neutral">
        <Hero />
        <TrustBar />
        <WhoItsFor />
        <Problem />
        <HowItWorks />
        <Outcome />
        <LedgeIntelligence />
        <Features />
        <WhyLedge />
        <Testimonials />
        <Founder />
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
