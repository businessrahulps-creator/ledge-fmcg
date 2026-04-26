import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { SplashScreen } from "@/components/SplashScreen";
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
import { MobileWhatsAppFab } from "@/components/landing/MobileWhatsAppFab";
import { MobileStickyCtaBar } from "@/components/landing/MobileStickyCtaBar";

export default function Index() {
  const { user, loading, authReady } = useAuth();

  if (loading || !authReady) {
    return <SplashScreen />;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="font-body antialiased light" data-theme="light" style={{ colorScheme: "light", scrollBehavior: "smooth" }}>
      <Navbar />
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
      <Footer />
      <MobileStickyCtaBar />
      <MobileWhatsAppFab />
    </div>
  );
}
