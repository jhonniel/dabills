import { CtaSection } from "@/components/landing/cta-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { HeroSection } from "@/components/landing/hero-section";
import { PricingSection } from "@/components/landing/pricing-section";
import { SubscriptionCarousel } from "@/components/landing/subscription-carousel";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <SubscriptionCarousel />
      <FeaturesSection />
      <PricingSection />
      <CtaSection />
    </>
  );
}
