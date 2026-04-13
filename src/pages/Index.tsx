import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { SplashScreen } from "@/components/SplashScreen";
import { Navbar } from "@/components/landing/sections/Navbar";
import { Hero } from "@/components/landing/sections/Hero";
import { TrustBar } from "@/components/landing/sections/TrustBar";
import { Problem } from "@/components/landing/sections/Problem";
import { HowItWorks } from "@/components/landing/sections/HowItWorks";
import { Features } from "@/components/landing/sections/Features";
import { WhyOrdra } from "@/components/landing/sections/WhyOrdra";
import { Testimonials } from "@/components/landing/sections/Testimonials";
import { Pricing } from "@/components/landing/sections/Pricing";
import { FinalCTA } from "@/components/landing/sections/FinalCTA";
import { Footer } from "@/components/landing/sections/Footer";

export default function Index() {
  const { user, loading, authReady } = useAuth();

  if (loading || !authReady) {
    return <SplashScreen />;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="font-body antialiased scroll-smooth light" data-theme="light">
      <Navbar />
      <Hero />
      <TrustBar />
      <Problem />
      <HowItWorks />
      <Features />
      <WhyOrdra />
      <Testimonials />
      <Pricing />
      <FinalCTA />
      <Footer />
    </div>
  );
}
