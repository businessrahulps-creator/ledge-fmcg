import { LandingNav } from "@/components/landing/LandingNav";
import { HeroSection } from "@/components/landing/HeroSection";
import { SocialProofBar } from "@/components/landing/SocialProofBar";
import { FeatureOrderCapture } from "@/components/landing/FeatureOrderCapture";
import { FeatureDashboard } from "@/components/landing/FeatureDashboard";
import { FeatureDistributors } from "@/components/landing/FeatureDistributors";
import { FeaturePayments } from "@/components/landing/FeaturePayments";
import { FeatureExport } from "@/components/landing/FeatureExport";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { PricingSection } from "@/components/landing/PricingSection";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { LandingFooter } from "@/components/landing/LandingFooter";

export default function Index() {
  return (
    <div className="bg-[#08080D] text-[#F2F2F5] font-sans min-h-screen antialiased">
      <LandingNav />
      <HeroSection />
      <SocialProofBar />
      <FeatureOrderCapture />
      <FeatureDashboard />
      <FeatureDistributors />
      <FeaturePayments />
      <FeatureExport />
      <HowItWorks />
      <PricingSection />
      <FinalCTA />
      <LandingFooter />
    </div>
  );
}
