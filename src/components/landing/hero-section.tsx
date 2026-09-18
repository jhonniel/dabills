import Link from "next/link";

import { AppWordmark } from "@/components/brand/app-wordmark";
import { HeroCardsBackdrop } from "@/components/landing/hero-cards-backdrop";
import { Button } from "@/components/ui/button";
import type { ShowcasePlan } from "@/types/showcase";

export function HeroSection({ plans }: { plans: ShowcasePlan[] }) {
  return (
    <section className="relative flex min-h-[100svh] items-center overflow-hidden bg-[#070b12] pb-14 pt-28 sm:pb-24">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,rgba(34,211,238,0.08),transparent_55%)] lg:bg-[radial-gradient(ellipse_at_70%_40%,rgba(34,211,238,0.06),transparent_55%)]" />
        <HeroCardsBackdrop plans={plans} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#070b12] via-[#070b12]/80 to-[#070b12]/40 lg:bg-none" />
        <div className="absolute inset-0 hidden bg-gradient-to-r from-[#070b12] via-[#070b12]/90 to-[#070b12]/30 lg:block" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl">
          <h1 className="sr-only">DaBills</h1>
          <AppWordmark size="hero" priority className="drop-shadow-[0_8px_32px_rgba(0,0,0,0.45)]" />
          <p className="mt-5 max-w-md text-base leading-relaxed text-zinc-300 sm:mt-6 sm:text-lg">
            Recurring bills and subscriptions — tracked in one place. Access is
            by invitation only.
          </p>
          <div className="mt-8 sm:mt-9">
            <Button
              size="lg"
              asChild
              className="h-12 w-full rounded-xl bg-cyan-400 px-8 text-base font-semibold text-black hover:bg-cyan-300 sm:w-auto"
            >
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
