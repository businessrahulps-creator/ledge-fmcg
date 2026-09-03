import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { SplashScreen } from "@/components/SplashScreen";
import { SeoHead } from "@/components/SeoHead";
import { Navbar } from "@/components/landing/sections/Navbar";
import { Hero } from "@/components/landing/sections/Hero";
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
import { FinalCTA } from "@/components/landing/sections/FinalCTA";
import { Footer } from "@/components/landing/sections/Footer";

export default function Index() {
  const { user, loading, authReady } = useAuth();

  // The landing page is public: never gate first paint on the session lookup.
  // Inside the Lovable preview the session is brokered over postMessage and can
  // take seconds to resolve — visitors would just see a splash screen.
  // We only redirect once auth has actually resolved and a user exists.
  if (!loading && authReady && user) {
    return <Navigate to="/dashboard" replace />;
  }


  return (
    <div className="font-body antialiased light" data-theme="light" style={{ colorScheme: "light", scrollBehavior: "smooth" }}>
      <SeoHead
        title="Ledge — The Operating System for India's FMCG Businesses"
        description="Orders, payments, stock, invoices and reports — one mobile app for India's FMCG super-stockists. Mobile-first, works offline. Start free for 30 days."
        path="/"
      />
      <Navbar />
      <main>
        <Hero />
        <TrustBar />
        <Problem />
        <HowItWorks />
        <Outcome />
        <LedgeIntelligence />
        <Features />
        <WhyLedge />
        <Testimonials />
        <Founder />
        <Pricing />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
