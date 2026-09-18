import { HeroSection } from "@/components/landing/hero-section";
import { SubscriptionCarousel } from "@/components/landing/subscription-carousel";
import { SystemInfoSection } from "@/components/landing/system-info-section";
import { listPublicShowcasePlans } from "@/features/subscriptions/showcase";

export default async function HomePage() {
  const plans = await listPublicShowcasePlans();

  return (
    <>
      <HeroSection plans={plans} />
      <SubscriptionCarousel plans={plans} />
      <SystemInfoSection />
    </>
  );
}
